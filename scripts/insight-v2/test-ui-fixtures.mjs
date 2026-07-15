/**
 * Structural UI checks for Insight V1/V2 rendering without a browser dependency.
 * Uses a tiny DOM shim sufficient for insightRender.js.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "eval-outputs", "insight-v2", "ui-fixture-tests.json");

function createDomShim() {
  class Element {
    constructor(tagName) {
      this.tagName = String(tagName).toUpperCase();
      this.children = [];
      this.childNodes = this.children;
      this.attributes = {};
      this.className = "";
      this.id = "";
      this.hidden = false;
      this.parentNode = null;
      this._text = "";
      this.dataset = {};
      this._listeners = {};
    }
    set textContent(v) {
      this._text = String(v ?? "");
      this.children.length = 0;
    }
    get textContent() {
      if (!this.children.length) return this._text;
      return this.children.map((c) => c.textContent).join("");
    }
    setAttribute(name, value) {
      this.attributes[name] = String(value);
      if (name === "id") this.id = String(value);
      if (name === "class" || name === "className") this.className = String(value);
      if (name === "hidden") this.hidden = value !== "false";
    }
    getAttribute(name) {
      if (name === "aria-expanded") return this.attributes[name] ?? null;
      if (name === "aria-controls") return this.attributes[name] ?? null;
      return this.attributes[name] ?? null;
    }
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    replaceChildren(...nodes) {
      this.children.length = 0;
      this._text = "";
      for (const n of nodes) this.appendChild(n);
    }
    prepend(...nodes) {
      for (let i = nodes.length - 1; i >= 0; i -= 1) {
        nodes[i].parentNode = this;
        this.children.unshift(nodes[i]);
      }
    }
    addEventListener(type, fn) {
      (this._listeners[type] ||= []).push(fn);
    }
    classList = {
      self: this,
      add(...names) {
        const set = new Set(String(this.self.className || "").split(/\s+/).filter(Boolean));
        for (const n of names) set.add(n);
        this.self.className = [...set].join(" ");
      },
      remove(...names) {
        const set = new Set(String(this.self.className || "").split(/\s+/).filter(Boolean));
        for (const n of names) set.delete(n);
        this.self.className = [...set].join(" ");
      },
      toggle(name, force) {
        const set = new Set(String(this.self.className || "").split(/\s+/).filter(Boolean));
        const on = force ?? !set.has(name);
        if (on) set.add(name);
        else set.delete(name);
        this.self.className = [...set].join(" ");
        return on;
      },
    };
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    }
    querySelectorAll(selector) {
      const out = [];
      const visit = (node) => {
        if (matches(node, selector)) out.push(node);
        for (const child of node.children || []) visit(child);
      };
      for (const child of this.children) visit(child);
      return out;
    }
    contains(other) {
      if (!other) return false;
      let cur = other;
      while (cur) {
        if (cur === this) return true;
        cur = cur.parentNode;
      }
      return false;
    }
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const sibs = this.parentNode.children;
      const idx = sibs.indexOf(this);
      return idx >= 0 ? sibs[idx + 1] || null : null;
    }
  }

  function matches(node, selector) {
    if (selector.startsWith(".")) {
      const cls = selector.slice(1);
      return String(node.className || "")
        .split(/\s+/)
        .includes(cls);
    }
    if (selector.startsWith("#")) return node.id === selector.slice(1);
    if (selector.includes(".")) {
      const [tag, cls] = selector.split(".");
      return node.tagName === tag.toUpperCase() && String(node.className || "").split(/\s+/).includes(cls);
    }
    if (selector.startsWith("[") && selector.endsWith("]")) {
      const attr = selector.slice(1, -1);
      return Object.prototype.hasOwnProperty.call(node.attributes, attr);
    }
    return node.tagName === selector.toUpperCase();
  }

  const document = {
    createElement(tag) {
      return new Element(tag);
    },
  };

  return { document, Element };
}

function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

async function main() {
  const shim = createDomShim();
  globalThis.document = shim.document;

  // Dynamic import AFTER document shim is in place
  const { renderInsightContent, isInsightV2, isInsightV1 } = await import("../../src/insightRender.js");
  const { insightFixtures } = await import("../../src/insightFixtures.js");

  const report = { ok: true, checks: [], failures: [] };

  for (const [key, insight] of Object.entries(insightFixtures)) {
    const failures = [];
    const panel = document.createElement("div");
    panel.className = "dream-insight";
    panel.hidden = true;
    renderInsightContent(panel, insight, { fresh: false });

    assert(panel.hidden === false, `${key}: panel should be visible`, failures);
    assert(!panel.querySelector(".dream-insight__eyebrow"), `${key}: no redundant eyebrow`, failures);

    if (isInsightV2(insight)) {
      assert(panel.dataset.insightVersion === "2", `${key}: dataset version 2`, failures);
      assert(
        panel.querySelector(".dream-insight__heading")?.textContent === "What Sheepy noticed",
        `${key}: notice heading`,
        failures
      );
      assert(panel.querySelector(".dream-insight__notice")?.textContent, `${key}: notice text`, failures);
      assert(!panel.querySelector(".dream-insight__note"), `${key}: no uncertainty footer`, failures);
      assert(!panel.querySelector(".dream-insight__return"), `${key}: no generated closing`, failures);

      const threads = insight.threads || [];
      const accordion = panel.querySelector(".dream-insight__accordion");
      if (threads.length === 0) {
        assert(!accordion, `${key}: threads section absent when empty`, failures);
      } else {
        assert(Boolean(accordion), `${key}: accordion present`, failures);
        const toggle = accordion.querySelector(".dream-insight__accordion-toggle");
        assert(toggle?.getAttribute("aria-expanded") === "false", `${key}: collapsed by default`, failures);
        assert(toggle?.getAttribute("aria-controls"), `${key}: aria-controls`, failures);
        const region = accordion.querySelector(".dream-insight__accordion-panel");
        assert(region?.hidden === true, `${key}: panel hidden when collapsed`, failures);

        const sit = panel.querySelector(".dream-insight__sit-with");
        if ((insight.reflection_questions || []).length) {
          assert(Boolean(sit), `${key}: sit-with present`, failures);
          assert(!accordion.contains(sit), `${key}: questions not nested in accordion`, failures);
        }
      }

      const qs = (insight.reflection_questions || []).filter(Boolean);
      if (qs.length === 0) {
        assert(!panel.querySelector(".dream-insight__sit-with"), `${key}: no empty sit-with`, failures);
      } else if (qs.length === 1) {
        assert(
          panel.querySelector(".dream-insight__question-single"),
          `${key}: single question not list-heavy`,
          failures
        );
      }
    }

    if (isInsightV1(insight)) {
      assert(panel.dataset.insightVersion === "1", `${key}: dataset version 1`, failures);
      assert(panel.querySelector(".dream-insight__summary")?.textContent, `${key}: v1 summary`, failures);
    }

    report.checks.push({ key, pass: failures.length === 0, failures });
    report.failures.push(...failures);
  }

  const required = [
    "limitedNoticeOnly",
    "limitedWithQuestion",
    "focusedWithThreads",
    "richMultiThread",
    "positiveBeach",
    "mundaneGroceries",
    "sexualFriend",
    "violentKnife",
    "legacyV1",
  ];
  for (const key of required) {
    if (!insightFixtures[key]) report.failures.push(`missing required fixture: ${key}`);
  }

  report.ok = report.failures.length === 0;
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(report, null, 2), "utf8");
  console.log(report.ok ? "UI fixture tests PASSED" : "UI fixture tests FAILED");
  for (const f of report.failures) console.error(" -", f);
  console.log("Wrote", OUT);

  process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
