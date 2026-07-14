import "./style.css";
import { supabase } from "./supabaseClient.js";

// DreamCatcher — mobile-first Sheepy companion UI
// Auth / dreams / insights APIs unchanged; presentation and navigation redesigned.

const STORAGE_KEY = "dreamcatcher.dreams";
const EMPTY_JOURNAL_HEADLINE = "No dreams have found their way here yet.";
const EMPTY_JOURNAL_SUBLINE = "Catch one, and Sheepy will give it a place among the stars.";

const INSIGHT_LABEL = {
  ask: "Ask Sheepy about this dream",
  loading: "Sheepy is looking a little closer…",
  fresh: "Sheepy noticed something",
  saved: "View Sheepy’s reflection",
};
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** @type {{ id: string, title: string, body: string, createdAt: string, insight?: object | null, insightCreatedAt?: string | null }[]} */
let cloudDreams = [];
/** @type {string | null} */
let currentUserId = null;
let dreamsLoadSeq = 0;
let saveInFlight = false;
let cloudDreamsReady = false;
/** @type {Promise<void> | null} */
let cloudDreamsLoading = null;
/** @type {Set<string>} */
const insightInFlight = new Set();
/** @type {string | null} */
let activeDreamId = null;
/** @type {"home" | "capture" | "journal" | "detail" | "sky" | "profile"} */
let activeAppScreen = "home";
let onboardingIndex = 0;
/** @type {Set<string>} */
const freshInsightDreamIds = new Set();
let captureConfirmVisible = false;
let journalLoadFailed = false;
/** @type {"login" | "signup"} */
let authTab = "login";

const LIMA = {
  latitude: -12.0464,
  longitude: -77.0428,
  timezone: "America/Lima",
  label: "Lima",
};

const HOME_MESSAGE = "Even a fragment of a dream is light enough.";

const onboardingScreen = document.getElementById("onboarding-screen");
const authScreen = document.getElementById("auth-screen");
const appShell = document.getElementById("app-shell");
const appScreens = {
  home: document.getElementById("screen-home"),
  capture: document.getElementById("screen-capture"),
  journal: document.getElementById("screen-journal"),
  detail: document.getElementById("screen-detail"),
  sky: document.getElementById("screen-sky"),
  profile: document.getElementById("screen-profile"),
};

const titleInput = document.getElementById("dream-title");
const bodyInput = document.getElementById("dream-body");
const saveButton = document.getElementById("save-dream");
const statusEl = document.getElementById("status");
const captureConfirm = document.getElementById("capture-confirm");
const captureForm = document.getElementById("capture-form");
const captureScreen = document.getElementById("screen-capture");
const captureComposeHead = document.getElementById("capture-compose-head");
const captureComposeBack = document.getElementById("capture-compose-back");
const captureOpenJournal = document.getElementById("capture-open-journal");
const captureConfirmHome = document.getElementById("capture-confirm-home");
const appMain = document.getElementById("app-main");
const journalEmpty = document.getElementById("journal-empty");
const emptyState = document.getElementById("empty-state");
const emptyStateSub = document.getElementById("empty-state-sub");
const dreamList = document.getElementById("dream-list");
const dreamCount = document.getElementById("dream-count");
const wordCount = document.getElementById("word-count");
const skyCaption = document.getElementById("sky-caption");
const moon = document.getElementById("moon");
const dreamStage = document.getElementById("dream-stage");
const pixelCaret = document.getElementById("pixel-caret");
const starCanvas = document.getElementById("starfield");
const starCtx = starCanvas.getContext("2d", { alpha: true });
const homeCatchBtn = document.getElementById("home-catch");
const homeMessageEl = document.getElementById("home-sheepy-message");
const detailTitle = document.getElementById("detail-title");
const detailDate = document.getElementById("detail-date");
const detailBody = document.getElementById("detail-body");
const detailDeleteBtn = document.getElementById("detail-delete");
const detailInsight = document.getElementById("detail-insight");
const detailInsightBtn = document.getElementById("detail-insight-btn");
const skyStarField = document.getElementById("sky-star-field");
const skyStarCount = document.getElementById("sky-star-count");
const bottomNav = document.getElementById("bottom-nav");

const onboardingSlides = [...document.querySelectorAll(".onboarding-slide")];
const onboardingDots = document.getElementById("onboarding-dots");
const onboardingNext = document.getElementById("onboarding-next");
const onboardingBegin = document.getElementById("onboarding-begin");
const onboardingSkip = document.getElementById("onboarding-skip");
const onboardingLogin = document.getElementById("onboarding-login");

const authSignin = document.getElementById("auth-signin");
const authResetRequest = document.getElementById("auth-reset-request");
const authResetUpdate = document.getElementById("auth-reset-update");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authResetEmail = document.getElementById("auth-reset-email");
const authNewPassword = document.getElementById("auth-new-password");
const authConfirmPassword = document.getElementById("auth-confirm-password");
const authLoginBtn = document.getElementById("auth-login");
const authSignupBtn = document.getElementById("auth-signup");
const authForgotBtn = document.getElementById("auth-forgot");
const authSendResetBtn = document.getElementById("auth-send-reset");
const authBackSigninBtn = document.getElementById("auth-back-signin");
const authUpdatePasswordBtn = document.getElementById("auth-update-password");
const authLogoutBtn = document.getElementById("auth-logout");
const authUserEl = document.getElementById("auth-user");
const authStatusEl = document.getElementById("auth-status");
const authTabLogin = document.getElementById("auth-tab-login");
const authTabSignup = document.getElementById("auth-tab-signup");

/** @type {"signin" | "request-reset" | "set-password"} */
let authMode = "signin";
let passwordRecoveryPending = false;
/** @type {string | null} */
let pendingSignedOutMessage = null;

/* =========================
   FLOW / SCREEN NAVIGATION
   ========================= */

function showFlow(flow) {
  document.body.dataset.flow = flow;
  if (onboardingScreen) onboardingScreen.hidden = flow !== "onboarding";
  if (authScreen) authScreen.hidden = flow !== "auth";
  if (appShell) appShell.hidden = flow !== "app";
}

function setAppScreen(screen) {
  activeAppScreen = screen;
  if (appShell) appShell.dataset.active = screen;

  if (screen !== "capture" && captureConfirmVisible) {
    hideCaptureConfirm();
  }

  for (const [name, el] of Object.entries(appScreens)) {
    if (el) el.hidden = name !== screen;
  }

  bottomNav?.querySelectorAll(".bottom-nav__item").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.nav === screen);
  });

  if (screen === "home") updateHomeMessage();
  if (screen === "sky") renderSkyPrototype();
  if (screen === "capture") {
    updateWordCount();
    window.setTimeout(() => {
      if (!captureConfirmVisible) bodyInput?.focus();
    }, 50);
  }
}

function updateHomeMessage() {
  if (!homeMessageEl) return;
  homeMessageEl.textContent = HOME_MESSAGE;
}

function renderSkyPrototype() {
  if (!skyStarField || !skyStarCount) return;
  skyStarField.replaceChildren();
  const count = cloudDreams.length;
  if (count === 0) {
    skyStarCount.textContent = "No stars yet — catch a dream to begin.";
    return;
  }

  skyStarCount.textContent =
    count === 1 ? "1 dream-star is waiting with Sheepy." : `${count} dream-stars are waiting with Sheepy.`;

  const maxVisual = Math.min(count, 24);
  for (let i = 0; i < maxVisual; i++) {
    const star = document.createElement("span");
    star.className = "sky-proto-star";
    star.style.left = `${8 + ((i * 37) % 84)}%`;
    star.style.top = `${12 + ((i * 53) % 70)}%`;
    star.style.animationDelay = `${(i % 5) * 0.35}s`;
    skyStarField.appendChild(star);
  }
}

function buildOnboardingDots() {
  if (!onboardingDots) return;
  onboardingDots.replaceChildren();
  onboardingSlides.forEach((_, i) => {
    const dot = document.createElement("span");
    if (i === onboardingIndex) dot.classList.add("is-active");
    onboardingDots.appendChild(dot);
  });
}

function renderOnboardingSlide() {
  onboardingSlides.forEach((slide, i) => {
    const active = i === onboardingIndex;
    slide.hidden = !active;
    slide.classList.toggle("is-active", active);
  });
  buildOnboardingDots();
  const last = onboardingIndex >= onboardingSlides.length - 1;
  if (onboardingNext) onboardingNext.hidden = last;
  if (onboardingBegin) onboardingBegin.hidden = !last;
}

function startOnboarding() {
  onboardingIndex = 0;
  showFlow("onboarding");
  renderOnboardingSlide();
}

function goToAuth({ tab = "login" } = {}) {
  showFlow("auth");
  setAuthTab(tab);
  setAuthMode("signin");
}

function setAuthTab(tab) {
  authTab = tab === "signup" ? "signup" : "login";
  authTabLogin?.classList.toggle("is-active", authTab === "login");
  authTabSignup?.classList.toggle("is-active", authTab === "signup");
  if (authTabLogin) authTabLogin.setAttribute("aria-selected", String(authTab === "login"));
  if (authTabSignup) authTabSignup.setAttribute("aria-selected", String(authTab === "signup"));
  if (authLoginBtn) authLoginBtn.hidden = authTab !== "login";
  if (authSignupBtn) authSignupBtn.hidden = authTab !== "signup";
  if (authForgotBtn) authForgotBtn.hidden = authTab !== "login";
  if (authPassword) {
    authPassword.autocomplete = authTab === "signup" ? "new-password" : "current-password";
  }
  clearStaleAuthStatus();
}

/* =========================
   DATA HELPERS (unchanged contracts)
   ========================= */

function loadLocalDreams() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapRowToDream(row) {
  return {
    id: row.id,
    title: row.title ?? "",
    body: row.body ?? "",
    createdAt: row.created_at,
    insight: null,
    insightCreatedAt: null,
  };
}

function friendlyInsightError(error, fallback = "Couldn’t generate this insight. Try again.") {
  const raw = (error?.message || String(error || "")).trim();
  const lower = raw.toLowerCase();
  if (!raw) return fallback;
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
    return "Couldn’t reach Dream Insights. Check your connection and try again.";
  }
  if (lower.includes("session") || lower.includes("sign in") || lower.includes("log in")) {
    return "Your session expired. Log in again to use Dream Insights.";
  }
  return raw || fallback;
}

function getInsightStateLabel(dream) {
  if (insightInFlight.has(dream.id)) return INSIGHT_LABEL.loading;
  if (dream.insight) {
    return freshInsightDreamIds.has(dream.id) ? INSIGHT_LABEL.fresh : INSIGHT_LABEL.saved;
  }
  return INSIGHT_LABEL.ask;
}

function showCaptureConfirm() {
  captureConfirmVisible = true;
  if (captureConfirm) captureConfirm.hidden = false;
  if (captureForm) captureForm.hidden = true;
  if (captureComposeHead) captureComposeHead.hidden = true;
  captureScreen?.classList.add("is-post-save");

  // Keep the return control in view (form scroll can leave the header above the fold).
  if (appMain) appMain.scrollTop = 0;
  if (captureScreen) captureScreen.scrollTop = 0;
  window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  captureOpenJournal?.focus({ preventScroll: true });
}

function hideCaptureConfirm() {
  captureConfirmVisible = false;
  if (captureConfirm) captureConfirm.hidden = true;
  if (captureForm) captureForm.hidden = false;
  if (captureComposeHead) captureComposeHead.hidden = false;
  captureScreen?.classList.remove("is-post-save");
}

function setJournalEmptyVisible(visible) {
  if (journalEmpty) journalEmpty.hidden = !visible;
  if (emptyState) emptyState.hidden = !visible;
  if (emptyStateSub) emptyStateSub.hidden = !visible;
}

function setJournalEmptyCopy() {
  if (emptyState) emptyState.textContent = EMPTY_JOURNAL_HEADLINE;
  if (emptyStateSub) emptyStateSub.textContent = EMPTY_JOURNAL_SUBLINE;
}

function buildSymbolsAndPatternsLines(insight) {
  const lines = [];

  for (const symbol of insight.symbols || []) {
    lines.push(`${symbol.symbol} — ${symbol.possible_meaning}`);
  }
  for (const theme of insight.themes || []) {
    lines.push(theme);
  }
  for (const emotion of insight.emotions || []) {
    lines.push(`Feeling: ${emotion}`);
  }
  for (const person of insight.people || []) {
    lines.push(`${person.name_or_role} — ${person.possible_dynamic}`);
  }
  for (const place of insight.places || []) {
    lines.push(`${place.place} — ${place.possible_significance}`);
  }

  return lines;
}

function renderInsightContent(panel, insight, { fresh = false } = {}) {
  panel.hidden = false;
  panel.classList.remove("is-error", "is-loading");
  panel.replaceChildren();

  const noticedHeading = document.createElement("h4");
  noticedHeading.className = "dream-insight__heading";
  noticedHeading.textContent = "What Sheepy noticed";
  panel.appendChild(noticedHeading);

  const summary = document.createElement("p");
  summary.className = "dream-insight__summary";
  summary.textContent = insight.summary;
  panel.appendChild(summary);

  const patternsLines = buildSymbolsAndPatternsLines(insight);
  if (patternsLines.length) {
    const patternsWrap = document.createElement("details");
    patternsWrap.className = "dream-insight__section-block dream-insight__details";
    patternsWrap.open = patternsLines.length <= 4;

    const patternsSummary = document.createElement("summary");
    patternsSummary.className = "dream-insight__section-toggle";
    patternsSummary.textContent = "Symbols and patterns";
    patternsWrap.appendChild(patternsSummary);

    const patternsBody = document.createElement("div");
    patternsBody.className = "dream-insight__section-body";
    const patternsList = document.createElement("ul");
    for (const line of patternsLines) {
      const li = document.createElement("li");
      li.textContent = line;
      patternsList.appendChild(li);
    }
    patternsBody.appendChild(patternsList);
    patternsWrap.appendChild(patternsBody);
    panel.appendChild(patternsWrap);
  }

  if (insight.reflection_questions?.length) {
    const reflectHeading = document.createElement("h4");
    reflectHeading.className = "dream-insight__heading";
    reflectHeading.textContent = "Something to reflect on";
    panel.appendChild(reflectHeading);

    const reflectList = document.createElement("ul");
    reflectList.className = "dream-insight__reflect-list";
    for (const question of insight.reflection_questions) {
      const li = document.createElement("li");
      li.textContent = question;
      reflectList.appendChild(li);
    }
    panel.appendChild(reflectList);
  }

  if (insight.uncertainty_note) {
    const note = document.createElement("p");
    note.className = "dream-insight__note";
    note.textContent = insight.uncertainty_note;
    panel.appendChild(note);
  }

  if (insight.return_message) {
    const ret = document.createElement("p");
    ret.className = "dream-insight__return";
    ret.textContent = insight.return_message;
    panel.appendChild(ret);
  }

  if (fresh) {
    const freshLabel = document.createElement("p");
    freshLabel.className = "dream-insight__fresh-label";
    freshLabel.textContent = INSIGHT_LABEL.fresh;
    panel.prepend(freshLabel);
  }
}

function showInsightLoading(panel) {
  panel.hidden = false;
  panel.classList.add("is-loading");
  panel.classList.remove("is-error");
  panel.replaceChildren();
  const p = document.createElement("p");
  p.className = "dream-insight__status";
  p.textContent = INSIGHT_LABEL.loading;
  panel.appendChild(p);
}

function showInsightError(panel, message, onRetry) {
  panel.hidden = false;
  panel.classList.add("is-error");
  panel.classList.remove("is-loading");
  panel.replaceChildren();

  const p = document.createElement("p");
  p.className = "dream-insight__status";
  p.textContent = message;
  panel.appendChild(p);

  const retry = document.createElement("button");
  retry.type = "button";
  retry.className = "ghost-btn";
  retry.textContent = "Try again";
  retry.addEventListener("click", onRetry);
  panel.appendChild(retry);
}

async function fetchInsightsForDreams(dreamIds) {
  if (!supabase || !dreamIds.length) return new Map();

  const { data, error } = await supabase
    .from("dream_insights")
    .select("dream_id, content, created_at")
    .in("dream_id", dreamIds);

  if (error) {
    console.warn("Could not load dream insights:", error.message || error);
    return new Map();
  }

  const map = new Map();
  for (const row of data || []) {
    map.set(row.dream_id, {
      insight: row.content,
      insightCreatedAt: row.created_at,
    });
  }
  return map;
}

async function requestDreamInsight(dreamId) {
  if (!supabase) {
    throw new Error("Account features aren't available right now.");
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("Sign in to generate a Dream Insight.");
  }

  const response = await fetch("/api/dream-insights", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ dreamId }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || "Couldn’t generate this insight. Try again.");
  }

  if (!payload?.insight) {
    throw new Error("Couldn’t generate this insight. Try again.");
  }

  return payload;
}

function setJournalLoading(loading) {
  if (loading) {
    dreamList.innerHTML = "";
    setJournalEmptyVisible(true);
    if (emptyState) emptyState.textContent = "Loading dreams…";
    if (emptyStateSub) emptyStateSub.hidden = true;
    dreamCount.textContent = "…";
    return;
  }
  setJournalEmptyCopy();
}

function friendlyDreamError(error) {
  const raw = (error?.message || String(error || "Something went wrong")).trim();
  const lower = raw.toLowerCase();
  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
    return "Couldn’t reach the dream archive. Check your connection and try again.";
  }
  if (lower.includes("jwt") || lower.includes("not authenticated") || lower.includes("session")) {
    return "Your session expired. Log in again to use the journal.";
  }
  return raw || "Something went wrong with the dream archive.";
}

async function fetchCloudDreams(userId) {
  const { data, error } = await supabase
    .from("dreams")
    .select("id, title, body, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const dreams = (data || []).map(mapRowToDream);
  const insightMap = await fetchInsightsForDreams(dreams.map((d) => d.id));
  for (const dream of dreams) {
    const saved = insightMap.get(dream.id);
    if (saved) {
      dream.insight = saved.insight;
      dream.insightCreatedAt = saved.insightCreatedAt;
    }
  }
  return dreams;
}

async function loadCloudDreamsForUser(userId) {
  const seq = ++dreamsLoadSeq;
  setJournalLoading(true);

  try {
    const dreams = await fetchCloudDreams(userId);
    if (seq !== dreamsLoadSeq) return;
    cloudDreams = dreams;
    cloudDreamsReady = true;
    journalLoadFailed = false;
    setJournalLoading(false);
    renderDreams();
    updateHomeMessage();
    if (activeAppScreen === "sky") renderSkyPrototype();
    if (activeAppScreen === "detail" && activeDreamId) renderDreamDetail(activeDreamId);
  } catch (error) {
    if (seq !== dreamsLoadSeq) return;
    cloudDreams = [];
    cloudDreamsReady = false;
    journalLoadFailed = true;
    setJournalLoading(false);
    renderDreams();
    if (journalEmpty) journalEmpty.hidden = false;
    if (emptyState) emptyState.textContent = friendlyDreamError(error);
    if (emptyStateSub) emptyStateSub.hidden = true;
    setStatus(friendlyDreamError(error));
  }
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function updateWordCount() {
  if (!bodyInput || !wordCount) return;
  const n = countWords(bodyInput.value);
  wordCount.textContent = n === 1 ? "1 word" : `${n} words`;
}

function formatWhen(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function previewText(body, max = 110) {
  const cleaned = String(body || "").replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function setStatus(message) {
  if (!statusEl) return;
  statusEl.textContent = message;
  if (!message) return;
  window.clearTimeout(setStatus._timer);
  setStatus._timer = window.setTimeout(() => {
    statusEl.textContent = "";
  }, 2800);
}

/* =========================
   JOURNAL + DETAIL (insight attached)
   ========================= */

function renderDreams() {
  const dreams = cloudDreams;
  dreamList.innerHTML = "";

  dreamCount.textContent = dreams.length === 1 ? "1 saved" : `${dreams.length} saved`;
  const showEmpty = dreams.length === 0 && !journalLoadFailed;
  setJournalEmptyVisible(showEmpty);
  if (showEmpty) {
    setJournalEmptyCopy();
  }

  for (const dream of dreams) {
    const item = document.createElement("li");
    const card = document.createElement("article");
    card.className = "journal-card";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "journal-card__open";
    openBtn.dataset.id = dream.id;

    const head = document.createElement("div");
    head.className = "journal-card__head";

    const title = document.createElement("h3");
    title.className = "journal-card__title";
    title.textContent = dream.title || "Untitled dream";

    const chevron = document.createElement("span");
    chevron.className = "journal-card__chevron";
    chevron.setAttribute("aria-hidden", "true");

    head.append(title, chevron);

    const timeEl = document.createElement("time");
    timeEl.className = "journal-card__date";
    timeEl.textContent = formatWhen(dream.createdAt);
    timeEl.dateTime = dream.createdAt;

    const preview = document.createElement("p");
    preview.className = "journal-card__preview";
    preview.textContent = previewText(dream.body);

    const state = document.createElement("span");
    state.className = "journal-card__state";
    state.textContent = getInsightStateLabel(dream);

    openBtn.append(head, timeEl, preview, state);
    openBtn.addEventListener("click", () => {
      openDreamDetail(dream.id);
    });

    card.appendChild(openBtn);
    item.appendChild(card);
    dreamList.appendChild(item);
  }
}

function openDreamDetail(dreamId) {
  activeDreamId = dreamId;
  renderDreamDetail(dreamId);
  setAppScreen("detail");
}

function renderDreamDetail(dreamId) {
  const dream = cloudDreams.find((d) => d.id === dreamId);
  if (!dream || !detailTitle || !detailDate || !detailBody || !detailInsight || !detailInsightBtn) {
    return;
  }

  detailTitle.textContent = dream.title || "Untitled dream";
  detailDate.textContent = formatWhen(dream.createdAt);
  detailDate.dateTime = dream.createdAt;
  detailBody.textContent = dream.body;

  detailInsight.classList.remove("is-error", "is-loading");
  detailInsightBtn.classList.remove("is-loading-state");

  if (insightInFlight.has(dream.id)) {
    detailInsightBtn.hidden = false;
    detailInsightBtn.disabled = true;
    detailInsightBtn.textContent = INSIGHT_LABEL.loading;
    detailInsightBtn.classList.add("is-loading-state");
    detailInsight.hidden = true;
    detailInsight.replaceChildren();
    return;
  }

  if (dream.insight) {
    const isFresh = freshInsightDreamIds.has(dream.id);

    if (isFresh) {
      renderInsightContent(detailInsight, dream.insight, { fresh: true });
      detailInsight.hidden = false;
      detailInsightBtn.hidden = true;
      detailInsightBtn.disabled = false;
      freshInsightDreamIds.delete(dream.id);
      renderDreams();
      return;
    }

    detailInsightBtn.hidden = false;
    detailInsightBtn.disabled = false;
    detailInsightBtn.textContent = INSIGHT_LABEL.saved;
    detailInsight.hidden = true;
    detailInsight.replaceChildren();
    return;
  }

  detailInsight.hidden = true;
  detailInsight.replaceChildren();
  detailInsightBtn.hidden = false;
  detailInsightBtn.disabled = false;
  detailInsightBtn.textContent = INSIGHT_LABEL.ask;
}

async function generateInsightForDream(dreamId) {
  if (!currentUserId || !supabase) {
    setStatus("You’re not signed in.");
    return;
  }

  if (insightInFlight.has(dreamId)) return;

  const dream = cloudDreams.find((d) => d.id === dreamId);
  if (!dream) return;

  if (dream.insight) {
    if (activeAppScreen === "detail") renderDreamDetail(dreamId);
    renderDreams();
    return;
  }

  if (!String(dream.body || "").trim()) {
    setStatus("This dream has no text to reflect on.");
    return;
  }

  insightInFlight.add(dreamId);
  if (activeAppScreen === "detail" && activeDreamId === dreamId) {
    renderDreamDetail(dreamId);
  } else {
    renderDreams();
  }

  let failed = false;
  try {
    const payload = await requestDreamInsight(dreamId);
    const target = cloudDreams.find((d) => d.id === dreamId);
    if (target) {
      target.insight = payload.insight;
      target.insightCreatedAt = payload.createdAt || new Date().toISOString();
    }
    freshInsightDreamIds.add(dreamId);
    setStatus("");
  } catch (error) {
    failed = true;
    const message = friendlyInsightError(error);
    if (activeAppScreen === "detail" && activeDreamId === dreamId) {
      if (detailInsight) {
        showInsightError(detailInsight, message, () => {
          void generateInsightForDream(dreamId);
        });
      }
      if (detailInsightBtn) {
        detailInsightBtn.hidden = false;
        detailInsightBtn.disabled = false;
        detailInsightBtn.textContent = INSIGHT_LABEL.ask;
      }
    }
    setStatus(message);
  } finally {
    insightInFlight.delete(dreamId);
    if (!failed) {
      renderDreams();
      if (activeAppScreen === "detail" && activeDreamId === dreamId) {
        renderDreamDetail(dreamId);
      }
    }
  }
}

async function deleteCloudDream(dreamId) {
  const ok = window.confirm("Delete this dream? This can’t be undone.");
  if (!ok) return;
  if (!supabase || !currentUserId) {
    setStatus("You’re not signed in.");
    return;
  }

  if (detailDeleteBtn) detailDeleteBtn.disabled = true;

  const { error } = await supabase.from("dreams").delete().eq("id", dreamId).eq("user_id", currentUserId);

  if (detailDeleteBtn) detailDeleteBtn.disabled = false;

  if (error) {
    setStatus(friendlyDreamError(error));
    return;
  }

  cloudDreams = cloudDreams.filter((d) => d.id !== dreamId);
  insightInFlight.delete(dreamId);
  if (activeDreamId === dreamId) activeDreamId = null;
  setStatus("Dream deleted.");
  renderDreams();
  updateHomeMessage();
  setAppScreen("journal");
}

/* =========================
   PIXEL MOONLIGHT CARET
   ========================= */

const caretMirror = document.createElement("div");
caretMirror.setAttribute("aria-hidden", "true");
Object.assign(caretMirror.style, {
  position: "absolute",
  visibility: "hidden",
  whiteSpace: "pre-wrap",
  wordWrap: "break-word",
  overflowWrap: "break-word",
  top: "0",
  left: "-9999px",
  pointerEvents: "none",
});
document.body.appendChild(caretMirror);

function copyTextareaStylesToMirror() {
  if (!bodyInput) return;
  const style = window.getComputedStyle(bodyInput);
  const props = [
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "letterSpacing",
    "lineHeight",
    "textTransform",
    "wordSpacing",
    "textIndent",
    "paddingTop",
    "paddingRight",
    "paddingBottom",
    "paddingLeft",
    "borderTopWidth",
    "borderRightWidth",
    "borderBottomWidth",
    "borderLeftWidth",
    "boxSizing",
    "width",
  ];
  for (const prop of props) {
    caretMirror.style[prop] = style[prop];
  }
  caretMirror.style.width = `${bodyInput.clientWidth}px`;
}

function updatePixelCaret() {
  if (!bodyInput || !pixelCaret || !dreamStage) return;
  const focused = document.activeElement === bodyInput;
  const writing = bodyInput.value.length > 0;

  if (!focused || !writing) {
    pixelCaret.classList.remove("is-on");
    return;
  }

  copyTextareaStylesToMirror();

  const value = bodyInput.value;
  const pos = bodyInput.selectionStart ?? value.length;
  const before = value.slice(0, pos);
  const marker = document.createElement("span");
  marker.textContent = "|";

  caretMirror.textContent = "";
  caretMirror.appendChild(document.createTextNode(before));
  caretMirror.appendChild(marker);

  const stageRect = dreamStage.getBoundingClientRect();
  const inputRect = bodyInput.getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const mirrorRect = caretMirror.getBoundingClientRect();

  const x = inputRect.left - stageRect.left + (markerRect.left - mirrorRect.left);
  const y =
    inputRect.top - stageRect.top + (markerRect.top - mirrorRect.top) - bodyInput.scrollTop;

  const lineHeight = Number.parseFloat(window.getComputedStyle(bodyInput).lineHeight) || 22;

  pixelCaret.style.height = `${lineHeight * 0.9}px`;
  pixelCaret.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  pixelCaret.classList.add("is-on");
}

/* =========================
   SAVE RITUAL
   ========================= */

function getMoonCenter() {
  const rect = moon.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getTextareaLaunchPoint() {
  const rect = bodyInput.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + Math.min(rect.height * 0.45, 90),
  };
}

function addDreamStar(x, y, { born = true } = {}) {
  dreamStars.push({
    x,
    y,
    size: 2,
    base: 0.85,
    phase: Math.random() * Math.PI * 2,
    speed: 0.6 + Math.random() * 0.8,
    bornAt: born ? performance.now() : 0,
  });
}

function seedDreamStarsFromJournal() {
  const count = cloudDreams.length;
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let i = 0; i < count; i++) {
    addDreamStar(w * (0.08 + Math.random() * 0.84), h * (0.06 + Math.random() * 0.45), {
      born: false,
    });
  }
}

function playSaveRitual() {
  if (!moon || !bodyInput) return Promise.resolve();
  const start = getTextareaLaunchPoint();
  const end = getMoonCenter();

  if (prefersReducedMotion || end.x === 0) {
    addDreamStar(end.x + (Math.random() * 24 - 12) || window.innerWidth * 0.7, end.y || 80);
    return Promise.resolve();
  }

  const orb = document.createElement("div");
  orb.className = "dream-orb";
  orb.style.left = `${start.x}px`;
  orb.style.top = `${start.y}px`;
  document.body.appendChild(orb);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const duration = 1800;

  const animation = orb.animate(
    [
      { transform: "translate3d(0, 0, 0) scale(0.55)", opacity: 0, offset: 0 },
      { transform: "translate3d(0, -12px, 0) scale(1)", opacity: 0.95, offset: 0.12 },
      {
        transform: `translate3d(${dx * 0.55}px, ${dy * 0.35 - 40}px, 0) scale(0.9)`,
        opacity: 0.9,
        offset: 0.55,
      },
      {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.35)`,
        opacity: 0.75,
        offset: 0.88,
      },
      {
        transform: `translate3d(${dx}px, ${dy}px, 0) scale(0.15)`,
        opacity: 0,
        offset: 1,
      },
    ],
    {
      duration,
      easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
      fill: "forwards",
    }
  );

  return animation.finished.then(() => {
    orb.remove();
    addDreamStar(end.x + (Math.random() * 36 - 18), end.y + 8 + Math.random() * 28);
  });
}

async function saveCurrentDream() {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!body) {
    setStatus("Write the dream first — even a few messy lines.");
    bodyInput.focus();
    return;
  }

  if (!supabase || !currentUserId) {
    setStatus("You’re not signed in.");
    return;
  }

  if (saveInFlight) return;
  saveInFlight = true;
  saveButton.disabled = true;
  setStatus("Catching dream…");

  const { data, error } = await supabase
    .from("dreams")
    .insert({
      user_id: currentUserId,
      title,
      body,
    })
    .select("id, title, body, created_at")
    .single();

  saveInFlight = false;
  saveButton.disabled = false;

  if (error) {
    setStatus(friendlyDreamError(error));
    return;
  }

  cloudDreams.unshift(mapRowToDream(data));

  titleInput.value = "";
  bodyInput.value = "";
  updateWordCount();
  updatePixelCaret();
  renderDreams();
  updateHomeMessage();

  showCaptureConfirm();
  void playSaveRitual();
}

/* =========================
   LIMA CAPTION + STARFIELD + SHEEPY
   ========================= */

function formatClock(date, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function pickCloudLevel(cloudCover) {
  if (cloudCover == null) return "clear";
  if (cloudCover >= 70) return "heavy";
  if (cloudCover >= 35) return "soft";
  return "clear";
}

function cloudLabel(level) {
  if (level === "heavy") return "heavy clouds";
  if (level === "soft") return "soft clouds";
  return "clear";
}

function applyCaption(clouds, note) {
  document.body.dataset.clouds = clouds;
  const now = new Date();
  if (skyCaption) {
    skyCaption.textContent = `${LIMA.label} · ${formatClock(now, LIMA.timezone)} · night sky · ${cloudLabel(clouds)}${note || ""}`;
  }
}

function fallbackCaption() {
  applyCaption("soft", " (time only)");
}

async function syncLimaSky() {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${LIMA.latitude}` +
      `&longitude=${LIMA.longitude}` +
      `&current=cloud_cover` +
      `&timezone=${encodeURIComponent(LIMA.timezone)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather request failed");
    const data = await response.json();
    applyCaption(pickCloudLevel(data.current?.cloud_cover ?? 0), "");
  } catch {
    fallbackCaption();
  }
}

const STAR_COUNT = 240;
let stars = [];
let dreamStars = [];
let shootingStar = null;
let nextShootingAt = 0;
let starfieldRunning = false;

function resizeStarfield() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  starCanvas.width = Math.floor(w * dpr);
  starCanvas.height = Math.floor(h * dpr);
  starCanvas.style.width = `${w}px`;
  starCanvas.style.height = `${h}px`;
  starCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createStars() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  stars = Array.from({ length: STAR_COUNT }, () => {
    const roll = Math.random();
    const fades = Math.random() < 0.3;
    let size;
    if (roll < 0.5) size = 1;
    else if (roll < 0.78) size = 1.4;
    else if (roll < 0.92) size = 1.8;
    else size = 2.2;

    return {
      x: Math.random() * w,
      y: Math.random() * h * 0.82,
      size,
      base: 0.12 + Math.random() * 0.65,
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 1.4,
      fades,
      fadeSpeed: 0.1 + Math.random() * 0.28,
    };
  });
}

function scheduleShootingStar(now) {
  nextShootingAt = now + 40000 + Math.random() * 15000;
}

function spawnShootingStar() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  shootingStar = {
    x: w * (0.1 + Math.random() * 0.7),
    y: h * (0.05 + Math.random() * 0.25),
    vx: 220 + Math.random() * 160,
    vy: 90 + Math.random() * 70,
    life: 0,
    maxLife: 0.7 + Math.random() * 0.35,
  };
}

function drawDreamStar(star, t, now) {
  let alpha = star.base * (0.75 + 0.25 * Math.sin(t * star.speed + star.phase));

  if (star.bornAt) {
    const age = now - star.bornAt;
    if (age < 1800) {
      const bloom = 1 - age / 1800;
      alpha = Math.min(1, alpha + bloom * 0.5);
      const glow = 6 + bloom * 10;
      starCtx.fillStyle = `rgba(210, 202, 190, ${bloom * 0.22})`;
      starCtx.beginPath();
      starCtx.arc(star.x, star.y, glow, 0, Math.PI * 2);
      starCtx.fill();
    }
  }

  starCtx.fillStyle = `rgba(232, 226, 218, ${Math.max(0.35, Math.min(1, alpha))})`;
  const s = star.size;
  starCtx.fillRect(star.x - s, star.y, s * 2 + 1, 1);
  starCtx.fillRect(star.x, star.y - s, 1, s * 2 + 1);
}

function drawStarfield(now) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const t = now / 1000;

  starCtx.clearRect(0, 0, w, h);

  for (const star of stars) {
    let alpha = star.base;
    alpha *= 0.65 + 0.35 * Math.sin(t * star.speed + star.phase);
    if (star.fades) {
      alpha *= 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * star.fadeSpeed + star.phase));
    }
    alpha = Math.max(0.04, Math.min(0.9, alpha));
    const dim = 248 - Math.floor((1 - star.base) * 28);
    starCtx.fillStyle = `rgba(${dim}, ${dim + 2}, ${dim + 6}, ${alpha})`;
    starCtx.fillRect(star.x, star.y, star.size, star.size);
  }

  for (const star of dreamStars) {
    drawDreamStar(star, t, now);
  }

  if (shootingStar) {
    const s = shootingStar;
    s.life += 1 / 60;
    s.x += s.vx / 60;
    s.y += s.vy / 60;

    const progress = s.life / s.maxLife;
    const alpha = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;

    if (alpha > 0) {
      starCtx.strokeStyle = `rgba(255, 250, 235, ${Math.max(0, alpha) * 0.75})`;
      starCtx.lineWidth = 1;
      starCtx.beginPath();
      starCtx.moveTo(s.x, s.y);
      starCtx.lineTo(s.x - s.vx * 0.08, s.y - s.vy * 0.08);
      starCtx.stroke();

      starCtx.fillStyle = `rgba(255, 252, 240, ${Math.max(0, alpha)})`;
      starCtx.fillRect(s.x, s.y, 2, 2);
    }

    if (s.life >= s.maxLife) {
      shootingStar = null;
      scheduleShootingStar(now);
    }
  } else if (now >= nextShootingAt) {
    spawnShootingStar();
  }
}

function starfieldLoop(now) {
  if (!starfieldRunning) return;
  drawStarfield(now);
  requestAnimationFrame(starfieldLoop);
}

function startStarfield() {
  resizeStarfield();
  createStars();
  seedDreamStarsFromJournal();

  if (prefersReducedMotion) {
    drawStarfield(0);
    return;
  }

  scheduleShootingStar(performance.now());
  starfieldRunning = true;
  requestAnimationFrame(starfieldLoop);
}

window.addEventListener("resize", () => {
  resizeStarfield();
  createStars();
  if (!starfieldRunning) drawStarfield(performance.now());
});

function clearSheepyActions() {
  document.querySelectorAll(".sheepy").forEach((el) => {
    el.classList.remove("is-blink", "is-yawn", "is-sleep");
  });
}

function emitSheepyStar() {
  const hosts = [...document.querySelectorAll(".sheepy")].filter((el) => {
    const screen = el.closest(".app-screen");
    return !screen || !screen.hidden;
  });
  const bob = hosts[0]?.querySelector(".sheepy__bob");
  if (!bob) return;
  const star = document.createElement("span");
  star.className = "sheepy-star";
  bob.appendChild(star);
  window.setTimeout(() => star.remove(), 1700);
}

function runSheepyAction() {
  if (prefersReducedMotion) return;

  const visible = [...document.querySelectorAll(".sheepy")].filter((el) => {
    const screen = el.closest(".app-screen");
    return !screen || !screen.hidden;
  });
  if (!visible.length) return;

  clearSheepyActions();
  const roll = Math.random();
  const target = visible[0];

  if (roll < 0.35) {
    target.classList.add("is-blink");
    window.setTimeout(clearSheepyActions, 220);
  } else if (roll < 0.55) {
    target.classList.add("is-yawn");
    window.setTimeout(clearSheepyActions, 750);
  } else if (roll < 0.75) {
    target.classList.add("is-sleep");
    window.setTimeout(clearSheepyActions, 1600);
  } else {
    emitSheepyStar();
  }
}

function scheduleSheepyAction() {
  if (prefersReducedMotion) return;
  const delay = 15000 + Math.random() * 5000;
  window.setTimeout(() => {
    runSheepyAction();
    scheduleSheepyAction();
  }, delay);
}

/* =========================
   AUTH GATE (Supabase email) — logic preserved
   ========================= */

function getPasswordRecoveryRedirectUrl() {
  const base = import.meta.env.BASE_URL || "/";
  return new URL(base, window.location.origin).href;
}

function urlIndicatesPasswordRecovery() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const search = window.location.search.startsWith("?")
    ? window.location.search.slice(1)
    : window.location.search;
  const fromHash = new URLSearchParams(hash).get("type");
  const fromSearch = new URLSearchParams(search).get("type");
  return fromHash === "recovery" || fromSearch === "recovery";
}

function setAuthBusy(busy) {
  [
    authLoginBtn,
    authSignupBtn,
    authLogoutBtn,
    authForgotBtn,
    authSendResetBtn,
    authBackSigninBtn,
    authUpdatePasswordBtn,
    authTabLogin,
    authTabSignup,
  ].forEach((btn) => {
    if (btn) btn.disabled = busy;
  });
}

function setAuthStatus(message) {
  if (authStatusEl) authStatusEl.textContent = message || "";
}

const AUTH_STATUS_KEEP = new Set([
  "Check your email to confirm your account, then log in.",
  "If an account exists for that email, a recovery link is on the way. Check your inbox.",
]);

const AUTH_STATUS_LOADING = new Set([
  "Creating your account…",
  "Signing in…",
  "Sending recovery email…",
  "Saving your new password…",
]);

function clearStaleAuthStatus() {
  const message = (authStatusEl?.textContent || "").trim();
  if (!message) return;
  if (AUTH_STATUS_KEEP.has(message) || AUTH_STATUS_LOADING.has(message)) return;
  setAuthStatus("");
}

function friendlyAuthError(error) {
  const raw = (error?.message || String(error || "Something went wrong")).trim();
  const lower = raw.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("user already registered") || lower.includes("already been registered")) {
    return "That email is already registered. Try logging in.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email first — check your inbox for the link.";
  }
  if (lower.includes("password") && lower.includes("at least")) {
    return "Password must be at least 6 characters.";
  }
  if (
    lower.includes("same password") ||
    lower.includes("should be different") ||
    lower.includes("different from the old password")
  ) {
    return "Choose a password that is different from your current one.";
  }
  if (
    lower.includes("expired") ||
    lower.includes("invalid token") ||
    lower.includes("token has expired") ||
    lower.includes("otp_expired") ||
    lower.includes("flow_state")
  ) {
    return "This recovery link is invalid or has expired. Request a new one.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Couldn't reach Supabase. Check your connection and try again.";
  }
  return raw;
}

function clearPasswordFields() {
  if (authPassword) authPassword.value = "";
  if (authNewPassword) authNewPassword.value = "";
  if (authConfirmPassword) authConfirmPassword.value = "";
}

function setAuthMode(mode, { preserveStatus = false } = {}) {
  authMode = mode;
  if (authSignin) authSignin.hidden = mode !== "signin";
  if (authResetRequest) authResetRequest.hidden = mode !== "request-reset";
  if (authResetUpdate) authResetUpdate.hidden = mode !== "set-password";

  const tabs = document.getElementById("auth-tabs");
  if (tabs) tabs.hidden = mode !== "signin";

  if (!preserveStatus) setAuthStatus("");

  if (mode === "request-reset" && authResetEmail && authEmail) {
    if (!authResetEmail.value.trim() && authEmail.value.trim()) {
      authResetEmail.value = authEmail.value.trim();
    }
  }

  if (mode !== "set-password") {
    if (authNewPassword) authNewPassword.value = "";
    if (authConfirmPassword) authConfirmPassword.value = "";
  }
}

function showPasswordRecovery() {
  passwordRecoveryPending = true;
  showFlow("auth");
  authUserEl.textContent = "";
  hideDreamsFromView();
  setAuthMode("set-password");
  setAuthStatus("Choose a new password to finish recovering your account.");
  authNewPassword?.focus();
}

function hideDreamsFromView() {
  dreamsLoadSeq += 1;
  cloudDreams = [];
  currentUserId = null;
  cloudDreamsReady = false;
  cloudDreamsLoading = null;
  insightInFlight.clear();
  freshInsightDreamIds.clear();
  activeDreamId = null;
  journalLoadFailed = false;
  dreamList.innerHTML = "";
  dreamCount.textContent = "0 saved";
  setJournalEmptyVisible(true);
  setJournalEmptyCopy();
}

function showLoggedOut(message = "") {
  passwordRecoveryPending = false;
  showFlow("auth");
  authUserEl.textContent = "";
  hideDreamsFromView();
  const status = message || pendingSignedOutMessage || "";
  pendingSignedOutMessage = null;
  setAuthMode("signin", { preserveStatus: Boolean(status) });
  setAuthTab("login");
  if (status) setAuthStatus(status);
}

async function showLoggedIn(user) {
  passwordRecoveryPending = false;
  setAuthMode("signin");
  showFlow("app");
  setAppScreen("home");
  authUserEl.textContent = user?.email || "Signed in";
  setAuthStatus("");
  updateWordCount();
  updatePixelCaret();

  if (currentUserId === user.id && cloudDreamsReady) {
    renderDreams();
    updateHomeMessage();
    return;
  }

  if (currentUserId === user.id && cloudDreamsLoading) {
    await cloudDreamsLoading;
    return;
  }

  currentUserId = user.id;
  cloudDreamsReady = false;
  cloudDreamsLoading = loadCloudDreamsForUser(user.id).finally(() => {
    cloudDreamsLoading = null;
  });
  await cloudDreamsLoading;
}

function renderAuthSession(session, event = null) {
  if (event === "PASSWORD_RECOVERY" || passwordRecoveryPending) {
    if (session?.user) {
      showPasswordRecovery();
      return;
    }
    if (passwordRecoveryPending && event !== "SIGNED_OUT") {
      showFlow("auth");
      setAuthMode("set-password", { preserveStatus: true });
      return;
    }
    passwordRecoveryPending = false;
  }

  const user = session?.user ?? null;
  if (user) {
    void showLoggedIn(user);
    return;
  }

  // No session: cold boot / INITIAL_SESSION → onboarding (not auth).
  // Do not interrupt an in-progress onboarding when Supabase emits INITIAL_SESSION.
  if (!event || event === "INITIAL_SESSION") {
    if (passwordRecoveryPending) {
      showFlow("auth");
      setAuthMode("set-password", { preserveStatus: true });
      return;
    }
    if (document.body.dataset.flow === "onboarding") return;
    startOnboarding();
    return;
  }

  showLoggedOut();
}

async function handleSignup() {
  if (!supabase) {
    setAuthStatus("Account features aren't available right now.");
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    setAuthStatus("Enter an email and password to sign up.");
    return;
  }
  if (password.length < 6) {
    setAuthStatus("Password must be at least 6 characters.");
    return;
  }

  setAuthBusy(true);
  setAuthStatus("Creating your account…");

  const { data, error } = await supabase.auth.signUp({ email, password });

  setAuthBusy(false);

  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }

  authPassword.value = "";

  if (data.session) {
    setAuthStatus("");
    return;
  }

  setAuthStatus("Check your email to confirm your account, then log in.");
}

async function handleLogin() {
  if (!supabase) {
    setAuthStatus("Account features aren't available right now.");
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value;

  if (!email || !password) {
    setAuthStatus("Enter your email and password to log in.");
    return;
  }

  setAuthBusy(true);
  setAuthStatus("Signing in…");

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  setAuthBusy(false);

  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }

  authPassword.value = "";
  setAuthStatus("");
}

async function handleRequestPasswordReset() {
  if (!supabase) {
    setAuthStatus("Account features aren't available right now.");
    return;
  }

  const email = authResetEmail.value.trim();
  if (!email) {
    setAuthStatus("Enter the email for your account.");
    authResetEmail.focus();
    return;
  }

  setAuthBusy(true);
  setAuthStatus("Sending recovery email…");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getPasswordRecoveryRedirectUrl(),
  });

  setAuthBusy(false);

  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }

  setAuthStatus("If an account exists for that email, a recovery link is on the way. Check your inbox.");
}

async function handleUpdatePassword() {
  if (!supabase) {
    setAuthStatus("Account features aren't available right now.");
    return;
  }

  const password = authNewPassword.value;
  const confirm = authConfirmPassword.value;

  if (!password || !confirm) {
    setAuthStatus("Enter and confirm your new password.");
    return;
  }
  if (password.length < 6) {
    setAuthStatus("Password must be at least 6 characters.");
    return;
  }
  if (password !== confirm) {
    setAuthStatus("Those passwords don’t match.");
    return;
  }

  setAuthBusy(true);
  setAuthStatus("Saving your new password…");

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    setAuthBusy(false);
    setAuthStatus(friendlyAuthError(error));
    return;
  }

  clearPasswordFields();
  passwordRecoveryPending = false;
  pendingSignedOutMessage = "Password updated. Log in with your new password.";

  const { error: signOutError } = await supabase.auth.signOut();

  setAuthBusy(false);

  if (signOutError) {
    pendingSignedOutMessage = null;
    setAuthMode("signin");
    setAuthStatus(
      "Password updated, but we couldn’t sign you out automatically. Log in with your new password."
    );
    return;
  }

  showLoggedOut();
}

async function handleLogout() {
  if (!supabase) return;

  setAuthBusy(true);

  const { error } = await supabase.auth.signOut();

  setAuthBusy(false);

  if (error) {
    setAuthStatus(friendlyAuthError(error));
    return;
  }

  showLoggedOut("Signed out.");
}

async function initAuth() {
  if (!supabase) {
    startOnboarding();
    setAuthStatus("Account features aren't available right now.");
    return;
  }

  if (urlIndicatesPasswordRecovery()) {
    passwordRecoveryPending = true;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    startOnboarding();
    // If they skip to auth, status will show; keep onboarding first for prototype UX
    pendingSignedOutMessage = friendlyAuthError(error);
  } else {
    renderAuthSession(data?.session ?? null);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    renderAuthSession(session, event);
  });
}

/* =========================
   WIRE UP
   ========================= */

saveButton?.addEventListener("click", () => {
  void saveCurrentDream();
});

bodyInput?.addEventListener("input", () => {
  updateWordCount();
  updatePixelCaret();
});

bodyInput?.addEventListener("focus", updatePixelCaret);
bodyInput?.addEventListener("blur", () => pixelCaret?.classList.remove("is-on"));
bodyInput?.addEventListener("click", updatePixelCaret);
bodyInput?.addEventListener("keyup", updatePixelCaret);
bodyInput?.addEventListener("scroll", updatePixelCaret);
bodyInput?.addEventListener("select", updatePixelCaret);

bodyInput?.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    void saveCurrentDream();
  }
});

window.addEventListener("resize", updatePixelCaret);

homeCatchBtn?.addEventListener("click", () => setAppScreen("capture"));

captureOpenJournal?.addEventListener("click", () => {
  activeDreamId = null;
  setAppScreen("journal");
});

captureConfirmHome?.addEventListener("click", () => {
  activeDreamId = null;
  setAppScreen("home");
});

detailInsightBtn?.addEventListener("click", () => {
  if (!activeDreamId) return;
  const dream = cloudDreams.find((d) => d.id === activeDreamId);
  if (!dream) return;

  if (dream.insight) {
    renderInsightContent(detailInsight, dream.insight, {
      fresh: freshInsightDreamIds.has(dream.id),
    });
    detailInsight.hidden = false;
    detailInsightBtn.hidden = true;
    return;
  }

  void generateInsightForDream(activeDreamId);
});

detailDeleteBtn?.addEventListener("click", () => {
  if (activeDreamId) void deleteCloudDream(activeDreamId);
});

bottomNav?.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-nav]");
  if (!btn || !appShell || appShell.hidden) return;
  const screen = btn.dataset.nav;
  if (screen === "home" || screen === "journal" || screen === "sky" || screen === "profile") {
    activeDreamId = null;
    setAppScreen(screen);
  }
});

document.querySelectorAll(".btn-back[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const screen = btn.dataset.nav;
    if (screen === "home" || screen === "journal") {
      activeDreamId = null;
      setAppScreen(screen);
    }
  });
});

captureComposeBack?.addEventListener("click", () => {
  activeDreamId = null;
  setAppScreen("home");
});

onboardingNext?.addEventListener("click", () => {
  if (onboardingIndex < onboardingSlides.length - 1) {
    onboardingIndex += 1;
    renderOnboardingSlide();
  }
});

onboardingBegin?.addEventListener("click", () => goToAuth({ tab: "signup" }));
onboardingSkip?.addEventListener("click", () => goToAuth({ tab: "signup" }));
onboardingLogin?.addEventListener("click", () => goToAuth({ tab: "login" }));

authTabLogin?.addEventListener("click", () => setAuthTab("login"));
authTabSignup?.addEventListener("click", () => setAuthTab("signup"));

[authEmail, authPassword].forEach((input) => {
  input?.addEventListener("input", () => clearStaleAuthStatus());
});

authLoginBtn?.addEventListener("click", handleLogin);
authSignupBtn?.addEventListener("click", handleSignup);
authLogoutBtn?.addEventListener("click", handleLogout);
authForgotBtn?.addEventListener("click", () => {
  setAuthMode("request-reset");
  authResetEmail?.focus();
});
authBackSigninBtn?.addEventListener("click", () => {
  setAuthMode("signin");
  authEmail?.focus();
});
authSendResetBtn?.addEventListener("click", () => {
  void handleRequestPasswordReset();
});
authUpdatePasswordBtn?.addEventListener("click", () => {
  void handleUpdatePassword();
});

authPassword?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    if (authTab === "signup") handleSignup();
    else handleLogin();
  }
});

authResetEmail?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void handleRequestPasswordReset();
  }
});

authConfirmPassword?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void handleUpdatePassword();
  }
});

authNewPassword?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    authConfirmPassword?.focus();
  }
});

// Silence unused-local warning for legacy helper while migration remains pending.
void loadLocalDreams;

updateWordCount();
fallbackCaption();
syncLimaSky();
window.setInterval(syncLimaSky, 10 * 60 * 1000);
buildOnboardingDots();
startStarfield();
scheduleSheepyAction();
initAuth();
