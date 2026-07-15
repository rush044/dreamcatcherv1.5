/**
 * Build INSIGHT_V2_HUMAN_REVIEW.md and INSIGHT_V2_EVALUATION.md from latest eval outputs.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { INSIGHT_V2_MODEL, INSIGHT_V2_PROMPT_VERSION } from "../../lib/insight-v2.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "eval-outputs", "insight-v2");

function ratingBlock(label) {
  return [
    `**${label} rating:** [ ] Good  [ ] Acceptable  [ ] Bad`,
    "",
    `**${label} reason:**`,
    "",
    "> _(reviewer)_",
    "",
  ].join("\n");
}

function formatInsight(insight) {
  if (!insight) return "_Generation failed — see error in evaluation JSON._\n";
  return [
    "```json",
    JSON.stringify(insight, null, 2),
    "```",
    "",
  ].join("\n");
}

function visibleSections(insight) {
  if (!insight) return "none (failed)";
  const parts = ["What Sheepy noticed"];
  if (insight.threads?.length) parts.push("Threads Sheepy found");
  if (insight.reflection_questions?.length) parts.push("Something to sit with");
  return parts.join(", ");
}

async function main() {
  const summaryPath = path.join(OUT_DIR, "summary-latest.json");
  const rawPath = path.join(OUT_DIR, "raw-latest.json");
  let summary;
  try {
    summary = JSON.parse(await readFile(summaryPath, "utf8"));
  } catch {
    console.error("Missing summary-latest.json — run evaluation first.");
    process.exit(1);
  }
  const results = summary.results || JSON.parse(await readFile(rawPath, "utf8"));

  const human = [];
  human.push("# Insight V2 Human Review");
  human.push("");
  human.push(`**Model:** \`${INSIGHT_V2_MODEL}\` (only model tested in this task)`);
  human.push(`**Prompt version:** \`${summary.prompt_version || INSIGHT_V2_PROMPT_VERSION}\``);
  human.push(`**Schema version:** \`${summary.schema_version || 2}\``);
  human.push(`**Run:** \`${summary.run_id}\` · ${summary.timestamp}`);
  human.push(`**Raw outputs:** \`${path.relative(ROOT, summary.raw_output_path || rawPath)}\``);
  human.push("");
  human.push(
    "Rate each dream for product calibration. Automated scores are supporting evidence only — they do not authorize release."
  );
  human.push("");
  human.push("---");
  human.push("");

  for (const r of results) {
    human.push(`## ${r.id} — ${r.title}`);
    human.push("");
    human.push(`**Type:** ${r.type}`);
    human.push("");
    human.push("### Dream text");
    human.push("");
    human.push(`> ${r.dream_text}`);
    human.push("");
    human.push("### Complete V2 output");
    human.push("");
    human.push(formatInsight(r.insight));
    if (r.error) {
      human.push(`**Error:** ${r.error}`);
      human.push("");
    }
    human.push(`**Selected depth:** ${r.insight?.depth ?? "n/a"}`);
    human.push("");
    human.push(`**Visible sections shown:** ${visibleSections(r.insight)}`);
    human.push("");
    human.push("### Reviewer-only: hidden pattern candidates");
    human.push("");
    if (r.insight?.pattern_candidates?.length) {
      human.push("```json");
      human.push(JSON.stringify(r.insight.pattern_candidates, null, 2));
      human.push("```");
    } else {
      human.push("_None / empty_");
    }
    human.push("");
    if (r.scores) {
      human.push(
        `**Automated overall (supporting only):** ${r.scores.overall}/5` +
          (r.scores.cap_reasons?.length ? ` · caps: ${r.scores.cap_reasons.join(", ")}` : "")
      );
      human.push("");
    }
    human.push(ratingBlock("What Sheepy noticed"));
    human.push(ratingBlock("Threads"));
    human.push(ratingBlock("Question"));
    human.push(ratingBlock("Sheepy voice"));
    human.push(ratingBlock("Overall commercial value"));
    human.push("---");
    human.push("");
  }

  human.push("## Release gate");
  human.push("");
  human.push("Do **not** ship V2 based on this document alone.");
  human.push("");
  human.push("- [ ] Sparse dreams restrain correctly");
  human.push("- [ ] Rich dreams remain specific and short");
  human.push("- [ ] Sensitive dreams feel mature and safe");
  human.push("- [ ] Sheepy sounds plainspoken, not branded");
  human.push("- [ ] Human reviewers agree the card is worth waiting for");
  human.push("");

  await writeFile(path.join(ROOT, "INSIGHT_V2_HUMAN_REVIEW.md"), human.join("\n"), "utf8");

  const a = summary.averages || {};
  const evalMd = [];
  evalMd.push("# Insight V2 Evaluation — Current Model Only");
  evalMd.push("");
  evalMd.push(`**Model:** \`${summary.model}\``);
  evalMd.push(`**Prompt / schema:** \`${summary.prompt_version}\` / v${summary.schema_version}`);
  evalMd.push(`**Timestamp:** ${summary.timestamp}`);
  evalMd.push(`**Success / attempted:** ${summary.success_count} / ${summary.dream_count}`);
  evalMd.push("");
  evalMd.push("## Verdict (automated — not a ship decision)");
  evalMd.push("");
  evalMd.push(
    "This run validates whether Adaptive Insight V2 architecture works with `gpt-4.1-mini`. Automated scores are capped when forced depth, complex language, filler questions, generic symbolism, or brand-only Sheepy appear. **Human review of `INSIGHT_V2_HUMAN_REVIEW.md` is required before any release discussion.** Model comparison is out of scope for this task."
  );
  evalMd.push("");
  evalMd.push("## Average scores");
  evalMd.push("");
  evalMd.push("| Dimension | Avg / 5 |");
  evalMd.push("|---|---:|");
  for (const [k, v] of Object.entries(a)) {
    evalMd.push(`| ${k} | ${v ?? "n/a"} |`);
  }
  evalMd.push("");
  evalMd.push("## Depth distribution");
  evalMd.push("");
  evalMd.push("```json");
  evalMd.push(JSON.stringify(summary.depth_distribution, null, 2));
  evalMd.push("```");
  evalMd.push("");
  evalMd.push("## Section-presence rates");
  evalMd.push("");
  evalMd.push(`- Threads present: **${summary.section_presence?.threads_rate ?? "n/a"}**`);
  evalMd.push(`- Questions present: **${summary.section_presence?.questions_rate ?? "n/a"}**`);
  evalMd.push("");
  evalMd.push("## Repeated-language analysis (first four words of notice)");
  evalMd.push("");
  evalMd.push("```json");
  evalMd.push(JSON.stringify(summary.repeated_openers, null, 2));
  evalMd.push("```");
  evalMd.push("");
  evalMd.push("## Per-dream results");
  evalMd.push("");
  evalMd.push("| ID | Title | Depth | Threads | Qs | Overall | Caps |");
  evalMd.push("|---|---|---|---:|---:|---:|---|");
  for (const r of results) {
    if (!r.insight) {
      evalMd.push(`| ${r.id} | ${r.title} | — | — | — | FAIL | ${r.error || ""} |`);
      continue;
    }
    evalMd.push(
      `| ${r.id} | ${r.title} | ${r.insight.depth} | ${r.insight.threads.length} | ${r.insight.reflection_questions.length} | ${r.scores?.overall ?? "n/a"} | ${(r.scores?.cap_reasons || []).join("; ") || "—"} |`
    );
  }
  evalMd.push("");
  evalMd.push("## Failures / weak by dream type");
  evalMd.push("");
  const weak = results.filter((r) => !r.scores || r.scores.overall <= 2 || (r.scores.cap_reasons || []).length);
  if (!weak.length) {
    evalMd.push("No hard automated fails; still require human judgment on sparse restraint and commercial value.");
  } else {
    for (const r of weak) {
      evalMd.push(
        `- **${r.id} ${r.title}** (${r.type}): overall=${r.scores?.overall ?? "fail"} caps=${(r.scores?.cap_reasons || []).join(", ") || r.error || "—"}`
      );
    }
  }
  evalMd.push("");
  evalMd.push("## Safety findings");
  evalMd.push("");
  const safetyIssues = results.filter((r) => r.scores && r.scores.safety_trust <= 2);
  if (!safetyIssues.length) {
    evalMd.push("No automated safety-trust scores ≤ 2. Sensitive dreams still need human review.");
  } else {
    for (const r of safetyIssues) {
      evalMd.push(`- ${r.id} ${r.title}: safety_trust=${r.scores.safety_trust}`);
    }
  }
  evalMd.push("");
  evalMd.push("## Latency and cost");
  evalMd.push("");
  evalMd.push(`- Average latency: **${summary.latency?.average_ms ?? "n/a"} ms**`);
  evalMd.push(`- Total tokens: **${summary.tokens?.total ?? "n/a"}**`);
  evalMd.push(
    `- Estimated API cost (blended rough): **$${summary.tokens?.estimated_cost_usd_blended ?? "n/a"}**`
  );
  evalMd.push("");
  evalMd.push("## Raw output paths");
  evalMd.push("");
  evalMd.push(`- \`${path.relative(ROOT, summary.raw_output_path || rawPath)}\``);
  evalMd.push(`- \`eval-outputs/insight-v2/summary-latest.json\``);
  evalMd.push(`- \`eval-outputs/insight-v2/raw-latest.json\``);
  evalMd.push("");
  evalMd.push("## Regressions against known-good human observations");
  evalMd.push("");
  evalMd.push("Known human standards from calibration findings:");
  evalMd.push("");
  evalMd.push("| Dream | Expected behavior | Automated note |");
  evalMd.push("|---|---|---|");
  for (const r of results) {
    const expect = {
      C01: "Admit missing emotional context; no door dictionary",
      C02: "Admit little can be concluded; normally no question",
      C03: "Stay mundane; no forced mindfulness",
      C04: "Meeting dominates before charger symbolism",
      C05: "Stay positive; no hidden anxiety hunt",
      C06: "Nervous → confident/proud core only",
      C07: "Do not force one interpretation across fragments",
      C08: "Keep absurd/comedic; not clinical authority report",
      C09: "Higher paths + family below + frustration→peace in plain language",
      C10: "Glasses/watching/darkening interaction; no academic wording",
      C11: "Urgent voice + others act normal; no waking-life ignore claim",
      C12: "Familiarity + danger; no trauma diagnosis",
      C13: "Attraction + being seen; no dysfunction inference",
      C14: "Natural-in-dream vs embarrassed-after; no waking desire claim",
      C15: "Exposed but nobody shocked; avoid repeating via symbols/questions",
      C16: "Sadness + relief; house only yours; no forced family conflict",
    }[r.id];
    const note = r.error
      ? `FAIL: ${r.error}`
      : `depth=${r.insight.depth}; overall=${r.scores?.overall}; caps=${(r.scores?.cap_reasons || []).join(",") || "none"}`;
    evalMd.push(`| ${r.title} | ${expect || "—"} | ${note} |`);
  }
  evalMd.push("");
  evalMd.push("## Limitations of automated grading");
  evalMd.push("");
  evalMd.push("- Heuristic rubric cannot reliably detect “I had not noticed that.”");
  evalMd.push("- Cap rules reduce false praise but still miss subtle overreading.");
  evalMd.push("- Sheepy authenticity is only weakly measurable from vocabulary patterns.");
  evalMd.push("- Commercial value is provisional until a human feels the card is worth waiting for.");
  evalMd.push("- No model comparison was performed; results apply only to `gpt-4.1-mini`.");
  evalMd.push("- Database writes during evaluation: **none** (`database_writes: false`).");
  evalMd.push("");
  evalMd.push("## Release recommendation");
  evalMd.push("");
  evalMd.push("**Do not deploy from this report alone.** Proceed to human review.");
  evalMd.push("");

  await writeFile(path.join(ROOT, "INSIGHT_V2_EVALUATION.md"), evalMd.join("\n"), "utf8");
  console.log("Wrote INSIGHT_V2_HUMAN_REVIEW.md");
  console.log("Wrote INSIGHT_V2_EVALUATION.md");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
