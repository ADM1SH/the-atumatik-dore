/**
 * Pure car state and rules (no DOM, no timers).
 * State changes at once. The page animates doors and windows with CSS.
 */

export const DOOR_KEYS = Object.freeze(["fl", "fr", "rl", "rr", "tg"]);
export const WINDOW_KEYS = Object.freeze(["fl", "fr", "rl", "rr"]);
export const WINDOW_POSITIONS = Object.freeze([0, 50, 100]);

const DOOR_LABEL = Object.freeze({
  fl: "Front left door",
  fr: "Front right door",
  rl: "Rear left door",
  rr: "Rear right door",
  tg: "Tailgate"
});

const WINDOW_LABEL = Object.freeze({
  fl: "Front left window",
  fr: "Front right window",
  rl: "Rear left window",
  rr: "Rear right window"
});

// Map a voice or Mode B action and target to a car action. Returns null if unknown.
export function voiceAction(action, target) {
  switch (action) {
    case "lock":
    case "unlock":
      return { type: action };
    case "open":
      return { type: "window", target, position: 100 };
    case "half":
      return { type: "window", target, position: 50 };
    case "close":
      return { type: "window", target, position: 0 };
    default:
      return null;
  }
}

export function createCar({ onChange = () => {} } = {}) {
  const s = {
    engine: false,
    locked: false,
    keyfobCarried: false,
    doors: Object.fromEntries(DOOR_KEYS.map((key) => [key, false])),
    windows: Object.fromEntries(WINDOW_KEYS.map((key) => [key, 0]))
  };

  function snapshot() {
    return {
      engine: s.engine,
      locked: s.locked,
      keyfobCarried: s.keyfobCarried,
      doors: { ...s.doors },
      windows: { ...s.windows }
    };
  }

  function done(ok, reason) {
    if (ok) {
      onChange(snapshot(), reason);
    }
    return { ok, reason, state: snapshot() };
  }

  const anyDoorOpen = () => DOOR_KEYS.some((key) => s.doors[key]);

  function setWindows(keys, position) {
    let changed = false;
    for (const key of keys) {
      if (s.windows[key] !== position) {
        s.windows[key] = position;
        changed = true;
      }
    }
    return changed;
  }

  function dispatch(action) {
    switch (action && action.type) {
      case "engine": {
        const on = Boolean(action.on);
        if (s.engine === on) {
          return done(false, on ? "Engine is already on." : "Engine is already off.");
        }
        s.engine = on;
        return done(true, on ? "Engine on" : "Engine off");
      }

      case "keyfobCarried": {
        const on = Boolean(action.on);
        if (s.keyfobCarried === on) {
          return done(false, on ? "Keyfob is already carried." : "Keyfob is already left behind.");
        }
        s.keyfobCarried = on;
        return done(true, on ? "Keyfob carried" : "Keyfob not carried");
      }

      case "lock": {
        if (anyDoorOpen()) {
          return done(false, "Close all doors first.");
        }
        if (s.locked) {
          return done(false, "Car is already locked.");
        }
        s.locked = true;
        return done(true, "Car locked");
      }

      case "unlock": {
        if (!s.locked) {
          return done(false, "Car is already unlocked.");
        }
        s.locked = false;
        return done(true, "Car unlocked");
      }

      case "window": {
        if (!s.engine && !s.keyfobCarried) {
          return done(false, "Windows need the engine on or the keyfob carried.");
        }
        if (!WINDOW_POSITIONS.includes(action.position)) {
          return done(false, "Unknown window position.");
        }
        const isAll = action.target === "all";
        if (!isAll && !WINDOW_KEYS.includes(action.target)) {
          return done(false, "Unknown window.");
        }
        const keys = isAll ? WINDOW_KEYS : [action.target];
        const label = isAll ? "All windows" : WINDOW_LABEL[action.target];
        if (!setWindows(keys, action.position)) {
          return done(false, `${label} already at ${action.position}%.`);
        }
        return done(true, `${label} set to ${action.position}%`);
      }

      case "closeDoor": {
        if (!DOOR_KEYS.includes(action.door)) {
          return done(false, "Unknown door.");
        }
        if (!s.doors[action.door]) {
          return done(false, `${DOOR_LABEL[action.door]} is already closed.`);
        }
        s.doors[action.door] = false;
        return done(true, `${DOOR_LABEL[action.door]} closed`);
      }

      case "kick": {
        if (!DOOR_KEYS.includes(action.door)) {
          return done(false, "Unknown door.");
        }
        if (s.doors[action.door]) {
          return done(false, "Door already open");
        }
        if (s.locked) {
          if (!s.keyfobCarried) {
            return done(false, "Locked: keyfob required");
          }
          s.locked = false;
          s.doors[action.door] = true;
          return done(true, `Car unlocked, ${DOOR_LABEL[action.door].toLowerCase()} opened`);
        }
        s.doors[action.door] = true;
        return done(true, `${DOOR_LABEL[action.door]} opened`);
      }

      // Keyfob buttons always work. Lock still refuses while a door is open.
      case "keyfob": {
        if (action.button === "lock" || action.button === "unlock") {
          return dispatch({ type: action.button });
        }
        if (action.button === "down" || action.button === "up") {
          const position = action.button === "down" ? 100 : 0;
          if (!setWindows(WINDOW_KEYS, position)) {
            return done(false, `Keyfob: windows already ${position === 100 ? "down" : "up"}.`);
          }
          return done(true, `Keyfob: all windows ${position === 100 ? "down (open)" : "up (closed)"}`);
        }
        return done(false, "Unknown keyfob button.");
      }

      default:
        return done(false, "Unknown action.");
    }
  }

  // Internal action for the child alert. It ignores the window rule on purpose
  // and is not reachable from voice or Mode B.
  function ventilate() {
    let changed = false;
    for (const key of WINDOW_KEYS) {
      if (s.windows[key] < 50) {
        s.windows[key] = 50;
        changed = true;
      }
    }
    return done(changed, changed ? "Windows moved to 50%" : "Windows already at 50% or more");
  }

  return { dispatch, ventilate, getSnapshot: snapshot };
}
