import test from "node:test";
import assert from "node:assert/strict";
import { createDoorFSM, DOOR_STATES, DOOR_ACTIONS, TRANSITION_MS, AUTO_CLOSE_MS } from "../src/door-fsm.js";

function createFakeTimers() {
  let nextId = 1;
  const timers = new Map();

  return {
    schedule(fn, ms) {
      const id = nextId++;
      timers.set(id, { fn, ms });
      return id;
    },
    cancelSchedule(id) {
      timers.delete(id);
    },
    runNextByMs(ms) {
      for (const [id, item] of timers.entries()) {
        if (item.ms === ms) {
          timers.delete(id);
          item.fn();
          return true;
        }
      }
      return false;
    },
    count() {
      return timers.size;
    }
  };
}

test("door opens from CLOSED unlocked and completes after 2 seconds then auto-closes after 5 seconds", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSED);

  const openRes = fsm.dispatch(DOOR_ACTIONS.OPEN);
  assert.equal(openRes.ok, true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPENING);

  assert.equal(clock.runNextByMs(TRANSITION_MS), true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPEN);

  assert.equal(clock.runNextByMs(AUTO_CLOSE_MS), true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSING);

  assert.equal(clock.runNextByMs(TRANSITION_MS), true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSED);
});

test("open from CLOSING reverses door to OPENING", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  fsm.dispatch(DOOR_ACTIONS.OPEN);
  clock.runNextByMs(TRANSITION_MS);
  clock.runNextByMs(AUTO_CLOSE_MS);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSING);

  const reopen = fsm.dispatch(DOOR_ACTIONS.OPEN);
  assert.equal(reopen.ok, true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPENING);
});

test("lock works only when CLOSED and blocks open until unlock", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  const lockOk = fsm.dispatch(DOOR_ACTIONS.LOCK);
  assert.equal(lockOk.ok, true);
  assert.equal(fsm.getSnapshot().locked, true);

  const deniedOpen = fsm.dispatch(DOOR_ACTIONS.OPEN);
  assert.equal(deniedOpen.ok, false);
  assert.equal(deniedOpen.reason, "Door is locked.");
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSED);

  const unlockOk = fsm.dispatch(DOOR_ACTIONS.UNLOCK);
  assert.equal(unlockOk.ok, true);
  assert.equal(fsm.getSnapshot().locked, false);

  const openNow = fsm.dispatch(DOOR_ACTIONS.OPEN);
  assert.equal(openNow.ok, true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPENING);

  const lockWhileOpening = fsm.dispatch(DOOR_ACTIONS.LOCK);
  assert.equal(lockWhileOpening.ok, false);
  assert.equal(lockWhileOpening.reason, "Close the door first.");
});

test("hold from OPEN or OPENING keeps door open and release restarts auto-close", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  fsm.dispatch(DOOR_ACTIONS.OPEN);
  const holdRes = fsm.dispatch(DOOR_ACTIONS.HOLD);
  assert.equal(holdRes.ok, true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.HOLD);
  assert.equal(clock.count(), 0);

  const releaseRes = fsm.dispatch(DOOR_ACTIONS.RELEASE);
  assert.equal(releaseRes.ok, true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPEN);
  assert.equal(clock.runNextByMs(AUTO_CLOSE_MS), true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSING);
});

test("close transitions from OPEN or HOLD to CLOSING", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  fsm.dispatch(DOOR_ACTIONS.OPEN);
  clock.runNextByMs(TRANSITION_MS);
  fsm.dispatch(DOOR_ACTIONS.HOLD);
  const closeFromHold = fsm.dispatch(DOOR_ACTIONS.CLOSE);
  assert.equal(closeFromHold.ok, true);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSING);
});

test("obstacle reverses CLOSING to OPENING and logs Obstacle in other states without moving", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  const closedObstacle = fsm.dispatch(DOOR_ACTIONS.OBSTACLE);
  assert.equal(closedObstacle.ok, false);
  assert.equal(closedObstacle.reason, "Obstacle");
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSED);

  fsm.dispatch(DOOR_ACTIONS.OPEN);
  clock.runNextByMs(TRANSITION_MS);
  clock.runNextByMs(AUTO_CLOSE_MS);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSING);

  const closingObstacle = fsm.dispatch(DOOR_ACTIONS.OBSTACLE);
  assert.equal(closingObstacle.ok, true);
  assert.equal(closingObstacle.reason, "Obstacle");
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPENING);
});

test("reducedMotion changes state at once without waiting 2 seconds", () => {
  const clock = createFakeTimers();
  const fsm = createDoorFSM({
    reducedMotion: true,
    schedule: clock.schedule,
    cancelSchedule: clock.cancelSchedule
  });

  fsm.dispatch(DOOR_ACTIONS.OPEN);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.OPEN);

  fsm.dispatch(DOOR_ACTIONS.CLOSE);
  assert.equal(fsm.getSnapshot().state, DOOR_STATES.CLOSED);
});
