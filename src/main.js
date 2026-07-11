import "./style.css";
import { supabase } from "./supabaseClient.js";

// DreamCatcher
// Dreams → localStorage (this browser, this device)
// Sheepy → tiny mascot · Moon → orb destination
// Night sky → ambient stars + dream-stars you earn by saving
//
// Cost: local only. No paid APIs for these animations.

const STORAGE_KEY = "dreamcatcher.dreams";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

function loadDreams() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDreams(dreams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
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
  const dreams = loadDreams();
  dreamList.innerHTML = "";

  dreamCount.textContent = dreams.length === 1 ? "1 saved" : `${dreams.length} saved`;
  emptyState.hidden = dreams.length > 0;

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
    if (long) bodyEl.classList.add("is-clamped");

    const actions = item.querySelector(".dream-entry__actions");

    if (long) {
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "ghost-btn";
      toggleBtn.textContent = "Read more";
      toggleBtn.addEventListener("click", () => {
        const open = bodyEl.classList.toggle("is-clamped");
        toggleBtn.textContent = open ? "Read more" : "Show less";
      });
      actions.appendChild(toggleBtn);
    }

    const insightsBtn = document.createElement("button");
    insightsBtn.type = "button";
    insightsBtn.className = "ghost-btn is-soon";
    insightsBtn.textContent = "✨ Dream Insights · Coming Soon";
    insightsBtn.addEventListener("click", () => {
      setStatus(
        "Coming soon. Discover recurring themes, emotions and symbols across your dreams."
      );
    });
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
      const ok = window.confirm("Delete this dream? This can’t be undone.");
      if (!ok) return;
      const next = loadDreams().filter((d) => d.id !== dream.id);
      saveDreams(next);
      setStatus("Dream deleted.");
      renderDreams();
    });
    actions.appendChild(deleteBtn);

    dreamList.appendChild(item);
  }
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
  // Quiet stars for dreams already saved (no orb animation on load)
  const count = loadDreams().length;
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

function saveCurrentDream() {
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!body) {
    setStatus("Write the dream first — even a few messy lines.");
    bodyInput.focus();
    return;
  }

  const dreams = loadDreams();
  dreams.unshift({
    id: crypto.randomUUID(),
    title,
    body,
    createdAt: new Date().toISOString(),
  });
  saveDreams(dreams);

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

saveButton.addEventListener("click", saveCurrentDream);

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
    saveCurrentDream();
  }
});

window.addEventListener("resize", updatePixelCaret);

updateWordCount();
renderDreams();
fallbackCaption();
syncLimaSky();
window.setInterval(syncLimaSky, 10 * 60 * 1000);

startStarfield();
scheduleSheepyAction();
