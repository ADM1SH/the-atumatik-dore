/**
 * Simulated child-in-car alert (pure, no DOM). Demo only, not a safety device.
 * The countdown runs to a fixed deadline from now(), so slow background timers
 * cannot stretch it. The page calls tick() from a timer and on visibilitychange.
 */

export const COUNTDOWN_MS = 60000;
export const TICK_MS = 250;

export function createChildAlert({
  car,
  now = () => Date.now(),
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancelSchedule = (id) => clearTimeout(id),
  onChange = () => {}
} = {}) {
  let childPresent = false;
  let distance = 2;
  let limit = 5;
  let armed = true;
  let phase = "idle";
  let deadline = 0;
  let timerId = null;
  let lastCar = car.getSnapshot();

  function snapshot() {
    return {
      phase,
      childPresent,
      ownerDistanceM: distance,
      alertLimitM: limit,
      armed,
      remainingMs: phase === "countdown" ? Math.max(0, deadline - now()) : 0
    };
  }

  const emit = (event) => onChange(snapshot(), event);

  function stopTimer() {
    if (timerId !== null) {
      cancelSchedule(timerId);
      timerId = null;
    }
  }

  function toIdle(event) {
    stopTimer();
    phase = "idle";
    emit(event);
  }

  function loop() {
    timerId = null;
    tick();
    if (phase === "countdown") {
      timerId = schedule(loop, TICK_MS);
    }
  }

  function tick() {
    if (phase !== "countdown") {
      return;
    }
    if (now() >= deadline) {
      stopTimer();
      phase = "ventilating";
      car.ventilate();
      emit("ventilating");
      return;
    }
    emit("tick");
  }

  function start() {
    phase = "countdown";
    deadline = now() + COUNTDOWN_MS;
    stopTimer();
    timerId = schedule(loop, TICK_MS);
    emit("started");
  }

  const carReady = () => !lastCar.engine && lastCar.locked;

  function cancel(why) {
    armed = true;
    toIdle(`cancelled: ${why}`);
  }

  function applyDistance(movingAway) {
    if (distance <= limit) {
      armed = true;
      if (phase !== "idle") {
        toIdle("response: owner back within limit");
      }
      return;
    }
    if (phase === "idle" && armed && childPresent && carReady() && movingAway) {
      start();
    }
  }

  function setOwnerDistance(meters) {
    const next = Math.min(30, Math.max(0, Number(meters)));
    if (!Number.isFinite(next)) {
      return;
    }
    const movingAway = next > distance;
    distance = next;
    applyDistance(movingAway);
  }

  function setAlertLimit(meters) {
    const next = Math.min(30, Math.max(0, Number(meters)));
    if (!Number.isFinite(next)) {
      return;
    }
    limit = next;
    applyDistance(false);
  }

  function setChildPresent(value) {
    const next = Boolean(value);
    if (next === childPresent) {
      return;
    }
    childPresent = next;
    armed = true;
    if (!next && phase !== "idle") {
      cancel("child removed");
    }
  }

  // Call this on every car change.
  function notifyCar(carState) {
    const changed = carState.engine !== lastCar.engine || carState.locked !== lastCar.locked;
    lastCar = carState;
    if (!changed) {
      return;
    }
    armed = true;
    if (phase !== "idle" && !carReady()) {
      cancel(carState.engine ? "engine started" : "car unlocked");
    }
  }

  // source: "ack", "keyfob", or "voice". A voice response needs a verified owner.
  function respond({ source, ownerVerified = false } = {}) {
    if (phase === "idle") {
      return { ok: false, reason: "No alert is active." };
    }
    if (source === "voice" && !ownerVerified) {
      return { ok: false, reason: "Speaker not verified. Alert continues." };
    }
    armed = false;
    toIdle(`response: ${source}`);
    return { ok: true, reason: "Alert stopped." };
  }

  function destroy() {
    stopTimer();
  }

  return {
    setOwnerDistance,
    setAlertLimit,
    setChildPresent,
    notifyCar,
    respond,
    tick,
    destroy,
    getState: snapshot
  };
}
