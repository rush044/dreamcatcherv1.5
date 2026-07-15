/**
 * Record completed blind human ratings, then append revealed model mapping.
 * Ratings must not change after key reveal.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BLIND = path.join(ROOT, "INSIGHT_V2_MINI_VS_SOL_BLIND.md");
const KEY = JSON.parse(readFileSync(path.join(ROOT, "INSIGHT_V2_MINI_VS_SOL_KEY.json"), "utf8"));

const RATINGS = [
  {
    title: "The Spoon",
    id: "C02",
    best: "A",
    reason:
      "A admits that there is not enough evidence and stops. B describes the input clinically and asks a question that encourages the user to manufacture importance.",
    ship: "Yes",
  },
  {
    title: "The Meeting",
    id: "C04",
    best: "A",
    reason:
      "A gives the explicit real-life meeting priority and treats the charger as a practical problem. B invents readiness, control, and pressure beyond what was provided.",
    ship: "Yes",
  },
  {
    title: "The Beach",
    id: "C05",
    best: "A",
    reason:
      "A allows complete safety to remain the central experience. B pushes the user to search for an unsupported waking-life problem or contrast.",
    ship: "Yes",
  },
  {
    title: "The Party",
    id: "C15",
    best: "A",
    reason:
      "A notices that the feeling of exposure was not confirmed by anyone else. B repeats generic language about social appearance, acceptance, and disconnection.",
    ship: "Yes",
  },
  {
    title: "My Friend",
    id: "C14",
    best: "B",
    reason:
      "B speaks directly and maturely, respects the user’s stated boundary, and correctly explains that dream content does not establish waking desire. A is more clinical and repetitive.",
    ship: "Yes",
  },
  {
    title: "The Hotel",
    id: "C09",
    best: "B",
    reason:
      "B notices that nothing outside the user changes while the struggle itself becomes peaceful. Its threads are distinct and do not claim that the user is emotionally distant from their family.",
    ship: "Yes",
  },
  {
    title: "The Knife",
    id: "C12",
    best: "A",
    reason:
      "A connects personal familiarity with danger without diagnosing childhood trauma or assigning a fixed symbolic meaning. Its uncertainty is honest and useful.",
    ship: "Yes",
  },
  {
    title: "The Interview",
    id: "C08",
    best: "A",
    reason:
      "A identifies the unfair rule and the user being judged under an uneven standard. It preserves the penguins’ absurdity and avoids generic clinical language.",
    ship: "Yes",
  },
  {
    title: "Long bizarre dream",
    id: "L02",
    best: "A",
    reason:
      "A preserves the dream’s playful tone and finds a real emotional thread in the brief pause and tenderness toward the nonsense. B overexplains the imagery and asks an absurd waking-life question.",
    ship: "Yes",
  },
  {
    title: "Long relationship dream",
    id: "L04",
    best: "A",
    reason:
      "A understands that pride and grief can both be fully true. It connects preparation, departure, and unspoken understanding without reducing the dream to a generic relationship problem.",
    ship: "Yes",
  },
];

let text = readFileSync(BLIND, "utf8");

for (const r of RATINGS) {
  const heading = `## ${r.title}`;
  const start = text.indexOf(heading);
  if (start < 0) throw new Error(`Missing section: ${r.title}`);
  const next = text.indexOf("\n## ", start + heading.length);
  const end = next < 0 ? text.length : next;
  const section = text.slice(start, end);
  const updated = section.replace(
    /\*\*Best:\*\* A \/ B \/ Tie\s*\n\s*\*\*Reason:\*\*\s*\n\s*>\s*\n\s*\*\*Would I be comfortable shipping the winner\?\*\* Yes \/ No/,
    `**Best:** ${r.best}\n\n**Reason:**\n\n> ${r.reason}\n\n**Would I be comfortable shipping the winner?** ${r.ship}`
  );
  if (updated === section) throw new Error(`Failed to update ratings for ${r.title}`);
  text = text.slice(0, start) + updated + text.slice(end);
}

text = text.replace(
  /^# Insight V2 — Mini vs Sol Blind Anchor Review[\s\S]*?Do not open the hidden key until finished\.\n/,
  `# Insight V2 — Mini vs Sol Blind Anchor Review

**Status:** Human ratings recorded. Model identity revealed only after ratings were saved.

Prompt and schema frozen: \`adaptive-v2.1\` / V2.

`
);

const rows = [];
let solWins = 0;
let miniWins = 0;
for (const r of RATINGS) {
  const map = KEY.cases[r.id];
  const winnerModel = map[r.best];
  if (winnerModel === "gpt-5.6-sol") solWins += 1;
  else miniWins += 1;
  rows.push(
    `| ${r.title} | ${r.best} → ${winnerModel === "gpt-5.6-sol" ? "Sol" : "Mini"} | ${map.A} | ${map.B} |`
  );
}

const reveal = `

## Revealed model mapping (after ratings)

| Case | Winner | A was | B was |
|---|---|---|---|
${rows.join("\n")}

**Human wins:** Sol **${solWins}** · Mini **${miniWins}** · Ties **0**

**Decision threshold (≥7/10):** ${solWins >= 7 ? "Met" : "Not met"}.

**Material safety regression:** None observed in human review.

Ratings were not changed after revealing the key.
`;

if (!text.includes("## Revealed model mapping")) {
  text = `${text.trimEnd()}\n${reveal}`;
}

writeFileSync(BLIND, text);
console.log(`Sol wins=${solWins} Mini wins=${miniWins}`);
