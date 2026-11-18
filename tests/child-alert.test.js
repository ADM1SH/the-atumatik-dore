import test from "node:test";
import assert from "node:assert/strict";
import { createCar } from "../src/car.js";
import { createChildAlert, COUNTDOWN_MS } from "../src/child-alert.js";

// Car ends locked, engine off, windows fl 0, fr 100, rl 50, rr 0.
function setup() {
  let t = 0;
  let nextId = 1;
  const timers = new Map();
  const events = [];
  let alert = null;
  const car = createCar({ onChange: (snap) => alert && alert.notifyCar(snap) });
  car.dispatch({ type: "engine", on: true });
  car.dispatch({ type: "window", target: "fr", position: 100 });
  car.dispatch({ type: "window", target: "rl", position: 50 });
  car.dispatch({ type: "engine", on: false });
  car.dispatch({ type: "lock" });
  alert = createChildAlert({
    car,
    now: () => t,
    schedule: (fn, ms) => {
      timers.set(nextId, { fn, ms });
      return nextId++;
    },
    cancelSchedule: (id) => timers.delete(id),
    onChange: (_state, event) => events.push(event)
  });
  const advance = (ms) => {
    t += ms;
    alert.tick();
  };
  const win = () => {
    const w = car.getSnapshot().windows;
    return [w.fl, w.fr, w.rl, w.rr];
  };
  const startAlert = () => {
    alert.setChildPresent(true);
    alert.setOwnerDistance(10);
  };
  return { car, alert, advance, win, startAlert, events, timers };
}

test("the alert needs every start condition", () => {
  let s = setup();
  s.alert.setOwnerDistance(10);
  assert.equal(s.alert.getState().phase, "idle", "no child");

  s = setup();
  s.car.dispatch({ type: "engine", on: true });
  s.startAlert();
  assert.equal(s.alert.getState().phase, "idle", "engine on");

  s = setup();
  s.car.dispatch({ type: "unlock" });
  s.startAlert();
  assert.equal(s.alert.getState().phase, "idle", "unlocked");

  s = setup();
  s.alert.setChildPresent(true);
  s.alert.setOwnerDistance(4);
  assert.equal(s.alert.getState().phase, "idle", "within limit");

  s = setup();
  s.alert.setChildPresent(true);
  s.alert.setAlertLimit(1);
  s.alert.setOwnerDistance(2);
  assert.equal(s.alert.getState().phase, "idle", "not moving away");

  s = setup();
  s.startAlert();
  assert.equal(s.alert.getState().phase, "countdown");
  assert.equal(s.alert.getState().remainingMs, COUNTDOWN_MS);
});

test("59 s moves no windows, 60 s moves windows below 50 to 50 and leaves wider ones", () => {
  const s = setup();
  s.startAlert();
  s.advance(59000);
  assert.equal(s.alert.getState().phase, "countdown");
  assert.equal(s.alert.getState().remainingMs, 1000);
  assert.deepEqual(s.win(), [0, 100, 50, 0]);

  s.advance(1000);
  assert.equal(s.alert.getState().phase, "ventilating");
  assert.deepEqual(s.win(), [50, 100, 50, 50]);
  assert.ok(s.events.includes("ventilating"));
});

test("the deadline holds when timers are throttled: one late tick still fires", () => {
  const s = setup();
  s.startAlert();
  s.advance(61000);
  assert.equal(s.alert.getState().phase, "ventilating");
  assert.deepEqual(s.win(), [50, 100, 50, 50]);
});

test("each response stops the countdown and moves no windows", () => {
  const cases = [
    ["acknowledge", (a) => a.respond({ source: "ack" })],
    ["keyfob button", (a) => a.respond({ source: "keyfob" })],
    ["verified voice", (a) => a.respond({ source: "voice", ownerVerified: true })],
    ["owner back within limit", (a) => a.setOwnerDistance(5)]
  ];
  for (const [name, act] of cases) {
    const s = setup();
    s.startAlert();
    s.advance(30000);
    act(s.alert);
    assert.equal(s.alert.getState().phase, "idle", name);
    assert.deepEqual(s.win(), [0, 100, 50, 0], name);
    assert.equal(s.timers.size, 0, `${name}: timer cleared`);
    s.advance(40000);
    assert.deepEqual(s.win(), [0, 100, 50, 0], `${name}: stays stopped`);
  }
});

test("a stranger voice does not stop the alert", () => {
  const s = setup();
  s.startAlert();
  const res = s.alert.respond({ source: "voice", ownerVerified: false });
  assert.equal(res.ok, false);
  assert.equal(s.alert.getState().phase, "countdown");
  s.advance(60000);
  assert.equal(s.alert.getState().phase, "ventilating");
  assert.equal(s.alert.respond({ source: "voice", ownerVerified: false }).ok, false);
  assert.equal(s.alert.getState().phase, "ventilating");
});

test("each cancel rule ends the alert", () => {
  let s = setup();
  s.startAlert();
  s.alert.setChildPresent(false);
  assert.equal(s.alert.getState().phase, "idle");
  assert.ok(s.events.includes("cancelled: child removed"));

  s = setup();
  s.startAlert();
  s.car.dispatch({ type: "unlock" });
  assert.equal(s.alert.getState().phase, "idle");
  assert.ok(s.events.includes("cancelled: car unlocked"));

  s = setup();
  s.startAlert();
  s.car.dispatch({ type: "engine", on: true });
  assert.equal(s.alert.getState().phase, "idle");
  assert.ok(s.events.includes("cancelled: engine started"));
  s.advance(70000);
  assert.deepEqual(s.win(), [0, 100, 50, 0]);
});

test("ventilating keeps going until a response, and the windows stay where they are", () => {
  const s = setup();
  s.startAlert();
  s.advance(60000);
  s.advance(120000);
  assert.equal(s.alert.getState().phase, "ventilating");
  s.alert.respond({ source: "ack" });
  assert.equal(s.alert.getState().phase, "idle");
  assert.deepEqual(s.win(), [50, 100, 50, 50]);
});

test("the automatic window move ignores the window rule (engine off, no keyfob)", () => {
  const s = setup();
  assert.equal(s.car.getSnapshot().engine, false);
  assert.equal(s.car.getSnapshot().keyfobCarried, false);
  s.startAlert();
  s.advance(60000);
  assert.deepEqual(s.win(), [50, 100, 50, 50]);
});

test("re-arm: a response at 10 m does not restart, coming back or a state change does", () => {
  let s = setup();
  s.startAlert();
  s.alert.respond({ source: "ack" });
  s.alert.setOwnerDistance(12);
  assert.equal(s.alert.getState().phase, "idle");
  assert.equal(s.alert.getState().armed, false);
  s.alert.setOwnerDistance(4);
  assert.equal(s.alert.getState().armed, true);
  s.alert.setOwnerDistance(9);
  assert.equal(s.alert.getState().phase, "countdown");

  s = setup();
  s.startAlert();
  s.alert.respond({ source: "keyfob" });
  s.car.dispatch({ type: "unlock" });
  s.car.dispatch({ type: "lock" });
  s.alert.setOwnerDistance(15);
  assert.equal(s.alert.getState().phase, "countdown");

  s = setup();
  s.startAlert();
  s.alert.respond({ source: "ack" });
  s.alert.setChildPresent(false);
  s.alert.setChildPresent(true);
  s.alert.setOwnerDistance(20);
  assert.equal(s.alert.getState().phase, "countdown");
});

test("remaining time counts down from the fixed deadline and a response with no alert is refused", () => {
  const s = setup();
  assert.equal(s.alert.respond({ source: "ack" }).ok, false);
  s.startAlert();
  s.advance(15000);
  assert.equal(s.alert.getState().remainingMs, 45000);
  assert.ok(s.events.includes("started"));
  assert.ok(s.events.includes("tick"));
});
