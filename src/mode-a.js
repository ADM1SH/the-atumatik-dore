/**
 * Mode A: Coded whole-word command matcher (no LLM or API call).
 * One command per sentence. Anything unclear is "Not understood".
 */

const NOT_UNDERSTOOD = Object.freeze({
  matched: false,
  action: "none",
  target: "none",
  phrase: null,
  reason: "Not understood"
});

const WINDOW_TARGETS = Object.freeze([
  { target: "fr", words: ["front right", "driver"] },
  { target: "fl", words: ["front left", "passenger"] },
  { target: "rl", words: ["rear left"] },
  { target: "rr", words: ["rear right"] },
  { target: "all", words: ["all"] }
]);

const WINDOW_VERBS = Object.freeze([
  { action: "half", words: ["half way", "halfway", "half"] },
  { action: "open", words: ["open"] },
  { action: "close", words: ["close", "shut"] }
]);

const CAR_WORDS = Object.freeze([
  { action: "unlock", words: ["unlock"] },
  { action: "lock", words: ["lock"] }
]);

function wordRegex(phrase) {
  return new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "i");
}

function findAll(table, key, normalized) {
  const found = [];
  for (const entry of table) {
    for (const phrase of entry.words) {
      if (wordRegex(phrase).test(normalized)) {
        found.push({ key: entry[key], phrase });
        break;
      }
    }
  }
  return found;
}

export function normalizeCommandText(input) {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchModeACommand(transcript) {
  const normalized = normalizeCommandText(transcript);
  if (!normalized) {
    return NOT_UNDERSTOOD;
  }

  const carWords = findAll(CAR_WORDS, "action", normalized);
  let verbs = findAll(WINDOW_VERBS, "action", normalized);
  // "open halfway" and "half open" mean half. "close halfway" stays ambiguous.
  if (verbs.some((v) => v.key === "half")) {
    verbs = verbs.filter((v) => v.key !== "open");
  }

  if (carWords.length + (verbs.length ? 1 : 0) !== 1 || verbs.length > 1) {
    return NOT_UNDERSTOOD;
  }

  if (carWords.length === 1) {
    return {
      matched: true,
      action: carWords[0].key,
      target: "none",
      phrase: carWords[0].phrase,
      reason: `Matched "${carWords[0].phrase}"`
    };
  }

  const targets = findAll(WINDOW_TARGETS, "target", normalized);
  if (!wordRegex("windows?").test(normalized) || targets.length !== 1) {
    return NOT_UNDERSTOOD;
  }

  return {
    matched: true,
    action: verbs[0].key,
    target: targets[0].key,
    phrase: `${verbs[0].phrase} ${targets[0].phrase}`,
    reason: `Matched "${verbs[0].phrase}" on "${targets[0].phrase}"`
  };
}
