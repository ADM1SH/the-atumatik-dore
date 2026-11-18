import { createCar, voiceAction } from "./car.js";
import { createChildAlert } from "./child-alert.js";
import { createChime } from "./chime.js";
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
  loadVoiceModel,
  isModelCached,
  loadConsent,
  saveConsent,
  loadEnrolmentProgress,
  saveEnrolmentProgress
} from "./voiceprint.js";
import {
  detectBrowserSupport,
  checkLocalSpeechSupport,
  createPushToTalkSession,
  MIN_CLIP_SECONDS
} from "./audio.js";

const STORAGE_KEY_GROQ = "atumatik_groq_key";
const STORAGE_KEY_RULES = "atumatik_modeb_rules_v2";
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
if (document.getElementById("car-model")) {
  initDemoPage();
}

function initDemoPage() {
  const carSide = document.getElementById("car-side");
  const carTop = document.getElementById("car-top");
  const carStateText = document.getElementById("car-state-text");
  const carLockBadge = document.getElementById("car-lock-badge");
  const carFeedback = document.getElementById("car-feedback");
  const mirrorToggle = document.getElementById("mirror-toggle");
  const sideViewLabel = document.getElementById("side-view-label");
  const engineToggle = document.getElementById("engine-toggle");
  const lockToggle = document.getElementById("lock-toggle");
  const keyfobToggle = document.getElementById("keyfob-carried");

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
  let enrolmentEmbeddings = loadEnrolmentProgress();

  const car = createCar({
    onChange: (snapshot) => {
      renderCar(snapshot);
      childAlert.notifyCar(snapshot);
    }
  });
  const DOOR_NAMES = { fl: "front left", fr: "front right", rl: "rear left", rr: "rear right", tg: "tailgate" };
  let carSnapshot = car.getSnapshot();
  let mirrored = false;

  function renderCar(snapshot) {
    carSnapshot = snapshot;
    const near = mirrored ? { f: "fl", r: "rl" } : { f: "fr", r: "rr" };
    for (const key of ["fl", "fr", "rl", "rr"]) {
      carTop.style.setProperty(`--door-${key}`, snapshot.doors[key] ? "1" : "0");
      document.getElementById(`meter-${key}`).value = snapshot.windows[key];
      document.getElementById(`meter-${key}-text`).textContent = `${snapshot.windows[key]}%`;
    }
    carTop.style.setProperty("--tailgate", snapshot.doors.tg ? "1" : "0");
    carSide.style.setProperty("--tailgate", snapshot.doors.tg ? "1" : "0");
    carSide.style.setProperty("--win-nf", String(snapshot.windows[near.f] / 100));
    carSide.style.setProperty("--win-nr", String(snapshot.windows[near.r] / 100));
    carSide.style.setProperty("--door-nf", snapshot.doors[near.f] ? "1" : "0");
    carSide.style.setProperty("--door-nr", snapshot.doors[near.r] ? "1" : "0");

    const openDoors = Object.keys(DOOR_NAMES).filter((key) => snapshot.doors[key]).map((key) => DOOR_NAMES[key]);
    carStateText.textContent = [
      snapshot.engine ? "Engine on." : "Engine off.",
      snapshot.locked ? "Locked." : "Unlocked.",
      openDoors.length ? `Open: ${openDoors.join(", ")}.` : "All doors closed."
    ].join(" ");
    carLockBadge.textContent = snapshot.locked ? "Locked" : "Unlocked";
    carLockBadge.className = snapshot.locked ? "status-badge status-badge-danger" : "status-badge status-badge-ok";
    engineToggle.textContent = snapshot.engine ? "Engine: on" : "Engine: off";
    engineToggle.setAttribute("aria-pressed", String(snapshot.engine));
    lockToggle.textContent = snapshot.locked ? "Car lock: locked" : "Car lock: unlocked";
    lockToggle.setAttribute("aria-pressed", String(snapshot.locked));
    keyfobToggle.textContent = snapshot.keyfobCarried ? "Keyfob carried: on" : "Keyfob carried: off";
    keyfobToggle.setAttribute("aria-pressed", String(snapshot.keyfobCarried));
  }

  mirrorToggle.addEventListener("click", () => {
    mirrored = !mirrored;
    carSide.classList.toggle("is-mirrored", mirrored);
    mirrorToggle.setAttribute("aria-pressed", String(mirrored));
    mirrorToggle.textContent = mirrored ? "Show right side" : "Show left side";
    sideViewLabel.textContent = mirrored
      ? "Showing the left (passenger) side."
      : "Showing the right (driver) side. Malaysia is right-hand drive.";
    renderCar(carSnapshot);
  });

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

  // Manual car controls and kick sensor
  function runManual(mode, label, action) {
    const res = car.dispatch(action);
    carFeedback.textContent = res.reason;
    addLogEntry({
      mode,
      heard: "(button)",
      speakerText: mode === "Kick" ? "Kick sensor" : mode === "Keyfob" ? "Keyfob" : "Manual button",
      rejected: false,
      action: label,
      result: res.reason
    });
  }

  engineToggle.addEventListener("click", () => {
    runManual("Manual", "engine", { type: "engine", on: !car.getSnapshot().engine });
  });
  lockToggle.addEventListener("click", () => {
    runManual("Manual", "lock", { type: car.getSnapshot().locked ? "unlock" : "lock" });
  });
  document.querySelectorAll("[data-win]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-win");
      const position = Number(btn.getAttribute("data-pos"));
      runManual("Manual", `window ${target} ${position}`, { type: "window", target, position });
    });
  });
  document.querySelectorAll("[data-door-close]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const door = btn.getAttribute("data-door-close");
      runManual("Manual", `close ${door}`, { type: "closeDoor", door });
    });
  });
  document.querySelectorAll("[data-kick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const door = btn.getAttribute("data-kick");
      runManual("Kick", `kick ${door}`, { type: "kick", door });
    });
  });

  // Keyfob (simulated). Any keyfob button also answers a child alert.
  keyfobToggle.addEventListener("click", () => {
    runManual("Keyfob", "keyfob carried", { type: "keyfobCarried", on: !car.getSnapshot().keyfobCarried });
  });
  document.querySelectorAll("[data-keyfob]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const button = btn.getAttribute("data-keyfob");
      runManual("Keyfob", `fob ${button}`, { type: "keyfob", button });
      childAlert.respond({ source: "keyfob" });
    });
  });

  // Child sensor (simulated, in memory only) and chime
  const chime = createChime();
  const alertBanner = document.getElementById("alert-banner");
  const alertBannerText = document.getElementById("alert-banner-text");
  const alertCountdown = document.getElementById("alert-countdown");
  const alertPanelStatus = document.getElementById("alert-panel-status");
  const soundToggle = document.getElementById("sound-toggle");
  const soundStatus = document.getElementById("sound-status");
  const childPresentInput = document.getElementById("child-present");
  const ownerDistanceInput = document.getElementById("owner-distance");
  const ownerDistanceText = document.getElementById("owner-distance-text");
  const alertLimitInput = document.getElementById("alert-limit");
  const alertLimitText = document.getElementById("alert-limit-text");
  const alertAckBtn = document.getElementById("alert-ack");

  const ALERT_RESULT = {
    started: "Alert started, 60 s countdown",
    ventilating: "Countdown ended, windows moved to 50%, chime continues"
  };

  function renderAlert(state, event) {
    const active = state.phase !== "idle";
    if (state.phase === "countdown") {
      alertCountdown.textContent = `Windows open to 50% in ${Math.ceil(state.remainingMs / 1000)} s.`;
    } else if (state.phase === "ventilating") {
      alertCountdown.textContent = "Ventilating. Windows moved to 50%. Chime on until a response.";
    } else {
      alertCountdown.textContent = "No alert.";
    }
    alertPanelStatus.textContent = alertCountdown.textContent;
    if (event === "tick") {
      return;
    }
    if (state.phase === "countdown") {
      alertBannerText.textContent = "Child alert (simulated). The owner moved away from a locked car. Windows open to 50% when the countdown ends. Answer to stop it.";
    } else if (state.phase === "ventilating") {
      alertBannerText.textContent = "Child alert (simulated). Windows moved to 50%. Answer to stop the chime.";
    }
    alertBanner.hidden = !active;
    if (active) {
      chime.start();
    } else {
      chime.stop();
    }
    soundStatus.textContent = chime.status();
    addLogEntry({
      mode: "Sensor",
      heard: "(sensor)",
      speakerText: "Simulated sensor",
      rejected: false,
      action: event,
      result: ALERT_RESULT[event] || event
    });
  }

  const childAlert = createChildAlert({ car, onChange: renderAlert });
  soundStatus.textContent = chime.status();
  for (const eventName of ["pointerdown", "keydown"]) {
    document.addEventListener(eventName, () => {
      chime.unlock();
      soundStatus.textContent = chime.status();
    }, { once: true });
  }
  document.addEventListener("visibilitychange", () => childAlert.tick());

  childPresentInput.addEventListener("change", () => childAlert.setChildPresent(childPresentInput.checked));
  ownerDistanceInput.addEventListener("input", () => {
    ownerDistanceText.textContent = `${ownerDistanceInput.value} m`;
    childAlert.setOwnerDistance(Number(ownerDistanceInput.value));
  });
  alertLimitInput.addEventListener("input", () => {
    alertLimitText.textContent = `${alertLimitInput.value} m`;
    childAlert.setAlertLimit(Number(alertLimitInput.value));
  });
  alertAckBtn.addEventListener("click", () => {
    carFeedback.textContent = childAlert.respond({ source: "ack" }).reason;
  });
  let soundOn = true;
  soundToggle.addEventListener("click", () => {
    soundOn = !soundOn;
    chime.setEnabled(soundOn);
    soundToggle.textContent = soundOn ? "Sound: on" : "Sound: off";
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundStatus.textContent = chime.status();
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

  consentCheckbox.checked = loadConsent();
  consentCheckbox.addEventListener("change", () => saveConsent(consentCheckbox.checked));

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
        : "No voiceprint enrolled. Mode A and manual car controls work without the model.";
      deleteVoiceprintBtn.disabled = true;
    }
  }

  function renderEnrolmentSentences() {
    enrolmentList.textContent = "";
    const enrolled = Boolean(loadVoiceprint());
    ENROLMENT_SENTENCES.forEach((sentence, idx) => {
      const captured = enrolled || Boolean(enrolmentEmbeddings[idx]);
      const li = document.createElement("li");
      li.className = "sentence-item";

      const textSpan = document.createElement("span");
      textSpan.textContent = `${idx + 1}. "${sentence}"`;

      const rightGroup = document.createElement("div");
      rightGroup.className = "button-grid";

      const stateSpan = document.createElement("span");
      stateSpan.className = captured
        ? "status-badge status-badge-ok"
        : "status-badge";
      stateSpan.textContent = captured ? "Captured (saved)" : "Pending";

      const recBtn = document.createElement("button");
      recBtn.type = "button";
      recBtn.textContent = "Hold to record";
      recBtn.disabled = enrolled;

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
          saveEnrolmentProgress(enrolmentEmbeddings);
          stateSpan.textContent = `Captured (${result.durationSeconds.toFixed(1)} s)`;
          stateSpan.className = "status-badge status-badge-ok";

          if (enrolmentEmbeddings.every(Boolean)) {
            const mean = computeMeanEmbedding(enrolmentEmbeddings);
            saveVoiceprint(mean);
            renderEnrolmentSentences();
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
          talkStatus.textContent = `Speaker rejected (${score.toFixed(2)}). Car unchanged.`;
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

    // Rejected speakers returned above. With no voiceprint, any recognized command counts.
    const ownerVerified = true;

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
      childAlert.respond({ source: "voice", ownerVerified });
      const fsmRes = car.dispatch(voiceAction(match.action, match.target));
      talkStatus.textContent = `Mode A: ${match.phrase} -> ${fsmRes.reason}`;
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
      const aiRes = await callGroqModeB({
        apiKey,
        model: activeGroqModel,
        rules: rulesInput.value,
        car: car.getSnapshot(),
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

      childAlert.respond({ source: "voice", ownerVerified });
      const fsmRes = car.dispatch(voiceAction(aiRes.action, aiRes.target));
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

  renderCar(car.getSnapshot());
  renderEnrolmentSentences();
  refreshVoiceprintUI();
  renderLog();

  // Restore the voice model from the device cache. This never starts the 97 MB download.
  isModelCached().then(async (cached) => {
    if (!cached) {
      return;
    }
    if (!loadVoiceprint() || !consentCheckbox.checked) {
      modelProgressWrap.hidden = false;
      modelProgressBar.value = 100;
      modelProgressText.textContent = "Voice model cached on this device.";
      return;
    }
    try {
      await loadVoiceModel(handleModelProgress);
    } catch (err) {
      voiceprintStatus.textContent = `Model load failed: ${err.message}`;
    }
  });
}
