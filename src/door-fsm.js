/**
 * Pure sliding door finite state machine (no DOM dependencies).
 */

export const DOOR_STATES = Object.freeze({
  CLOSED: "CLOSED",
  OPENING: "OPENING",
  OPEN: "OPEN",
  HOLD: "HOLD",
  CLOSING: "CLOSING"
});

export const DOOR_ACTIONS = Object.freeze({
  OPEN: "open",
  CLOSE: "close",
  HOLD: "hold",
  RELEASE: "release",
  LOCK: "lock",
  UNLOCK: "unlock",
  OBSTACLE: "obstacle"
});

export const TRANSITION_MS = 2000;
export const AUTO_CLOSE_MS = 5000;

export function createDoorFSM({
  reducedMotion = false,
  onChange = () => {},
  schedule = (fn, ms) => setTimeout(fn, ms),
  cancelSchedule = (id) => clearTimeout(id)
} = {}) {
  let state = DOOR_STATES.CLOSED;
  let locked = false;
  let isReducedMotion = Boolean(reducedMotion);
  let animTimerId = null;
  let autoCloseTimerId = null;

  function clearAnimTimer() {
    if (animTimerId !== null) {
      cancelSchedule(animTimerId);
      animTimerId = null;
    }
  }

  function clearAutoCloseTimer() {
    if (autoCloseTimerId !== null) {
      cancelSchedule(autoCloseTimerId);
      autoCloseTimerId = null;
    }
  }

  function snapshot(lastResult = null) {
    return {
      state,
      locked,
      reducedMotion: isReducedMotion,
      lastResult
    };
  }

  function emit(reason) {
    onChange(snapshot(reason));
  }

  function scheduleAutoClose() {
    clearAutoCloseTimer();
    autoCloseTimerId = schedule(() => {
      autoCloseTimerId = null;
      if (state === DOOR_STATES.OPEN) {
        startClosing("Auto-close after 5 seconds");
      }
    }, AUTO_CLOSE_MS);
  }

  function enterOpen(reason) {
    clearAnimTimer();
    state = DOOR_STATES.OPEN;
    scheduleAutoClose();
    emit(reason);
  }

  function enterClosed(reason) {
    clearAnimTimer();
    clearAutoCloseTimer();
    state = DOOR_STATES.CLOSED;
    emit(reason);
  }

  function startOpening(reason) {
    clearAutoCloseTimer();
    clearAnimTimer();
    if (isReducedMotion) {
      enterOpen(reason);
      return;
    }
    state = DOOR_STATES.OPENING;
    emit(reason);
    animTimerId = schedule(() => {
      animTimerId = null;
      if (state === DOOR_STATES.OPENING) {
        enterOpen("Door opened");
      }
    }, TRANSITION_MS);
  }

  function startClosing(reason) {
    clearAutoCloseTimer();
    clearAnimTimer();
    if (isReducedMotion) {
      enterClosed(reason);
      return;
    }
    state = DOOR_STATES.CLOSING;
    emit(reason);
    animTimerId = schedule(() => {
      animTimerId = null;
      if (state === DOOR_STATES.CLOSING) {
        enterClosed("Door closed");
      }
    }, TRANSITION_MS);
  }

  function dispatch(action) {
    switch (action) {
      case DOOR_ACTIONS.OPEN: {
        if (state === DOOR_STATES.CLOSED && locked) {
          return { ok: false, state, locked, reason: "Door is locked." };
        }
        if (state === DOOR_STATES.CLOSED || state === DOOR_STATES.CLOSING) {
          startOpening("Opening door");
          return { ok: true, state, locked, reason: "Opening door" };
        }
        return { ok: false, state, locked, reason: "Door is already open." };
      }

      case DOOR_ACTIONS.CLOSE: {
        if (state === DOOR_STATES.OPEN || state === DOOR_STATES.HOLD) {
          startClosing("Closing door");
          return { ok: true, state, locked, reason: "Closing door" };
        }
        return { ok: false, state, locked, reason: "Door is not open." };
      }

      case DOOR_ACTIONS.HOLD: {
        if (state === DOOR_STATES.OPEN || state === DOOR_STATES.OPENING) {
          clearAnimTimer();
          clearAutoCloseTimer();
          state = DOOR_STATES.HOLD;
          emit("Door held open");
          return { ok: true, state, locked, reason: "Door held open" };
        }
        return { ok: false, state, locked, reason: "Open the door first." };
      }

      case DOOR_ACTIONS.RELEASE: {
        if (state === DOOR_STATES.HOLD) {
          enterOpen("Hold released");
          return { ok: true, state, locked, reason: "Hold released" };
        }
        return { ok: false, state, locked, reason: "Door is not on hold." };
      }

      case DOOR_ACTIONS.LOCK: {
        if (state !== DOOR_STATES.CLOSED) {
          return { ok: false, state, locked, reason: "Close the door first." };
        }
        locked = true;
        emit("Door locked");
        return { ok: true, state, locked, reason: "Door locked" };
      }

      case DOOR_ACTIONS.UNLOCK: {
        locked = false;
        emit("Door unlocked");
        return { ok: true, state, locked, reason: "Door unlocked" };
      }

      case DOOR_ACTIONS.OBSTACLE: {
        if (state === DOOR_STATES.CLOSING) {
          startOpening("Obstacle");
          return { ok: true, state, locked, reason: "Obstacle" };
        }
        emit("Obstacle");
        return { ok: false, state, locked, reason: "Obstacle" };
      }

      default:
        return { ok: false, state, locked, reason: "Unknown action." };
    }
  }

  function setReducedMotion(value) {
    isReducedMotion = Boolean(value);
    if (isReducedMotion && state === DOOR_STATES.OPENING) {
      enterOpen("Door opened (reduced motion)");
    } else if (isReducedMotion && state === DOOR_STATES.CLOSING) {
      enterClosed("Door closed (reduced motion)");
    }
  }

  function destroy() {
    clearAnimTimer();
    clearAutoCloseTimer();
  }

  return {
    dispatch,
    getSnapshot: () => snapshot(null),
    setReducedMotion,
    destroy
  };
}
