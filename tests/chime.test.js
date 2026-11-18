import test from "node:test";
import assert from "node:assert/strict";
import { createChime } from "../src/chime.js";

function fakeAudio(initialState = "suspended") {
  const log = { created: 0, resumed: 0, oscillators: [] };
  const ctx = {
    state: initialState,
    currentTime: 1,
    destination: {},
    resume() {
      log.resumed += 1;
      ctx.state = "running";
    },
    createOscillator() {
      const osc = { frequency: {}, connect() {}, start() {}, stop() {} };
      log.oscillators.push(osc);
      return osc;
    },
    createGain() {
      return { gain: {}, connect() {} };
    }
  };
  return { ctx, log, createContext: () => { log.created += 1; return ctx; } };
}

function fakeTimers() {
  let id = 1;
  const timers = new Map();
  return {
    schedule: (fn) => { timers.set(id, fn); return id++; },
    cancelSchedule: (i) => timers.delete(i),
    fireAll() { const fns = [...timers.values()]; timers.clear(); fns.forEach((f) => f()); },
    size: () => timers.size
  };
}

test("chime stays silent until unlock runs from a gesture, then plays two tones", () => {
  const audio = fakeAudio();
  const timers = fakeTimers();
  const chime = createChime({ createContext: audio.createContext, ...timers });
  chime.start();
  assert.equal(audio.log.oscillators.length, 0);
  assert.match(chime.status(), /first click/);

  chime.unlock();
  assert.equal(audio.log.resumed, 1);
  timers.fireAll();
  assert.equal(audio.log.oscillators.length, 2);
  assert.equal(chime.status(), "Sound on.");
});

test("sound toggle off keeps the chime silent and stop clears the timer", () => {
  const audio = fakeAudio("running");
  const timers = fakeTimers();
  const chime = createChime({ createContext: audio.createContext, ...timers });
  chime.unlock();
  chime.setEnabled(false);
  chime.start();
  timers.fireAll();
  assert.equal(audio.log.oscillators.length, 0);
  assert.match(chime.status(), /Sound off/);
  chime.stop();
  assert.equal(timers.size(), 0);
  assert.equal(chime.isRunning(), false);
});
