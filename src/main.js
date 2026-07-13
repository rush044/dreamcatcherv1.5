import "./style.css";
import { supabase } from "./supabaseClient.js";

// DreamCatcher
// Dreams (signed in) → Supabase `dreams` table (RLS)
// Dreams (legacy)    → localStorage kept on device; not auto-imported yet
// Sheepy → tiny mascot · Moon → orb destination
// Night sky → ambient stars + dream-stars you earn by saving

const STORAGE_KEY = "dreamcatcher.dreams";
const EMPTY_JOURNAL_COPY =
  "Nothing here yet. Your first dream becomes the start of the archive.";
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
/** @type {Set<string>} Dream ids whose journal body is expanded (Show less). */
const expandedDreamIds = new Set();

const LIMA = {
  latitude: -12.0464,
  longitude: -77.0428,
  timezone: "America/Lima",
  label: "Lima",
};

const titleInput = document.getElementById("dream-title");
const bodyInput = document.getElementById("dream-body");
const saveButton = document.getElementById("save-dream");
const statusEl = document.getElementById("status");
const emptyState = document.getElementById("empty-state");
const dreamList = document.getElementById("dream-list");
const dreamCount = document.getElementById("dream-count");
const wordCount = document.getElementById("word-count");
const skyCaption = document.getElementById("sky-caption");
const sheepy = document.getElementById("sheepy");
const moon = document.getElementById("moon");
const dreamStage = document.getElementById("dream-stage");
const pixelCaret = document.getElementById("pixel-caret");
const starCanvas = document.getElementById("starfield");
const starCtx = starCanvas.getContext("2d", { alpha: true });

// Legacy local journal (pre-cloud). Preserved on device; not used while signed in.
// Migration of these entries into Supabase is still pending.
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

function createInsightPanel() {
  const panel = document.createElement("div");
  panel.className = "dream-insight";
  panel.hidden = true;
  return panel;
}

function renderInsightContent(panel, insight) {
  panel.hidden = false;
  panel.classList.remove("is-error", "is-loading");
  panel.replaceChildren();

  const title = document.createElement("p");
  title.className = "dream-insight__label";
  title.textContent = "Dream Insight";
  panel.appendChild(title);

  const summary = document.createElement("p");
  summary.className = "dream-insight__summary";
  summary.textContent = insight.summary;
  panel.appendChild(summary);

  const appendListSection = (heading, items) => {
    if (!items?.length) return;
    const section = document.createElement("div");
    section.className = "dream-insight__section";
    const h = document.createElement("h4");
    h.textContent = heading;
    section.appendChild(h);
    const ul = document.createElement("ul");
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    }
    section.appendChild(ul);
    panel.appendChild(section);
  };

  appendListSection("Emotions", insight.emotions);
  appendListSection(
    "People",
    (insight.people || []).map((p) => `${p.name_or_role} — ${p.possible_dynamic}`)
  );
  appendListSection(
    "Places",
    (insight.places || []).map((p) => `${p.place} — ${p.possible_significance}`)
  );
  appendListSection(
    "Symbols",
    (insight.symbols || []).map((s) => `${s.symbol} — ${s.possible_meaning}`)
  );
  appendListSection("Themes", insight.themes);
  appendListSection("Reflection questions", insight.reflection_questions);

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
}

function showInsightLoading(panel) {
  panel.hidden = false;
  panel.classList.add("is-loading");
  panel.classList.remove("is-error");
  panel.replaceChildren();
  const p = document.createElement("p");
  p.className = "dream-insight__status";
  p.textContent = "Listening closely to this dream…";
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
    // Migration may not be applied yet — journal still works without insights.
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
    emptyState.hidden = false;
    emptyState.textContent = "Loading dreams…";
    dreamCount.textContent = "…";
    return;
  }
  emptyState.textContent = EMPTY_JOURNAL_COPY;
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
    setJournalLoading(false);
    renderDreams();
  } catch (error) {
    if (seq !== dreamsLoadSeq) return;
    cloudDreams = [];
    cloudDreamsReady = false;
    setJournalLoading(false);
    renderDreams();
    setStatus(friendlyDreamError(error));
  }
}

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function updateWordCount() {
  const n = countWords(bodyInput.value);
  wordCount.textContent = n === 1 ? "1 word" : `${n} words`;
}

function formatWhen(isoString) {
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function setStatus(message) {
  statusEl.textContent = message;
  if (!message) return;
  window.clearTimeout(setStatus._timer);
  setStatus._timer = window.setTimeout(() => {
    statusEl.textContent = "";
  }, 2800);
}

function renderDreams() {
  const dreams = cloudDreams;
  dreamList.innerHTML = "";

  dreamCount.textContent = dreams.length === 1 ? "1 saved" : `${dreams.length} saved`;
  emptyState.hidden = dreams.length > 0;
  if (dreams.length === 0) {
    emptyState.textContent = EMPTY_JOURNAL_COPY;
  }

  for (const dream of dreams) {
    const item = document.createElement("li");
    item.className = "dream-entry";
    item.dataset.id = dream.id;

    const long = countWords(dream.body) > 60;

    item.innerHTML = `
      <div class="dream-entry__top">
        <div>
          <h3></h3>
          <time></time>
        </div>
      </div>
      <p class="dream-entry__body"></p>
      <div class="dream-entry__actions"></div>
    `;

    item.querySelector("h3").textContent = dream.title || "Untitled dream";
    const timeEl = item.querySelector("time");
    timeEl.textContent = formatWhen(dream.createdAt);
    timeEl.dateTime = dream.createdAt;

    const bodyEl = item.querySelector(".dream-entry__body");
    bodyEl.textContent = dream.body;
    const isExpanded = expandedDreamIds.has(dream.id);
    if (long && !isExpanded) {
      bodyEl.classList.add("is-clamped");
    }

    const actions = item.querySelector(".dream-entry__actions");

    if (long) {
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "ghost-btn";
      toggleBtn.textContent = isExpanded ? "Show less" : "Read more";
      toggleBtn.addEventListener("click", () => {
        const nowClamped = bodyEl.classList.toggle("is-clamped");
        if (nowClamped) {
          expandedDreamIds.delete(dream.id);
          toggleBtn.textContent = "Read more";
        } else {
          expandedDreamIds.add(dream.id);
          toggleBtn.textContent = "Show less";
        }
      });
      actions.appendChild(toggleBtn);
    }

    const insightsBtn = document.createElement("button");
    insightsBtn.type = "button";
    insightsBtn.className = "ghost-btn";
    insightsBtn.dataset.role = "insights";

    const insightPanel = createInsightPanel();

    const runInsight = () => {
      void generateInsightForDream(dream.id);
    };

    if (dream.insight) {
      insightsBtn.textContent = "✨ Dream Insights";
      insightsBtn.disabled = true;
      insightsBtn.title = "Insight saved for this dream";
      renderInsightContent(insightPanel, dream.insight);
    } else {
      insightsBtn.textContent = "✨ Dream Insights";
      insightsBtn.addEventListener("click", runInsight);
    }

    if (insightInFlight.has(dream.id)) {
      insightsBtn.disabled = true;
      insightsBtn.textContent = "✨ Listening…";
      showInsightLoading(insightPanel);
    }

    actions.appendChild(insightsBtn);

    const replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "ghost-btn is-soon";
    replayBtn.textContent = "🎬 Dream Replay · Coming Soon";
    replayBtn.addEventListener("click", () => {
      setStatus(
        "Coming soon. Every dream you save today will be ready when Dream Replay launches."
      );
    });
    actions.appendChild(replayBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "ghost-btn is-danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => {
      void deleteCloudDream(dream.id);
    });
    actions.appendChild(deleteBtn);

    item.appendChild(insightPanel);
    dreamList.appendChild(item);
  }
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
    renderDreams();
    return;
  }

  if (!String(dream.body || "").trim()) {
    setStatus("This dream has no text to reflect on.");
    return;
  }

  insightInFlight.add(dreamId);
  renderDreams();

  let failed = false;
  try {
    const payload = await requestDreamInsight(dreamId);
    const target = cloudDreams.find((d) => d.id === dreamId);
    if (target) {
      target.insight = payload.insight;
      target.insightCreatedAt = payload.createdAt || new Date().toISOString();
    }
    setStatus("Insight ready.");
  } catch (error) {
    failed = true;
    const item = dreamList.querySelector(`[data-id="${dreamId}"]`);
    const panel = item?.querySelector(".dream-insight");
    const btn = item?.querySelector('[data-role="insights"]');
    const message = friendlyInsightError(error);
    if (panel) {
      showInsightError(panel, message, () => {
        void generateInsightForDream(dreamId);
      });
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = "✨ Dream Insights";
    }
    setStatus(message);
  } finally {
    insightInFlight.delete(dreamId);
    if (!failed) {
      renderDreams();
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

  deleteBtnBusy(dreamId, true);

  const { error } = await supabase.from("dreams").delete().eq("id", dreamId).eq("user_id", currentUserId);

  deleteBtnBusy(dreamId, false);

  if (error) {
    setStatus(friendlyDreamError(error));
    return;
  }

  cloudDreams = cloudDreams.filter((d) => d.id !== dreamId);
  insightInFlight.delete(dreamId);
  expandedDreamIds.delete(dreamId);
  setStatus("Dream deleted.");
  renderDreams();
}

function deleteBtnBusy(dreamId, busy) {
  const item = dreamList.querySelector(`[data-id="${dreamId}"]`);
  const btn = item?.querySelector(".ghost-btn.is-danger");
  if (btn) btn.disabled = busy;
}

/* =========================
   PIXEL MOONLIGHT CARET
   Macro: browsers won’t style the real caret much, so we hide it
   and draw our own glowing pixel bar that follows the typing spot.
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

  // Convert mirror marker position into dream-stage coordinates,
  // accounting for textarea scroll.
  const x = inputRect.left - stageRect.left + (markerRect.left - mirrorRect.left);
  const y =
    inputRect.top -
    stageRect.top +
    (markerRect.top - mirrorRect.top) -
    bodyInput.scrollTop;

  const lineHeight = Number.parseFloat(window.getComputedStyle(bodyInput).lineHeight) || 22;

  pixelCaret.style.height = `${lineHeight * 0.9}px`;
  pixelCaret.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
  pixelCaret.classList.add("is-on");
}

/* =========================
   SAVE RITUAL: orb → moon → dream star
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
  // Quiet stars for dreams already in the cloud journal (no orb animation on load)
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
  const start = getTextareaLaunchPoint();
  const end = getMoonCenter();

  if (prefersReducedMotion) {
    addDreamStar(end.x + (Math.random() * 24 - 12), end.y + (Math.random() * 24 - 12));
    return Promise.resolve();
  }

  const orb = document.createElement("div");
  orb.className = "dream-orb";
  orb.style.left = `${start.x}px`;
  orb.style.top = `${start.y}px`;
  document.body.appendChild(orb);

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  // Soft arc: rise a little, then settle into the moon
  const duration = 2400;

  const animation = orb.animate(
    [
      {
        transform: "translate3d(0, 0, 0) scale(0.55)",
        opacity: 0,
        offset: 0,
      },
      {
        transform: "translate3d(0, -12px, 0) scale(1)",
        opacity: 0.95,
        offset: 0.12,
      },
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
    // Become a permanent star near the moon, with a tiny scatter
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
    // Keep typed text so nothing is lost on failure.
    setStatus(friendlyDreamError(error));
    return;
  }

  cloudDreams.unshift(mapRowToDream(data));
  // New cloud dreams are NOT written to localStorage (Supabase is source of truth).
  // Old localStorage dreams remain on this device until a future migration.

  titleInput.value = "";
  bodyInput.value = "";
  updateWordCount();
  updatePixelCaret();
  setStatus("Caught. A new star joins your sky.");
  renderDreams();

  playSaveRitual().then(() => {
    bodyInput.focus();
  });
}

/* =========================
   LIMA CAPTION
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
  skyCaption.textContent = `${LIMA.label} · ${formatClock(now, LIMA.timezone)} · night sky · ${cloudLabel(clouds)}${note || ""}`;
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

/* =========================
   LIVING NIGHT SKY + DREAM STARS
   ========================= */

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

  // Soft birth glow when a dream just became a star
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

  // Tiny cross sparkle — more “caught dream” than ambient dust
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
  // Keep dream stars; just redraw
  if (!starfieldRunning) drawStarfield(performance.now());
});

/* =========================
   SHEEPY IDLE
   ========================= */

function clearSheepyActions() {
  sheepy.classList.remove("is-blink", "is-yawn", "is-sleep");
}

function emitSheepyStar() {
  const star = document.createElement("span");
  star.className = "sheepy-star";
  sheepy.querySelector(".sheepy__bob").appendChild(star);
  window.setTimeout(() => star.remove(), 1700);
}

function runSheepyAction() {
  if (prefersReducedMotion) return;

  clearSheepyActions();
  const roll = Math.random();

  if (roll < 0.35) {
    sheepy.classList.add("is-blink");
    window.setTimeout(clearSheepyActions, 220);
  } else if (roll < 0.55) {
    sheepy.classList.add("is-yawn");
    window.setTimeout(clearSheepyActions, 750);
  } else if (roll < 0.75) {
    sheepy.classList.add("is-sleep");
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
   WIRE UP
   ========================= */

saveButton.addEventListener("click", () => {
  void saveCurrentDream();
});

bodyInput.addEventListener("input", () => {
  updateWordCount();
  updatePixelCaret();
});

bodyInput.addEventListener("focus", updatePixelCaret);
bodyInput.addEventListener("blur", () => pixelCaret.classList.remove("is-on"));
bodyInput.addEventListener("click", updatePixelCaret);
bodyInput.addEventListener("keyup", updatePixelCaret);
bodyInput.addEventListener("scroll", updatePixelCaret);
bodyInput.addEventListener("select", updatePixelCaret);

bodyInput.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    void saveCurrentDream();
  }
});

window.addEventListener("resize", updatePixelCaret);

/* =========================
   AUTH GATE (Supabase email)
   Logged out → welcome screen
   Logged in  → original DreamCatcher app + cloud journal
   Recovery   → set new password, then sign in normally
   Legacy localStorage dreams stay on device (migration pending).
   ========================= */

const authScreen = document.getElementById("auth-screen");
const appShell = document.getElementById("app-shell");
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

/** @type {"signin" | "request-reset" | "set-password"} */
let authMode = "signin";
let passwordRecoveryPending = false;
/** @type {string | null} */
let pendingSignedOutMessage = null;

/**
 * Recovery email return URL.
 * Uses Vite BASE_URL so a future subpath deploy (e.g. /dreamcatcher/) is preserved.
 * Root deploy / local Vite → origin + "/".
 */
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
  ].forEach((btn) => {
    if (btn) btn.disabled = busy;
  });
}

function setAuthStatus(message) {
  if (authStatusEl) authStatusEl.textContent = message || "";
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
  appShell.hidden = true;
  authScreen.hidden = false;
  authUserEl.textContent = "";
  hideDreamsFromView();
  setAuthMode("set-password");
  setAuthStatus("Choose a new password to finish recovering your account.");
  authNewPassword?.focus();
}

function hideDreamsFromView() {
  // Clears in-memory / on-screen journal only. Does not delete Supabase rows
  // or legacy localStorage entries.
  dreamsLoadSeq += 1;
  cloudDreams = [];
  currentUserId = null;
  cloudDreamsReady = false;
  cloudDreamsLoading = null;
  insightInFlight.clear();
  expandedDreamIds.clear();
  dreamList.innerHTML = "";
  dreamCount.textContent = "0 saved";
  emptyState.hidden = false;
  emptyState.textContent = EMPTY_JOURNAL_COPY;
}

function showLoggedOut(message = "") {
  passwordRecoveryPending = false;
  appShell.hidden = true;
  authScreen.hidden = false;
  authUserEl.textContent = "";
  hideDreamsFromView();
  const status = message || pendingSignedOutMessage || "";
  pendingSignedOutMessage = null;
  setAuthMode("signin", { preserveStatus: Boolean(status) });
  if (status) setAuthStatus(status);
}

async function showLoggedIn(user) {
  passwordRecoveryPending = false;
  setAuthMode("signin");
  authScreen.hidden = true;
  appShell.hidden = false;
  authUserEl.textContent = user?.email || "Signed in";
  setAuthStatus("");
  updateWordCount();
  updatePixelCaret();

  if (currentUserId === user.id && cloudDreamsReady) {
    renderDreams();
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
    // Recovery link may set the URL before the session is ready.
    if (passwordRecoveryPending && event !== "SIGNED_OUT") {
      appShell.hidden = true;
      authScreen.hidden = false;
      setAuthMode("set-password", { preserveStatus: true });
      return;
    }
    passwordRecoveryPending = false;
  }

  const user = session?.user ?? null;
  if (user) {
    void showLoggedIn(user);
  } else {
    showLoggedOut();
  }
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

  // Legacy localStorage dreams are intentionally NOT deleted.
  // Cloud rows are intentionally NOT deleted.
  showLoggedOut("Signed out.");
}

async function initAuth() {
  if (!supabase) {
    showLoggedOut("Account features aren't available right now.");
    return;
  }

  if (urlIndicatesPasswordRecovery()) {
    passwordRecoveryPending = true;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    showLoggedOut(friendlyAuthError(error));
  } else {
    renderAuthSession(data?.session ?? null);
  }

  supabase.auth.onAuthStateChange((event, session) => {
    renderAuthSession(session, event);
  });
}

authLoginBtn.addEventListener("click", handleLogin);
authSignupBtn.addEventListener("click", handleSignup);
authLogoutBtn.addEventListener("click", handleLogout);
authForgotBtn.addEventListener("click", () => {
  setAuthMode("request-reset");
  authResetEmail?.focus();
});
authBackSigninBtn.addEventListener("click", () => {
  setAuthMode("signin");
  authEmail?.focus();
});
authSendResetBtn.addEventListener("click", () => {
  void handleRequestPasswordReset();
});
authUpdatePasswordBtn.addEventListener("click", () => {
  void handleUpdatePassword();
});

authPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleLogin();
  }
});

authResetEmail.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void handleRequestPasswordReset();
  }
});

authConfirmPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    void handleUpdatePassword();
  }
});

authNewPassword.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    authConfirmPassword?.focus();
  }
});

updateWordCount();
fallbackCaption();
syncLimaSky();
window.setInterval(syncLimaSky, 10 * 60 * 1000);

startStarfield();
scheduleSheepyAction();
initAuth();
