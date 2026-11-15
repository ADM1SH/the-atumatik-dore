/**
 * Mode A: Coded whole-word command matcher (no LLM or API call).
 */

export const MODE_A_COMMANDS = Object.freeze([
  { action: "hold", words: ["stay open", "keep open", "hold"] },
  { action: "release", words: ["let go", "release", "resume"] },
  { action: "open", words: ["open up", "open"] },
  { action: "close", words: ["close", "shut"] },
  { action: "unlock", words: ["unlock"] },
  { action: "lock", words: ["lock"] }
]);

const COMPILED_PATTERNS = MODE_A_COMMANDS.flatMap(({ action, words }) =>
  words.map((phrase) => ({
    action,
    phrase,
    length: phrase.length,
    regex: new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "i")
  }))
).sort((a, b) => b.length - a.length);

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
    return { matched: false, action: "none", phrase: null, reason: "Not understood" };
  }

  for (const entry of COMPILED_PATTERNS) {
    if (entry.regex.test(normalized)) {
      return {
        matched: true,
        action: entry.action,
        phrase: entry.phrase,
        reason: `Matched "${entry.phrase}"`
      };
    }
  }

  return { matched: false, action: "none", phrase: null, reason: "Not understood" };
}
