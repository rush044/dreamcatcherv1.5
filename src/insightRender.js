/**
 * Dream Insight rendering — V1 legacy + Adaptive Insight V2.
 * Fixtures for local UI testing live in insightFixtures.js (explicitly labeled).
 */

export function isInsightV2(insight) {
  return Boolean(
    insight &&
      typeof insight === "object" &&
      (insight.version === 2 || insight.version === "2") &&
      typeof insight.notice === "string"
  );
}

export function isInsightV1(insight) {
  return Boolean(
    insight &&
      typeof insight === "object" &&
      typeof insight.summary === "string" &&
      !isInsightV2(insight)
  );
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

function appendAccordion(panel, { title, items, idSuffix }) {
  const threadsId = `insight-threads-${idSuffix}`;
  const wrap = document.createElement("div");
  wrap.className = "dream-insight__accordion";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "dream-insight__accordion-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", threadsId);
  toggle.id = `${threadsId}-btn`;

  const label = document.createElement("span");
  label.className = "dream-insight__accordion-label";
  label.textContent = title;
  toggle.appendChild(label);

  const chevron = document.createElement("span");
  chevron.className = "dream-insight__accordion-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "›";
  toggle.appendChild(chevron);

  const region = document.createElement("div");
  region.id = threadsId;
  region.className = "dream-insight__accordion-panel";
  region.hidden = true;
  region.setAttribute("role", "region");
  region.setAttribute("aria-labelledby", toggle.id);

  const list = document.createElement("ul");
  list.className = "dream-insight__thread-list";
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
  region.appendChild(list);

  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    const next = !open;
    toggle.setAttribute("aria-expanded", String(next));
    region.hidden = !next;
    wrap.classList.toggle("is-open", next);
  });

  wrap.appendChild(toggle);
  wrap.appendChild(region);
  panel.appendChild(wrap);
}

function appendReflection(panel, questions) {
  const section = document.createElement("section");
  section.className = "dream-insight__sit-with";
  section.setAttribute("aria-label", "Something to sit with");

  const heading = document.createElement("h4");
  heading.className = "dream-insight__heading";
  heading.textContent = "Something to sit with";
  section.appendChild(heading);

  if (questions.length === 1) {
    const p = document.createElement("p");
    p.className = "dream-insight__question-single";
    p.textContent = questions[0];
    section.appendChild(p);
  } else {
    const list = document.createElement("ul");
    list.className = "dream-insight__reflect-list";
    for (const question of questions) {
      const li = document.createElement("li");
      li.textContent = question;
      list.appendChild(li);
    }
    section.appendChild(list);
  }

  panel.appendChild(section);
}

function appendNoticeParagraphs(panel, noticeText) {
  const blocks = String(noticeText)
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length <= 1) {
    const notice = document.createElement("p");
    notice.className = "dream-insight__summary dream-insight__notice";
    notice.textContent = noticeText;
    panel.appendChild(notice);
    return;
  }

  for (const block of blocks) {
    const notice = document.createElement("p");
    notice.className = "dream-insight__summary dream-insight__notice";
    notice.textContent = block;
    panel.appendChild(notice);
  }
}

function renderInsightV2(panel, insight, { fresh = false } = {}) {
  const noticedHeading = document.createElement("h4");
  noticedHeading.className = "dream-insight__heading";
  noticedHeading.textContent = "What Sheepy noticed";
  panel.appendChild(noticedHeading);

  appendNoticeParagraphs(panel, insight.notice);

  const threads = (insight.threads || []).map((t) => String(t).trim()).filter(Boolean).slice(0, 3);
  if (threads.length) {
    appendAccordion(panel, {
      title: "Threads Sheepy found",
      items: threads,
      idSuffix: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
  }

  const questions = (insight.reflection_questions || [])
    .map((q) => String(q).trim())
    .filter(Boolean)
    .slice(0, 2);
  if (questions.length) {
    appendReflection(panel, questions);
  }

  if (fresh) {
    const freshLabel = document.createElement("p");
    freshLabel.className = "dream-insight__fresh-label";
    freshLabel.textContent = "Just reflected";
    panel.prepend(freshLabel);
  }
}

function renderInsightV1(panel, insight, { fresh = false, freshLabelText = "Sheepy noticed something" } = {}) {
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
    appendAccordion(panel, {
      title: "Symbols and patterns",
      items: patternsLines,
      idSuffix: `v1-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
  }

  if (insight.reflection_questions?.length) {
    const reflectHeading = document.createElement("h4");
    reflectHeading.className = "dream-insight__heading dream-insight__reflect-heading";
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
    freshLabel.textContent = freshLabelText;
    panel.prepend(freshLabel);
  }
}

/**
 * Render Insight content into a panel. Safe for V1 and V2 shapes.
 */
export function renderInsightContent(panel, insight, { fresh = false } = {}) {
  panel.hidden = false;
  panel.classList.remove("is-error", "is-loading");
  panel.replaceChildren();
  panel.dataset.insightVersion = isInsightV2(insight) ? "2" : isInsightV1(insight) ? "1" : "unknown";

  if (isInsightV2(insight)) {
    renderInsightV2(panel, insight, { fresh });
    return;
  }

  if (isInsightV1(insight)) {
    renderInsightV1(panel, insight, { fresh });
    return;
  }

  const fallback = document.createElement("p");
  fallback.className = "dream-insight__status";
  fallback.textContent = "This reflection couldn’t be shown.";
  panel.appendChild(fallback);
}
