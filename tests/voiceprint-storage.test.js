import test from "node:test";
import assert from "node:assert/strict";
import {
  ENROLMENT_SENTENCES,
  loadVoiceprint,
  saveVoiceprint,
  deleteVoiceprint,
  loadConsent,
  saveConsent,
  loadEnrolmentProgress,
  saveEnrolmentProgress,
  isModelCached
} from "../src/voiceprint.js";

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    has: (k) => map.has(k)
  };
}

const N = ENROLMENT_SENTENCES.length;
const emptyProgress = () => new Array(N).fill(null);

test("Enrolment progress round trips partial sentences", () => {
  const storage = fakeStorage();
  const progress = emptyProgress();
  progress[0] = [0.1, 0.2, 0.3, 0.4];
  progress[3] = [0.4, 0.3, 0.2, 0.1];
  saveEnrolmentProgress(progress, storage);
  assert.deepEqual(loadEnrolmentProgress(storage), progress);
});

test("Enrolment progress returns all null when nothing is stored", () => {
  assert.deepEqual(loadEnrolmentProgress(fakeStorage()), emptyProgress());
});

test("Enrolment progress rejects malformed, wrong-length and mixed-dimension data", () => {
  const storage = fakeStorage();
  const key = "atumatik_enrol_partial_v1";

  storage.setItem(key, "{not json");
  assert.deepEqual(loadEnrolmentProgress(storage), emptyProgress());

  storage.setItem(key, JSON.stringify([[0.1, 0.2]]));
  assert.deepEqual(loadEnrolmentProgress(storage), emptyProgress());

  const mixed = emptyProgress();
  mixed[0] = [0.1, 0.2];
  mixed[1] = [0.1, 0.2, 0.3];
  storage.setItem(key, JSON.stringify(mixed));
  assert.deepEqual(loadEnrolmentProgress(storage), emptyProgress());

  const bad = emptyProgress();
  bad[2] = [0.1, "x"];
  storage.setItem(key, JSON.stringify(bad));
  assert.deepEqual(loadEnrolmentProgress(storage), emptyProgress());
});

test("saveVoiceprint clears partial progress", () => {
  const storage = fakeStorage();
  const progress = emptyProgress();
  progress[0] = [0.1, 0.2, 0.3, 0.4];
  saveEnrolmentProgress(progress, storage);
  saveVoiceprint([0.1, 0.2, 0.3, 0.4], storage);
  assert.equal(storage.has("atumatik_enrol_partial_v1"), false);
  assert.ok(loadVoiceprint(storage));
});

test("deleteVoiceprint clears voiceprint and partial progress but keeps consent", () => {
  const storage = fakeStorage();
  const progress = emptyProgress();
  progress[1] = [0.1, 0.2, 0.3, 0.4];
  saveVoiceprint([0.1, 0.2, 0.3, 0.4], storage);
  saveEnrolmentProgress(progress, storage);
  saveConsent(true, storage);

  deleteVoiceprint(storage);

  assert.equal(loadVoiceprint(storage), null);
  assert.deepEqual(loadEnrolmentProgress(storage), emptyProgress());
  assert.equal(loadConsent(storage), true);
});

test("Consent round trips and unticking removes the record", () => {
  const storage = fakeStorage();
  assert.equal(loadConsent(storage), false);
  saveConsent(true, storage);
  assert.equal(loadConsent(storage), true);
  assert.ok(!Number.isNaN(Date.parse(storage.getItem("atumatik_pdpa_consent_v1"))));
  saveConsent(false, storage);
  assert.equal(loadConsent(storage), false);
  assert.equal(storage.has("atumatik_pdpa_consent_v1"), false);
});

test("isModelCached detects the cached model file", async () => {
  const urlsByCache = {
    "transformers-cache": [
      { url: "https://huggingface.co/Xenova/wavlm-base-plus-sv/resolve/main/config.json" },
      { url: "https://huggingface.co/Xenova/wavlm-base-plus-sv/resolve/main/onnx/model_quantized.onnx" }
    ]
  };
  const caches = {
    has: async (name) => name in urlsByCache,
    open: async (name) => ({ keys: async () => urlsByCache[name] })
  };
  assert.equal(await isModelCached(caches), true);
});

test("isModelCached is false for a missing cache, a missing model file, or an error", async () => {
  const none = { has: async () => false, open: async () => { throw new Error("must not open"); } };
  assert.equal(await isModelCached(none), false);

  const noModel = {
    has: async () => true,
    open: async () => ({ keys: async () => [{ url: "https://huggingface.co/Xenova/wavlm-base-plus-sv/resolve/main/config.json" }] })
  };
  assert.equal(await isModelCached(noModel), false);

  const broken = { has: async () => { throw new Error("denied"); } };
  assert.equal(await isModelCached(broken), false);
  assert.equal(await isModelCached(null), false);
});
