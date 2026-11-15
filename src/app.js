import { createDoorFSM, DOOR_STATES, DOOR_ACTIONS } from "./door-fsm.js";
import { matchModeACommand } from "./mode-a.js";
import {
  DEFAULT_MODE_B_RULES,
  FALLBACK_GROQ_MODEL,
  fetchGroqModels,
  callGroqModeB
} from "./mode-b.js";
import {
  ENROLMENT_SENTENCES,
  DEFAULT_THRESHOLD,
  loadVoiceprint,
  saveVoiceprint,
  deleteVoiceprint,
  loadThreshold,
  saveThreshold,
  extractVoiceEmbedding,
  computeMeanEmbedding,
  cosineSimilarity,
  loadVoiceModel
} from "./voiceprint.js";
import {
  detectBrowserSupport,
  checkLocalSpeechSupport,
  createPushToTalkSession,
  MIN_CLIP_SECONDS
} from "./audio.js";

const STORAGE_KEY_GROQ = "atumatik_groq_key";
const STORAGE_KEY_RULES = "atumatik_modeb_rules";
const STORAGE_KEY_THEME = "atumatik_theme";

const klTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});

function formatMYTTime(date = new Date()) {
  return klTimeFormatter.format(date);
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const saved = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initial = saved || (prefersDark ? "dark" : "light");

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    if (btn) {
      btn.textContent = theme === "dark" ? "Light mode" : "Dark mode";
      btn.setAttribute("aria-pressed", String(theme === "dark"));
    }
  }

  apply(initial);
  if (btn) {
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
    });
  }
}

initThemeToggle();

// Only initialize demo logic on index.html
if (document.getElementById("door-stage")) {
  initDemoPage();
}

function initDemoPage() {
  const doorStage = document.getElementById("door-stage");
  const doorStateText = document.getElementById("door-state-text");
  const doorLockBadge = document.getElementById("door-lock-badge");
  const doorLockBar = document.getElementById("door-lock-bar");
  const doorMessageEl = document.getElementById("door-feedback");

  const browserBanner = document.getElementById("browser-banner");
  const localSpeechStatus = document.getElementById("local-speech-status");
  const talkBtn = document.getElementById("talk-btn");
  const talkStatus = document.getElementById("talk-status");

  const modeARadio = document.getElementById("mode-a-radio");
  const modeBRadio = document.getElementById("mode-b-radio");
  const modeBPanel = document.getElementById("mode-b-panel");
  const rulesInput = document.getElementById("mode-b-rules");
  const resetRulesBtn = document.getElementById("reset-rules-btn");

  const apiKeyInput = document.getElementById("groq-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const forgetKeyBtn = document.getElementById("forget-key-btn");
  const keyStatus = document.getElementById("groq-key-status");

  const consentCheckbox = document.getElementById("pdpa-consent");
  const loadModelBtn = document.getElementById("load-model-btn");
  const modelProgressWrap = document.getElementById("model-progress-wrap");
  const modelProgressBar = document.getElementById("model-progress-bar");
  const modelProgressText = document.getElementById("model-progress-text");
  const voiceprintStatus = document.getElementById("voiceprint-status");
  const enrolmentList = document.getElementById("enrolment-list");
  const reRecordBtn = document.getElementById("rerecord-btn");
  const deleteVoiceprintBtn = document.getElementById("delete-voiceprint-btn");

  const thresholdSlider = document.getElementById("threshold-slider");
  const thresholdLabel = document.getElementById("threshold-value-label");
  const clearLogBtn = document.getElementById("clear-log-btn");
  const logBody = document.getElementById("event-log-body");
  const logEmpty = document.getElementById("event-log-empty");

  const eventEntries = [];
  let activeMode = "A";
  let activeGroqModel = FALLBACK_GROQ_MODEL;
  let groqInFlight = false;
  let activeTalkSession = null;
  let enrolmentEmbeddings = new Array(ENROLMENT_SENTENCES.length).fill(null);

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const fsm = createDoorFSM({
    reducedMotion: reducedMotionQuery.matches,
    onChange(snapshot) {
      renderDoor(snapshot);
    }
  });

  reducedMotionQuery.addEventListener("change", (event) => {
    fsm.setReducedMotion(event.matches);
  });

  function renderDoor(snapshot) {
    doorStage.setAttribute("data-state", snapshot.state);
    doorStateText.textContent = snapshot.locked
      ? `${snapshot.state} (LOCKED)`
      : snapshot.state;

    if (snapshot.locked) {
      doorLockBadge.textContent = "Locked";
      doorLockBadge.className = "status-badge status-badge-danger";
      doorLockBar.hidden = false;
    } else {
      doorLockBadge.textContent = "Unlocked";
      doorLockBadge.className = "status-badge status-badge-ok";
      doorLockBar.hidden = true;
    }

    if (snapshot.lastResult) {
      doorMessageEl.textContent = snapshot.lastResult;
    }
  }

  function addLogEntry({ mode, heard, speakerText, rejected = false, action, result }) {
    const entry = {
      time: formatMYTTime(),
      mode,
      heard: heard || "(none)",
      speakerText,
      rejected,
      action: action || "none",
      result
    };
    eventEntries.unshift(entry);
    renderLog();
  }

  function renderLog() {
    logBody.textContent = "";
    if (eventEntries.length === 0) {
      logEmpty.hidden = false;
      return;
    }
    logEmpty.hidden = true;

    for (const item of eventEntries) {
      const tr = document.createElement("tr");
      if (item.rejected) {
        tr.className = "log-row-rejected";
      }

      const cells = [
        item.time,
        item.mode,
        item.heard,
        item.speakerText,
        item.action,
        item.result
      ];
      cells.forEach((val, idx) => {
        const td = document.createElement("td");
        if (idx === 0 || idx === 3 || idx === 4) {
          td.className = "mono";
        }
        td.textContent = val;
        tr.appendChild(td);
      });
      logBody.appendChild(tr);
    }
  }

  // Browser support check
  const support = detectBrowserSupport();
  if (!support.supported) {
    browserBanner.hidden = false;
    browserBanner.textContent = support.reason;
    talkBtn.disabled = true;
  }

  checkLocalSpeechSupport().then((info) => {
    localSpeechStatus.textContent = info.detail;
  });

  // Manual door buttons
  document.querySelectorAll("[data-door-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-door-action");
      const res = fsm.dispatch(action);
      doorMessageEl.textContent = res.reason;
      addLogEntry({
        mode: "Manual",
        heard: "(button)",
        speakerText: "Manual button",
        rejected: false,
        action,
        result: res.reason
      });
    });
  });

  // Mode toggle
  function updateModeVisibility() {
    activeMode = modeBRadio.checked ? "B" : "A";
    modeBPanel.hidden = activeMode !== "B";
  }
  modeARadio.addEventListener("change", updateModeVisibility);
  modeBRadio.addEventListener("change", updateModeVisibility);
  updateModeVisibility();

  // Mode B rules persistence
  const savedRules = localStorage.getItem(STORAGE_KEY_RULES);
  rulesInput.value = savedRules || DEFAULT_MODE_B_RULES;
  rulesInput.addEventListener("input", () => {
    localStorage.setItem(STORAGE_KEY_RULES, rulesInput.value);
  });
  resetRulesBtn.addEventListener("click", () => {
    rulesInput.value = DEFAULT_MODE_B_RULES;
    localStorage.setItem(STORAGE_KEY_RULES, DEFAULT_MODE_B_RULES);
  });

  // Groq key handling
  function refreshKeyUI(statusMsg = "") {
    const existing = localStorage.getItem(STORAGE_KEY_GROQ) || "";
    if (existing) {
      apiKeyInput.value = existing;
      keyStatus.textContent = statusMsg || `Key saved in browser. Model: ${activeGroqModel}`;
      keyStatus.className = "muted mono";
    } else {
      apiKeyInput.value = "";
      keyStatus.textContent = statusMsg || "No Groq key saved.";
      keyStatus.className = "muted mono";
    }
  }

  saveKeyBtn.addEventListener("click", async () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      keyStatus.textContent = "Paste a Groq API key first.";
      return;
    }
    localStorage.setItem(STORAGE_KEY_GROQ, key);
    keyStatus.textContent = "Checking Groq models...";
    const lookup = await fetchGroqModels({ apiKey: key });
    activeGroqModel = lookup.model;
    if (lookup.ok) {
      refreshKeyUI(`Key saved. Active model: ${activeGroqModel}`);
    } else {
      keyStatus.textContent = `${lookup.error}. Fallback model: ${activeGroqModel}`;
    }
  });

  forgetKeyBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY_GROQ);
    activeGroqModel = FALLBACK_GROQ_MODEL;
    refreshKeyUI("Key removed from this browser.");
  });

  refreshKeyUI();

  // Threshold slider
  function updateThresholdDisplay(val) {
    const num = Number.parseFloat(val);
    const provisionalNote = Math.abs(num - DEFAULT_THRESHOLD) < 0.001
      ? " (PROVISIONAL)"
      : " (custom)";
    thresholdLabel.textContent = `${num.toFixed(2)}${provisionalNote}`;
  }
  const initialThreshold = loadThreshold();
  thresholdSlider.value = initialThreshold.toFixed(2);
  updateThresholdDisplay(initialThreshold);
  thresholdSlider.addEventListener("input", () => {
    const saved = saveThreshold(thresholdSlider.value);
    updateThresholdDisplay(saved);
  });

  // Model download progress handler
  function handleModelProgress(progress) {
    modelProgressWrap.hidden = false;
    modelProgressBar.value = progress.percent || 0;
    modelProgressText.textContent = progress.text || "Loading model...";
  }

  loadModelBtn.addEventListener("click", async () => {
    if (!consentCheckbox.checked) {
      voiceprintStatus.textContent = "Read and accept the PDPA 2010 notice first.";
      return;
    }
    loadModelBtn.disabled = true;
    try {
      await loadVoiceModel(handleModelProgress);
      voiceprintStatus.textContent = "Voice model ready. Record all 5 sentences below.";
    } catch (err) {
      voiceprintStatus.textContent = `Model load failed: ${err.message}`;
    } finally {
      loadModelBtn.disabled = false;
    }
  });

  // Voiceprint enrolment UI
  function refreshVoiceprintUI() {
    const stored = loadVoiceprint();
    if (stored) {
      voiceprintStatus.textContent = `Voiceprint enrolled (${stored.vector.length} dims). Ready to verify speaker.`;
      deleteVoiceprintBtn.disabled = false;
    } else {
      const doneCount = enrolmentEmbeddings.filter(Boolean).length;
      voiceprintStatus.textContent = doneCount > 0
        ? `Enrolment progress: ${doneCount} of ${ENROLMENT_SENTENCES.length} sentences captured.`
        : "No voiceprint enrolled. Mode A and manual door controls work without the model.";
      deleteVoiceprintBtn.disabled = true;
    }
  }

  function renderEnrolmentSentences() {
    enrolmentList.textContent = "";
    ENROLMENT_SENTENCES.forEach((sentence, idx) => {
      const li = document.createElement("li");
      li.className = "sentence-item";

      const textSpan = document.createElement("span");
      textSpan.textContent = `${idx + 1}. "${sentence}"`;

      const rightGroup = document.createElement("div");
      rightGroup.className = "button-grid";

      const stateSpan = document.createElement("span");
      stateSpan.className = enrolmentEmbeddings[idx]
        ? "status-badge status-badge-ok"
        : "status-badge";
      stateSpan.textContent = enrolmentEmbeddings[idx] ? "Captured" : "Pending";

      const recBtn = document.createElement("button");
      recBtn.type = "button";
      recBtn.textContent = "Hold to record";

      let session = null;
      const startRec = async () => {
        if (!consentCheckbox.checked) {
          voiceprintStatus.textContent = "Read and accept the PDPA 2010 notice before recording.";
          return;
        }
        if (session) {
          return;
        }
        stateSpan.textContent = "Recording...";
        recBtn.classList.add("is-recording");
        session = createPushToTalkSession();
        try {
          await session.start({ recognizeSpeech: false });
        } catch (err) {
          session = null;
          recBtn.classList.remove("is-recording");
          stateSpan.textContent = "Error";
          handleMicError(err);
        }
      };

      const stopRec = async () => {
        if (!session) {
          return;
        }
        const current = session;
        session = null;
        recBtn.classList.remove("is-recording");
        const result = await current.stop();
        if (!result || result.tooShort) {
          stateSpan.textContent = "Too short (<1.0 s)";
          return;
        }
        stateSpan.textContent = "Encoding...";
        try {
          const emb = await extractVoiceEmbedding(result.samples, handleModelProgress);
          enrolmentEmbeddings[idx] = emb;
          stateSpan.textContent = `Captured (${result.durationSeconds.toFixed(1)} s)`;
          stateSpan.className = "status-badge status-badge-ok";

          if (enrolmentEmbeddings.every(Boolean)) {
            const mean = computeMeanEmbedding(enrolmentEmbeddings);
            saveVoiceprint(mean);
          }
          refreshVoiceprintUI();
        } catch (err) {
          stateSpan.textContent = "Failed";
          voiceprintStatus.textContent = `Voice embedding error: ${err.message}`;
        }
      };

      recBtn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        startRec();
      });
      recBtn.addEventListener("pointerup", stopRec);
      recBtn.addEventListener("pointercancel", stopRec);
      recBtn.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !e.repeat) {
          e.preventDefault();
          startRec();
        }
      });
      recBtn.addEventListener("keyup", (e) => {
        if (e.code === "Space") {
          e.preventDefault();
          stopRec();
        }
      });

      rightGroup.appendChild(stateSpan);
      rightGroup.appendChild(recBtn);
      li.appendChild(textSpan);
      li.appendChild(rightGroup);
      enrolmentList.appendChild(li);
    });
  }

  reRecordBtn.addEventListener("click", () => {
    deleteVoiceprint();
    enrolmentEmbeddings = new Array(ENROLMENT_SENTENCES.length).fill(null);
    renderEnrolmentSentences();
    refreshVoiceprintUI();
  });

  deleteVoiceprintBtn.addEventListener("click", () => {
    deleteVoiceprint();
    enrolmentEmbeddings = new Array(ENROLMENT_SENTENCES.length).fill(null);
    renderEnrolmentSentences();
    refreshVoiceprintUI();
  });

  function formatSpeechFailure(speechError) {
    if (speechError === "not-allowed" || speechError === "service-not-allowed") {
      return "Speech permission denied.";
    }
    if (speechError === "network") {
      return "Speech recognition network error. Check internet or try Chrome.";
    }
    if (speechError === "audio-capture") {
      return "Speech recognition could not read the microphone.";
    }
    return "Not understood (no speech recognized).";
  }

  function handleMicError(err) {
    if (err && err.message === "MIC_DENIED") {
      talkStatus.textContent =
        "Microphone access denied. Open site permissions near the address bar, set Microphone to Allow, and reload.";
      talkStatus.className = "banner banner-danger";
      talkStatus.hidden = false;
      return;
    }
    talkStatus.textContent =
      "Microphone could not start. Check that a microphone is connected and allowed in Chrome or Edge.";
    talkStatus.className = "banner banner-danger";
    talkStatus.hidden = false;
  }

  // Push-to-talk main handler
  async function startTalk() {
    if (groqInFlight || activeTalkSession || talkBtn.disabled) {
      return;
    }
    if (!consentCheckbox.checked && loadVoiceprint()) {
      talkStatus.textContent = "Accept the PDPA 2010 notice in Voice Setup before speaking.";
      talkStatus.className = "banner banner-warn";
      talkStatus.hidden = false;
      return;
    }

    talkStatus.hidden = false;
    talkStatus.className = "banner banner-ok";
    talkStatus.textContent = "Listening... release when finished.";
    talkBtn.classList.add("is-recording");
    talkBtn.setAttribute("aria-pressed", "true");

    const session = createPushToTalkSession();
    activeTalkSession = session;
    try {
      await session.start({
        recognizeSpeech: true,
        onInterim(text) {
          if (text) {
            talkStatus.textContent = `Heard: "${text}"`;
          }
        }
      });
    } catch (err) {
      activeTalkSession = null;
      talkBtn.classList.remove("is-recording");
      talkBtn.setAttribute("aria-pressed", "false");
      handleMicError(err);
    }
  }

  async function stopTalk() {
    if (!activeTalkSession) {
      return;
    }
    const session = activeTalkSession;
    activeTalkSession = null;
    talkBtn.classList.remove("is-recording");
    talkBtn.setAttribute("aria-pressed", "false");

    const captured = await session.stop();
    if (!captured) {
      return;
    }

    // Step 1: Reject clips shorter than 1.0 second
    if (captured.tooShort) {
      const msg = `Too short (${captured.durationSeconds.toFixed(2)} s). Hold at least 1.0 second.`;
      talkStatus.textContent = msg;
      talkStatus.className = "banner banner-warn";
      addLogEntry({
        mode: activeMode === "B" ? "Mode B" : "Mode A",
        heard: captured.transcript,
        speakerText: "Too short",
        rejected: false,
        action: "none",
        result: msg
      });
      return;
    }

    // Step 2: Compute voiceprint score if enrolled
    const enrolled = loadVoiceprint();
    let speakerText = "No lock enrolled";
    if (enrolled) {
      try {
        talkStatus.textContent = "Checking speaker voiceprint...";
        const embedding = await extractVoiceEmbedding(captured.samples, handleModelProgress);
        const score = cosineSimilarity(embedding, enrolled.vector);
        const threshold = loadThreshold();
        if (score < threshold) {
          const rejectText = `Rejected (score ${score.toFixed(2)} < ${threshold.toFixed(2)})`;
          talkStatus.textContent = `Speaker rejected (${score.toFixed(2)}). Door unchanged.`;
          talkStatus.className = "banner banner-danger";
          addLogEntry({
            mode: activeMode === "B" ? "Mode B" : "Mode A",
            heard: captured.transcript,
            speakerText: rejectText,
            rejected: true,
            action: "none",
            result: "Speaker rejected"
          });
          return;
        }
        speakerText = `Accepted (score ${score.toFixed(2)})`;
      } catch (err) {
        talkStatus.textContent = `Voiceprint check failed: ${err.message}`;
        talkStatus.className = "banner banner-danger";
        return;
      }
    }

    // Step 3: Route recognized transcript to active mode
    const transcript = captured.transcript;
    if (!transcript) {
      const noTextMsg = formatSpeechFailure(captured.speechError);
      talkStatus.textContent = noTextMsg;
      talkStatus.className = "banner banner-warn";
      addLogEntry({
        mode: activeMode === "B" ? "Mode B" : "Mode A",
        heard: "(empty)",
        speakerText,
        rejected: false,
        action: "none",
        result: noTextMsg
      });
      return;
    }

    if (activeMode === "A") {
      const match = matchModeACommand(transcript);
      if (!match.matched) {
        talkStatus.textContent = `Mode A: "${transcript}" -> Not understood`;
        talkStatus.className = "banner banner-warn";
        addLogEntry({
          mode: "Mode A",
          heard: transcript,
          speakerText,
          rejected: false,
          action: "none",
          result: "Not understood"
        });
        return;
      }
      const fsmRes = fsm.dispatch(match.action);
      talkStatus.textContent = `Mode A: ${match.action} -> ${fsmRes.reason}`;
      talkStatus.className = fsmRes.ok ? "banner banner-ok" : "banner banner-warn";
      addLogEntry({
        mode: "Mode A",
        heard: transcript,
        speakerText,
        rejected: false,
        action: match.action,
        result: fsmRes.reason
      });
      return;
    }

    // Mode B (Groq AI)
    const apiKey = localStorage.getItem(STORAGE_KEY_GROQ) || "";
    if (!apiKey) {
      talkStatus.textContent = "No Groq API key saved. Paste a key in Mode B settings.";
      talkStatus.className = "banner banner-danger";
      addLogEntry({
        mode: "Mode B",
        heard: transcript,
        speakerText,
        rejected: false,
        action: "none",
        result: "No Groq API key saved"
      });
      return;
    }

    groqInFlight = true;
    talkBtn.disabled = true;
    talkStatus.textContent = "Asking Groq AI...";
    talkStatus.className = "banner banner-ok";

    try {
      const snap = fsm.getSnapshot();
      const aiRes = await callGroqModeB({
        apiKey,
        model: activeGroqModel,
        rules: rulesInput.value,
        doorState: snap.state,
        locked: snap.locked,
        transcript
      });

      if (!aiRes.ok) {
        talkStatus.textContent = `Mode B error: ${aiRes.reason}`;
        talkStatus.className = "banner banner-danger";
        addLogEntry({
          mode: "Mode B",
          heard: transcript,
          speakerText,
          rejected: false,
          action: "none",
          result: aiRes.reason
        });
        return;
      }

      if (aiRes.action === "deny" || aiRes.action === "none") {
        talkStatus.textContent = `Mode B (${aiRes.action}): ${aiRes.reason}`;
        talkStatus.className = "banner banner-warn";
        addLogEntry({
          mode: "Mode B",
          heard: transcript,
          speakerText,
          rejected: false,
          action: aiRes.action,
          result: aiRes.reason
        });
        return;
      }

      const fsmRes = fsm.dispatch(aiRes.action);
      const finalMsg = fsmRes.ok ? `${aiRes.reason} (${fsmRes.reason})` : fsmRes.reason;
      talkStatus.textContent = `Mode B (${aiRes.action}): ${finalMsg}`;
      talkStatus.className = fsmRes.ok ? "banner banner-ok" : "banner banner-warn";
      addLogEntry({
        mode: "Mode B",
        heard: transcript,
        speakerText,
        rejected: false,
        action: aiRes.action,
        result: finalMsg
      });
    } finally {
      groqInFlight = false;
      if (support.supported) {
        talkBtn.disabled = false;
      }
    }
  }

  talkBtn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    startTalk();
  });
  window.addEventListener("pointerup", () => {
    if (activeTalkSession) {
      stopTalk();
    }
  });
  window.addEventListener("pointercancel", () => {
    if (activeTalkSession) {
      stopTalk();
    }
  });

  // Space key push-to-talk (unless typing inside an input/textarea)
  let spaceHolding = false;
  window.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) {
      return;
    }
    const tag = document.activeElement?.tagName;
    const isTalkBtn = document.activeElement === talkBtn;
    if (!isTalkBtn && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON" || tag === "A")) {
      return;
    }
    e.preventDefault();
    spaceHolding = true;
    startTalk();
  });

  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" && spaceHolding) {
      e.preventDefault();
      spaceHolding = false;
      stopTalk();
    }
  });

  clearLogBtn.addEventListener("click", () => {
    eventEntries.length = 0;
    renderLog();
  });

  renderDoor(fsm.getSnapshot());
  renderEnrolmentSentences();
  refreshVoiceprintUI();
  renderLog();
}
