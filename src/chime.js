/**
 * Low-volume two-tone chime made with WebAudio (no audio file).
 * Browsers block audio before a click, so unlock() must run from a user gesture.
 */

export function createChime({
  createContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)(),
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancelSchedule = (id) => clearTimeout(id)
} = {}) {
  const GAIN = 0.04;
  const REPEAT_MS = 2500;
  let ctx = null;
  let enabled = true;
  let running = false;
  let timerId = null;

  function status() {
    if (!enabled) {
      return "Sound off. The banner still shows the alert.";
    }
    if (!ctx) {
      return "Sound on. Audio starts after your first click on this page.";
    }
    return ctx.state === "running"
      ? "Sound on."
      : "Sound blocked by the browser. Click the page once.";
  }

  function unlock() {
    try {
      if (!ctx) {
        ctx = createContext();
      }
      if (ctx.state === "suspended") {
        ctx.resume();
      }
    } catch {
      ctx = null;
    }
  }

  function beep(frequency, at, length) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = GAIN;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(at);
    osc.stop(at + length);
  }

  function pattern() {
    timerId = null;
    if (!running) {
      return;
    }
    if (enabled && ctx && ctx.state === "running") {
      const t = ctx.currentTime;
      beep(880, t, 0.15);
      beep(660, t + 0.25, 0.15);
    }
    timerId = schedule(pattern, REPEAT_MS);
  }

  function start() {
    if (running) {
      return;
    }
    running = true;
    pattern();
  }

  function stop() {
    running = false;
    if (timerId !== null) {
      cancelSchedule(timerId);
      timerId = null;
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
  }

  return { unlock, start, stop, setEnabled, status, isRunning: () => running };
}
