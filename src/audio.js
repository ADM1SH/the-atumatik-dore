/**
 * Audio capture (16 kHz mono Float32Array) and Web Speech API wrapper.
 */

export const TARGET_SAMPLE_RATE = 16000;
export const MIN_CLIP_SECONDS = 1.0;

export function getSpeechRecognitionCtor() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function detectBrowserSupport(ua = navigator.userAgent) {
  const SpeechCtor = getSpeechRecognitionCtor();
  const isFirefox = /Firefox|FxiOS/i.test(ua);
  const isSafariOnly = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|EdgA|EdgiOS|OPR/i.test(ua);
  const hasMedia = Boolean(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function");

  if (!SpeechCtor || isFirefox || isSafariOnly) {
    return {
      supported: false,
      hasSpeech: Boolean(SpeechCtor),
      hasMedia,
      reason: "This browser is not supported. Open this demo in Chrome or Edge on desktop or Android."
    };
  }

  return {
    supported: true,
    hasSpeech: true,
    hasMedia,
    reason: null
  };
}

export async function checkLocalSpeechSupport() {
  const SpeechCtor = getSpeechRecognitionCtor();
  if (!SpeechCtor) {
    return { supported: false, detail: "SpeechRecognition unavailable in this browser." };
  }

  try {
    if (typeof SpeechCtor.available === "function") {
      const status = await SpeechCtor.available({ langs: ["en-US"], processLocally: true });
      return {
        supported: status === "available" || status === "downloadable" || status === "downloading",
        status,
        detail: `processLocally status: ${status}`
      };
    }

    const probe = new SpeechCtor();
    const hasProp = "processLocally" in probe;
    return {
      supported: hasProp,
      status: hasProp ? "property-present" : "cloud-only",
      detail: hasProp
        ? "processLocally property detected (browser default may still use Google cloud speech)."
        : "processLocally unavailable (Chrome sends audio to Google servers for recognition)."
    };
  } catch {
    return {
      supported: false,
      status: "cloud-only",
      detail: "processLocally check failed (Chrome sends audio to Google servers)."
    };
  }
}

export function resampleMonoTo16k(float32Samples, sourceRate) {
  if (sourceRate === TARGET_SAMPLE_RATE) {
    return float32Samples;
  }
  const ratio = sourceRate / TARGET_SAMPLE_RATE;
  const targetLength = Math.max(1, Math.round(float32Samples.length / ratio));
  const resampled = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, float32Samples.length - 1);
    const frac = srcIndex - low;
    resampled[i] = float32Samples[low] * (1 - frac) + float32Samples[high] * frac;
  }
  return resampled;
}

export async function decodeBlobToMono16k(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const mono = new Float32Array(channelData.length);
    if (audioBuffer.numberOfChannels > 1) {
      const channels = audioBuffer.numberOfChannels;
      for (let ch = 0; ch < channels; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
          mono[i] += data[i] / channels;
        }
      }
    } else {
      mono.set(channelData);
    }
    return {
      samples: resampleMonoTo16k(mono, audioBuffer.sampleRate),
      durationSeconds: audioBuffer.duration
    };
  } finally {
    await ctx.close();
  }
}

export function createPushToTalkSession() {
  let activeStream = null;
  let mediaRecorder = null;
  let chunks = [];
  let recognition = null;
  let startTime = 0;
  let finalTranscript = "";
  let interimTranscript = "";
  let speechError = null;
  let speechEndedPromise = Promise.resolve();
  let stopped = false;

  async function start({ recognizeSpeech = true, onInterim = () => {} } = {}) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("MIC_UNAVAILABLE");
    }

    try {
      activeStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: TARGET_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
    } catch (err) {
      if (err && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        throw new Error("MIC_DENIED");
      }
      throw new Error("MIC_FAILED");
    }

    chunks = [];
    finalTranscript = "";
    interimTranscript = "";
    speechError = null;
    stopped = false;
    startTime = performance.now();

    mediaRecorder = new MediaRecorder(activeStream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    mediaRecorder.start(100);

    if (recognizeSpeech) {
      const SpeechCtor = getSpeechRecognitionCtor();
      if (SpeechCtor) {
        recognition = new SpeechCtor();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        speechEndedPromise = new Promise((resolve) => {
          let resolved = false;
          const finish = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };
          const timeoutFallback = setTimeout(finish, 1500);

          recognition.onresult = (event) => {
            let finalText = "";
            let interimText = "";
            for (let i = 0; i < event.results.length; i++) {
              const res = event.results[i];
              const text = res[0]?.transcript || "";
              if (res.isFinal) {
                finalText += `${text} `;
              } else {
                interimText += `${text} `;
              }
            }
            finalTranscript = finalText.trim();
            interimTranscript = interimText.trim();
            onInterim((finalTranscript || interimTranscript).trim());
          };

          recognition.onerror = (event) => {
            speechError = event?.error || "speech-error";
            clearTimeout(timeoutFallback);
            finish();
          };

          recognition.onend = () => {
            clearTimeout(timeoutFallback);
            finish();
          };
        });

        try {
          recognition.start();
        } catch {
          speechEndedPromise = Promise.resolve();
        }
      }
    }
  }

  async function stop() {
    if (stopped) {
      return null;
    }
    stopped = true;
    const elapsedSeconds = (performance.now() - startTime) / 1000;

    const recorderDone = new Promise((resolve) => {
      if (!mediaRecorder || mediaRecorder.state === "inactive") {
        resolve();
        return;
      }
      mediaRecorder.onstop = () => resolve();
      mediaRecorder.stop();
    });

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Recognition may already have stopped.
      }
    }

    await recorderDone;
    if (activeStream) {
      for (const track of activeStream.getTracks()) {
        track.stop();
      }
    }

    await Promise.race([
      speechEndedPromise,
      new Promise((resolve) => setTimeout(resolve, 650))
    ]);

    const transcript = (finalTranscript || interimTranscript).trim();
    if (elapsedSeconds < MIN_CLIP_SECONDS) {
      return {
        tooShort: true,
        durationSeconds: elapsedSeconds,
        transcript,
        speechError,
        samples: null
      };
    }

    const blob = new Blob(chunks, { type: mediaRecorder?.mimeType || "audio/webm" });
    if (blob.size === 0) {
      return {
        tooShort: true,
        durationSeconds: elapsedSeconds,
        transcript,
        speechError,
        samples: null
      };
    }

    const decoded = await decodeBlobToMono16k(blob);
    const actualDuration = Math.max(elapsedSeconds, decoded.durationSeconds || 0);
    if (actualDuration < MIN_CLIP_SECONDS) {
      return {
        tooShort: true,
        durationSeconds: actualDuration,
        transcript,
        speechError,
        samples: null
      };
    }

    return {
      tooShort: false,
      durationSeconds: actualDuration,
      transcript,
      speechError,
      samples: decoded.samples
    };
  }

  return { start, stop };
}
