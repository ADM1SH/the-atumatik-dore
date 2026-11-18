/**
 * Speaker verification module using Xenova/wavlm-base-plus-sv (quantized ONNX).
 * Lazy-loads @huggingface/transformers@4.3.2 from jsDelivr only when requested.
 */

export const TRANSFORMERS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.min.js";
export const VOICEPRINT_MODEL_ID = "Xenova/wavlm-base-plus-sv";
export const DEFAULT_THRESHOLD = 0.78;
export const THRESHOLD_STATUS = "PROVISIONAL";

export const ENROLMENT_SENTENCES = Object.freeze([
  "Open the door please.",
  "Close the door now.",
  "Hold the door open.",
  "Lock the door.",
  "Unlock the door."
]);

const STORAGE_KEYS = Object.freeze({
  VOICEPRINT: "atumatik_voiceprint_v1",
  THRESHOLD: "atumatik_vp_threshold",
  CONSENT: "atumatik_pdpa_consent_v1",
  PARTIAL: "atumatik_enrol_partial_v1"
});

const MODEL_CACHE_NAME = "transformers-cache";

let cachedProcessor = null;
let cachedModel = null;
let loadingPromise = null;

export function l2Normalize(vec) {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm === 0) {
    return new Float32Array(vec.length);
  }
  const out = new Float32Array(vec.length);
  for (let i = 0; i < vec.length; i++) {
    out[i] = vec[i] / norm;
  }
  return out;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function computeMeanEmbedding(vectors) {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    throw new Error("At least one voice embedding is required.");
  }
  const dim = vectors[0].length;
  const sum = new Float32Array(dim);
  for (const raw of vectors) {
    if (!raw || raw.length !== dim) {
      throw new Error("Inconsistent embedding dimensions.");
    }
    const unit = l2Normalize(raw);
    for (let i = 0; i < dim; i++) {
      sum[i] += unit[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    sum[i] /= vectors.length;
  }
  return Array.from(l2Normalize(sum));
}

export function isModelLoaded() {
  return Boolean(cachedProcessor && cachedModel);
}

export async function isModelCached(cacheStorage = globalThis.caches) {
  try {
    if (!cacheStorage || !(await cacheStorage.has(MODEL_CACHE_NAME))) {
      return false;
    }
    const cache = await cacheStorage.open(MODEL_CACHE_NAME);
    const requests = await cache.keys();
    return requests.some((r) => r.url.includes(VOICEPRINT_MODEL_ID) && r.url.endsWith(".onnx"));
  } catch {
    return false;
  }
}

export async function requestPersistentStorage() {
  try {
    return Boolean(await navigator.storage?.persist?.());
  } catch {
    return false;
  }
}

export async function loadVoiceModel(onProgress = () => {}) {
  if (cachedProcessor && cachedModel) {
    return { processor: cachedProcessor, model: cachedModel };
  }
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    onProgress({ phase: "library", percent: 5, text: "Loading transformers.js 4.3.2..." });
    const transformers = await import(TRANSFORMERS_CDN_URL);
    const { env, AutoProcessor, AutoModel } = transformers;

    env.allowLocalModels = false;
    env.useBrowserCache = true;
    env.cacheKey = MODEL_CACHE_NAME;

    const cached = await isModelCached();
    const label = (file) => (cached ? `Loading ${file} from device cache` : `Downloading ${file}`);
    const fileProgress = new Map();
    const handleProgress = (info) => {
      if (!info) {
        return;
      }
      if (info.status === "progress" && info.file) {
        const loaded = typeof info.loaded === "number" ? info.loaded : 0;
        const total = typeof info.total === "number" && info.total > 0 ? info.total : 101683453;
        fileProgress.set(info.file, { loaded, total });

        let sumLoaded = 0;
        let sumTotal = 0;
        for (const item of fileProgress.values()) {
          sumLoaded += item.loaded;
          sumTotal += item.total;
        }
        const pct = sumTotal > 0 ? Math.min(99, Math.round((sumLoaded / sumTotal) * 100)) : 10;
        const mbLoaded = (sumLoaded / (1024 * 1024)).toFixed(1);
        const mbTotal = (sumTotal / (1024 * 1024)).toFixed(1);
        onProgress({
          phase: "download",
          percent: pct,
          text: `${label(info.file)}: ${mbLoaded} / ${mbTotal} MB (${pct}%)`
        });
      } else if (info.status === "initiate" && info.file) {
        onProgress({
          phase: "initiate",
          percent: 8,
          text: `Preparing ${info.file}...`
        });
      }
    };

    onProgress({ phase: "processor", percent: 10, text: "Loading audio preprocessor..." });
    const processor = await AutoProcessor.from_pretrained(VOICEPRINT_MODEL_ID, {
      progress_callback: handleProgress
    });

    onProgress({ phase: "model", percent: 15, text: "Loading quantized wavlm-base-plus-sv..." });
    const model = await AutoModel.from_pretrained(VOICEPRINT_MODEL_ID, {
      dtype: "q8",
      device: "wasm",
      progress_callback: handleProgress
    });

    cachedProcessor = processor;
    cachedModel = model;
    requestPersistentStorage();
    onProgress({ phase: "ready", percent: 100, text: "Voice model ready (quantized ONNX)." });
    return { processor, model };
  })();

  try {
    return await loadingPromise;
  } catch (err) {
    loadingPromise = null;
    throw err;
  }
}

export async function extractVoiceEmbedding(float32Audio16k, onProgress = () => {}) {
  if (!(float32Audio16k instanceof Float32Array) || float32Audio16k.length === 0) {
    throw new Error("Audio buffer is empty.");
  }
  const { processor, model } = await loadVoiceModel(onProgress);
  const inputs = await processor(float32Audio16k);
  const output = await model(inputs);
  const data = output?.embeddings?.data;
  if (!data || data.length === 0) {
    throw new Error("Model returned no speaker embedding.");
  }
  return Array.from(l2Normalize(data));
}

export function loadVoiceprint(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEYS.VOICEPRINT);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.vector) || parsed.vector.length === 0) {
      return null;
    }
    const vector = parsed.vector.filter((n) => typeof n === "number" && Number.isFinite(n));
    if (vector.length !== parsed.vector.length) {
      return null;
    }
    return {
      model: parsed.model || VOICEPRINT_MODEL_ID,
      enrolledAt: parsed.enrolledAt || null,
      sentenceCount: parsed.sentenceCount || 5,
      vector
    };
  } catch {
    return null;
  }
}

export function saveVoiceprint(vector, storage = window.localStorage) {
  const payload = {
    model: VOICEPRINT_MODEL_ID,
    enrolledAt: new Date().toISOString(),
    sentenceCount: 5,
    vector: Array.from(l2Normalize(vector))
  };
  storage.setItem(STORAGE_KEYS.VOICEPRINT, JSON.stringify(payload));
  storage.removeItem(STORAGE_KEYS.PARTIAL);
  return payload;
}

export function deleteVoiceprint(storage = window.localStorage) {
  storage.removeItem(STORAGE_KEYS.VOICEPRINT);
  storage.removeItem(STORAGE_KEYS.PARTIAL);
}

export function loadEnrolmentProgress(storage = window.localStorage) {
  const empty = () => new Array(ENROLMENT_SENTENCES.length).fill(null);
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEYS.PARTIAL));
    if (!Array.isArray(parsed) || parsed.length !== ENROLMENT_SENTENCES.length) {
      return empty();
    }
    const dims = new Set();
    for (const vec of parsed) {
      if (vec === null) {
        continue;
      }
      const valid = Array.isArray(vec) && vec.length > 0 && vec.every((n) => typeof n === "number" && Number.isFinite(n));
      if (!valid) {
        return empty();
      }
      dims.add(vec.length);
    }
    return dims.size > 1 ? empty() : parsed;
  } catch {
    return empty();
  }
}

export function saveEnrolmentProgress(progress, storage = window.localStorage) {
  storage.setItem(STORAGE_KEYS.PARTIAL, JSON.stringify(progress));
}

export function loadConsent(storage = window.localStorage) {
  try {
    return Boolean(storage.getItem(STORAGE_KEYS.CONSENT));
  } catch {
    return false;
  }
}

export function saveConsent(granted, storage = window.localStorage) {
  try {
    if (granted) {
      storage.setItem(STORAGE_KEYS.CONSENT, new Date().toISOString());
    } else {
      storage.removeItem(STORAGE_KEYS.CONSENT);
    }
  } catch {
    // Storage unavailable: consent then lasts for this page load only.
  }
}

export function loadThreshold(storage = window.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEYS.THRESHOLD);
    if (raw === null) {
      return DEFAULT_THRESHOLD;
    }
    const num = Number.parseFloat(raw);
    if (!Number.isFinite(num) || num < 0.5 || num > 0.95) {
      return DEFAULT_THRESHOLD;
    }
    return Math.round(num * 100) / 100;
  } catch {
    return DEFAULT_THRESHOLD;
  }
}

export function saveThreshold(value, storage = window.localStorage) {
  const num = Number.parseFloat(value);
  const clamped = Math.min(0.95, Math.max(0.5, Number.isFinite(num) ? num : DEFAULT_THRESHOLD));
  const rounded = Math.round(clamped * 100) / 100;
  storage.setItem(STORAGE_KEYS.THRESHOLD, String(rounded));
  return rounded;
}
