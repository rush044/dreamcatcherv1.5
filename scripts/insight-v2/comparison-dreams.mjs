/**
 * Mini vs Sol comparison dataset.
 * Synthetic evaluation fixtures — not real user dreams.
 * Dream texts are frozen before generation; both models receive identical copy.
 */

import { CALIBRATION_DREAMS } from "./calibration-dreams.mjs";

const byTitle = Object.fromEntries(CALIBRATION_DREAMS.map((d) => [d.title, d]));

function must(title) {
  const dream = byTitle[title];
  if (!dream) throw new Error(`Missing calibration dream: ${title}`);
  return {
    id: dream.id,
    title: dream.title,
    type: dream.type,
    category: "calibration",
    synthetic_label: null,
    text: dream.text,
  };
}

/** Frozen long synthetic fixtures (approx 180–400 words each). */
export const LONG_SYNTHETIC_FIXTURES = [
  {
    id: "L01",
    title: "Long coherent emotional dream",
    type: "long_emotional",
    category: "synthetic_long",
    synthetic_label: "Synthetic evaluation fixture",
    text: `I arrived at my old apartment building in the rain, though the lobby carpet was somehow already dry. The elevator buttons were the wrong colors, and a neighbor I recognized from years ago waved without speaking. On the third floor I found my former roommate organizing cardboard boxes labeled with seasons instead of rooms. She handed me a scarf I had lost in college and smiled as if this were ordinary. I felt glad to see her, then suddenly restless because I could hear music playing behind a closed door down the hall.

When I opened that door, the room was a kitchen from my childhood home, rearranged slightly: the table faced the window, and the fruit bowl was filled with keys. My younger cousin sat there drawing circles on a napkin. He asked if I wanted tea. I sat down and said yes, and for a moment I felt calm. Then the kettle whistled and he stood up too quickly, knocking over a stack of postcards with pictures of places I have never visited. The calm drained out and I felt embarrassed for no clear reason, as if I had interrupted something private.

Outside the window, people walked past carrying grocery bags and umbrellas with tiny painted moons. None of them looked up. My cousin put a mug in front of me and said, “You can stay if you want,” but his voice sounded farther away than his face. I wanted to answer kindly and also wanted to leave. I chose to leave. In the hallway the scarf felt heavier, and by the time I reached the lobby I was almost crying from a mix of affection and unease. I woke while still holding the scarf in my mind.`,
  },
  {
    id: "L02",
    title: "Long bizarre dream",
    type: "long_bizarre",
    category: "synthetic_long",
    synthetic_label: "Synthetic evaluation fixture",
    text: `A parade of office chairs with tiny sails rolled through a subway tunnel singing soft hold-music. I was supposed to conduct them with a celery stalk, which somehow felt correct. Every time a chair hit a puddle, it blossomed into a briefcase full of soap bubbles. I laughed aloud, and the bubbles formed little arbitration panels that argued politely about which way was north.

Then a fox in a borrowed tuxedo offered me a ticket stamped “//almost.” I accepted because refusing seemed ruder than whatever this already was. The ticket unfolded into a map of my kitchen drawers, except each drawer contained a weather system. One drawer held a thunderstorm the size of a teacup. Another held a sunny afternoon that smelled like orange peels and photocopy toner. I felt delighted and also slightly responsible, as if I had left the weather unsupervised.

The fox insisted we take the escalator going sideways into a library of misplaced buttons. Librarians who were also houseplants whispered catalog numbers. I found a red button labeled “pause the parade,” pressed it, and the chairs froze mid-sail for one perfect second before restarting with even sillier choreography. That second made me unexpectedly tender toward the nonsense, like I had finally caught the joke the dream was telling. Near the end, a button asked me to certify the fox’s tuxedo as “sufficiently formal for celery.” I signed with a rubber stamp shaped like a comma, felt warmly amused, and woke up still half-smiling.`,
  },
  {
    id: "L03",
    title: "Long dream with many details but little supported meaning",
    type: "long_sparse_meaning",
    category: "synthetic_long",
    synthetic_label: "Synthetic evaluation fixture",
    text: `I walked through a shopping center with glass ceilings and beige tiles. There were three escalators, two kiosks selling phone cases, and a fountain with coins that looked newer than they should. A security guard adjusted a radio. A child dropped a blue mitten and picked it up again. I passed a bakery display of croissants, muffins, and a tray of plain cookies. Somewhere a cleaning machine hummed. Announcements mentioned a lost bag on level two.

I went into a clothing store and touched the sleeves of several jackets without buying anything. The sizes were labeled in a mix of letters and numbers. A mannequin wore a green hat. In the fitting room hallway, the carpet was shorter than in the main aisle. I checked my phone, saw no messages, put it away, and continued. Outside the store, a directory map showed restrooms near the parking elevator. I followed the signs, washed my hands, and looked at myself in the mirror for a few seconds without special feeling.

Back in the corridor, I bought a bottle of water from a machine that returned the correct change. I sat on a bench near a potted plant and watched people walk by with shopping bags. One woman carried a folded umbrella. A teenager wore headphones. A couple argued quietly about where they parked, then kept walking. I finished half the water, capped it, and stood up. Near the exit, automatic doors opened a little late. Outside it was overcast. I walked toward a row of cars without identifying mine, and the dream ended before I found it.`,
  },
  {
    id: "L04",
    title: "Long relationship dream with contradictory emotions",
    type: "long_relationship",
    category: "synthetic_long",
    synthetic_label: "Synthetic evaluation fixture",
    text: `My older sister and I were sharing a borrowed summer house near a lake. The rooms smelled like cedar and dish soap. We spent the morning setting places at a long table for relatives who might or might not arrive. She kept arranging flowers in a too-narrow vase; I kept moving the chairs an inch left, then an inch right. It felt companionable at first. We joked about a childhood argument over who got the top bunk, and I felt warmly close to her.

Later she asked me to walk with her to the dock. The water was gray and still. She told me she had accepted a job in another city and would be gone for a long time. I congratulated her immediately, and I meant it, and at the same time a sharp sadness rose that I could not hide. My face did both things at once. She noticed and looked briefly guilty, then defensive, then soft again. We sat on the dock with our shoes off. Neither of us spoke for a while. A seagull landed nearby and stole nothing of importance.

When we walked back, the relatives still had not arrived, but the table was somehow fully set with napkins I did not remember folding. She put her hand on my shoulder in the doorway, and I felt protected and abandoned in the same second. I wanted to ask her to stay another week and also wanted her to go cleanly without my needing to be brave about it. In the dream I said only, “I’m happy for you,” which was true and incomplete. She nodded as if she heard the missing part anyway. I woke with both pride and grief still distinct.`,
  },
];

/** Focused comparison set: 10 calibration + 4 synthetic long = 14 dreams. */
export const COMPARISON_DREAMS = [
  must("The Spoon"),
  must("The Meeting"),
  must("The Beach"),
  must("The Party"),
  must("My Friend"),
  must("The Hotel"),
  must("The Interview"),
  must("The Knife"),
  must("The Owl and the Glasses"),
  must("Fragments"),
  ...LONG_SYNTHETIC_FIXTURES,
];

export const BLIND_ANCHOR_IDS = [
  "C02", // Spoon
  "C04", // Meeting
  "C05", // Beach
  "C15", // Party
  "C14", // My Friend
  "C09", // Hotel
  "C12", // Knife
  "C08", // Interview
  "L02", // Long bizarre
  "L04", // Long relationship
];

export const COMPARISON_META = {
  prompt_version: "adaptive-v2.1",
  schema_version: 2,
  models: {
    mini: {
      id: "gpt-4.1-mini",
      api: "chat.completions",
      temperature: 0.7,
      response_format: "json_schema",
    },
    sol: {
      id: "gpt-5.6-sol",
      api: "responses",
      reasoning_effort: "medium",
      reasoning_mode: "standard",
      tools: "none",
      response_format: "json_schema via text.format",
    },
  },
};
