import test from "node:test";
import assert from "node:assert/strict";
import { createCar, DOOR_KEYS, WINDOW_KEYS } from "../src/car.js";

function makeCar() {
  const events = [];
  const car = createCar({ onChange: (snap, reason) => events.push({ snap, reason }) });
  return { car, events };
}

const windowCmd = (target, position) => ({ type: "window", target, position });

test("defaults: engine off, unlocked, no keyfob, all doors closed, all windows closed", () => {
  const { car, events } = makeCar();
  const s = car.getSnapshot();
  assert.equal(s.engine, false);
  assert.equal(s.locked, false);
  assert.equal(s.keyfobCarried, false);
  assert.deepEqual(DOOR_KEYS.map((k) => s.doors[k]), [false, false, false, false, false]);
  assert.deepEqual(WINDOW_KEYS.map((k) => s.windows[k]), [0, 0, 0, 0]);
  assert.equal(events.length, 0);
});

test("engine toggles and a repeat is refused without a change event", () => {
  const { car, events } = makeCar();
  assert.equal(car.dispatch({ type: "engine", on: true }).ok, true);
  assert.equal(car.getSnapshot().engine, true);
  const again = car.dispatch({ type: "engine", on: true });
  assert.equal(again.ok, false);
  assert.equal(again.reason, "Engine is already on.");
  assert.equal(events.length, 1);
});

test("lock is refused while any door is open and works once all are closed", () => {
  const { car } = makeCar();
  car.dispatch({ type: "kick", door: "rr" });
  const refused = car.dispatch({ type: "lock" });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, "Close all doors first.");
  assert.equal(car.getSnapshot().locked, false);

  car.dispatch({ type: "closeDoor", door: "rr" });
  assert.equal(car.dispatch({ type: "lock" }).ok, true);
  assert.equal(car.getSnapshot().locked, true);
  assert.equal(car.dispatch({ type: "unlock" }).ok, true);
  assert.equal(car.getSnapshot().locked, false);
});

test("the tailgate counts as a door for the lock rule", () => {
  const { car } = makeCar();
  car.dispatch({ type: "kick", door: "tg" });
  assert.equal(car.dispatch({ type: "lock" }).reason, "Close all doors first.");
});

test("kick opens a closed unlocked door and Close closes it", () => {
  const { car } = makeCar();
  const kick = car.dispatch({ type: "kick", door: "fl" });
  assert.equal(kick.ok, true);
  assert.equal(car.getSnapshot().doors.fl, true);
  const close = car.dispatch({ type: "closeDoor", door: "fl" });
  assert.equal(close.ok, true);
  assert.equal(car.getSnapshot().doors.fl, false);
});

test("kick on an open door is ignored and Close on a closed door is refused", () => {
  const { car, events } = makeCar();
  car.dispatch({ type: "kick", door: "fr" });
  const count = events.length;
  const again = car.dispatch({ type: "kick", door: "fr" });
  assert.equal(again.ok, false);
  assert.equal(again.reason, "Door already open");
  const closed = car.dispatch({ type: "closeDoor", door: "rl" });
  assert.equal(closed.ok, false);
  assert.equal(closed.reason, "Rear left door is already closed.");
  assert.equal(events.length, count);
});

test("kick on a locked car: ignored without the keyfob, unlocks and opens with it", () => {
  const { car } = makeCar();
  car.dispatch({ type: "lock" });
  const noFob = car.dispatch({ type: "kick", door: "fl" });
  assert.equal(noFob.ok, false);
  assert.equal(noFob.reason, "Locked: keyfob required");
  assert.equal(car.getSnapshot().locked, true);
  assert.equal(car.getSnapshot().doors.fl, false);

  car.dispatch({ type: "keyfobCarried", on: true });
  const withFob = car.dispatch({ type: "kick", door: "fl" });
  assert.equal(withFob.ok, true);
  assert.equal(car.getSnapshot().locked, false);
  assert.equal(car.getSnapshot().doors.fl, true);
});

test("window commands are refused with the engine off and no keyfob, and change nothing", () => {
  const { car, events } = makeCar();
  const res = car.dispatch(windowCmd("fr", 100));
  assert.equal(res.ok, false);
  assert.equal(res.reason, "Windows need the engine on or the keyfob carried.");
  assert.equal(car.getSnapshot().windows.fr, 0);
  assert.equal(events.length, 0);
});

test("window commands work with the engine on or with the keyfob carried", () => {
  const a = makeCar().car;
  a.dispatch({ type: "engine", on: true });
  assert.equal(a.dispatch(windowCmd("fr", 50)).ok, true);
  assert.equal(a.getSnapshot().windows.fr, 50);

  const b = makeCar().car;
  b.dispatch({ type: "keyfobCarried", on: true });
  assert.equal(b.dispatch(windowCmd("rl", 100)).ok, true);
  assert.equal(b.getSnapshot().windows.rl, 100);
});

test("window target all moves every window and positions are 0, 50, or 100 only", () => {
  const { car } = makeCar();
  car.dispatch({ type: "engine", on: true });
  assert.equal(car.dispatch(windowCmd("all", 100)).ok, true);
  assert.deepEqual(WINDOW_KEYS.map((k) => car.getSnapshot().windows[k]), [100, 100, 100, 100]);
  assert.equal(car.dispatch(windowCmd("all", 100)).reason, "All windows already at 100%.");
  assert.equal(car.dispatch(windowCmd("fl", 30)).reason, "Unknown window position.");
  assert.equal(car.dispatch(windowCmd("roof", 0)).reason, "Unknown window.");
});

test("ventilate raises windows below 50 to 50, leaves wider windows, and ignores the window rule", () => {
  const { car } = makeCar();
  car.dispatch({ type: "engine", on: true });
  car.dispatch(windowCmd("fr", 100));
  car.dispatch(windowCmd("rl", 50));
  car.dispatch({ type: "engine", on: false });

  const res = car.ventilate();
  assert.equal(res.ok, true);
  const w = car.getSnapshot().windows;
  assert.deepEqual([w.fl, w.fr, w.rl, w.rr], [50, 100, 50, 50]);
  assert.equal(car.ventilate().ok, false);
});

test("snapshots are copies and unknown actions are refused", () => {
  const { car } = makeCar();
  const snap = car.getSnapshot();
  snap.doors.fl = true;
  snap.windows.fl = 100;
  assert.equal(car.getSnapshot().doors.fl, false);
  assert.equal(car.getSnapshot().windows.fl, 0);
  assert.equal(car.dispatch({ type: "explode" }).reason, "Unknown action.");
  assert.equal(car.dispatch(undefined).ok, false);
});

test("onChange fires once per accepted action with the reason", () => {
  const { car, events } = makeCar();
  car.dispatch({ type: "lock" });
  car.dispatch({ type: "lock" });
  assert.equal(events.length, 1);
  assert.equal(events[0].reason, "Car locked");
  assert.equal(events[0].snap.locked, true);
});

test("keyfob windows down and up always work, even with the engine off and no keyfob carried", () => {
  const { car } = makeCar();
  assert.equal(car.dispatch({ type: "keyfob", button: "down" }).ok, true);
  assert.deepEqual(WINDOW_KEYS.map((k) => car.getSnapshot().windows[k]), [100, 100, 100, 100]);
  assert.equal(car.dispatch({ type: "keyfob", button: "down" }).ok, false);
  assert.equal(car.dispatch({ type: "keyfob", button: "up" }).ok, true);
  assert.deepEqual(WINDOW_KEYS.map((k) => car.getSnapshot().windows[k]), [0, 0, 0, 0]);
});

test("keyfob lock refuses while a door is open and unlock works", () => {
  const { car } = makeCar();
  car.dispatch({ type: "kick", door: "rl" });
  const refused = car.dispatch({ type: "keyfob", button: "lock" });
  assert.equal(refused.ok, false);
  assert.equal(refused.reason, "Close all doors first.");
  car.dispatch({ type: "closeDoor", door: "rl" });
  assert.equal(car.dispatch({ type: "keyfob", button: "lock" }).ok, true);
  assert.equal(car.getSnapshot().locked, true);
  assert.equal(car.dispatch({ type: "keyfob", button: "unlock" }).ok, true);
  assert.equal(car.getSnapshot().locked, false);
  assert.equal(car.dispatch({ type: "keyfob", button: "honk" }).reason, "Unknown keyfob button.");
});

test("kick on a locked car with the keyfob unlocks the whole car for every door and the tailgate", () => {
  for (const door of DOOR_KEYS) {
    const { car } = makeCar();
    car.dispatch({ type: "keyfobCarried", on: true });
    car.dispatch({ type: "lock" });
    const res = car.dispatch({ type: "kick", door });
    assert.equal(res.ok, true, door);
    const s = car.getSnapshot();
    assert.equal(s.locked, false, door);
    assert.deepEqual(DOOR_KEYS.filter((k) => s.doors[k]), [door]);
  }
});
