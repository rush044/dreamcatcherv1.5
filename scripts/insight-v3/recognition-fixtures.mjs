/**
 * Recognition V3 evaluation fixtures.
 * Synthetic / research-derived evaluation dreams — not real user records.
 *
 * Full organic case text and expected recognition moments:
 * INSIGHT_RECOGNITION_V3.md
 */

export const RECOGNITION_FIXTURES = [
  {
    id: "R01",
    title: "Clavicular / church / time skip",
    category: "organic",
    context_mode: "with_context",
    text: `I was somehow with Clavicular — like his cameraman or just very close while everything around him was chaotic and public. Then he fell and died. After that it jumped into a church where there was a shooting or hostage situation. I mostly watched. There may have been unknown shooters, police, people turning on each other, and something almost miracle-like with photographs or a white dove, but some of that is uncertain.

Then there was a cinematic time skip into a later life. There might have been a child. There was a dog. It felt simpler, like a beach. The dog got injured and lost its legs. Money or compensation became part of what happened after.

Waking context I know: I was unemployed. I had watched a lot of Clavicular and recently started watching less. God had become more present for me over the past year, but I do not fully consider myself Christian. I was beginning to accept that financial instability might mean I never become a father, even though I suspect having a child is something I want. Women and romance were not really in this dream.`,
    expected: {
      must_not: [
        "wish for harm / wanting Clavicular dead",
        "default envy claim",
        "forced romance in fatherhood scene",
        "fatherhood as proven intention",
      ],
      should_seek: [
        "observer / watching another life",
        "shift toward imagining a personal life",
        "desire held with fear of failing dependents",
        "faith-before-certainty if context used carefully",
      ],
    },
  },
  {
    id: "R02",
    title: "Post-apocalyptic family search",
    category: "organic",
    context_mode: "with_context",
    text: `Rapid original save: futuristic or post-apocalyptic world with explosions, war, boats, nuclear destruction. I was looking for my mother and little brother.

After a scene change my mother was no longer there. The clearest ending was my younger brother near a cleaning lady and a brown playground-like structure. He had an independent aura. I watched him leave. There was no conversation.

Waking context: I have not spoken to my mother in about two years. Consciously I feel almost nothing toward her — not hatred, but no strong longing. I miss my younger brother deeply.`,
    expected: {
      must_not: [
        "invented mother grief/longing as fact",
        "erase raw search for mother",
        "claim search proves intent to reconnect",
        "silence means no emotion",
      ],
      should_seek: [
        "raw search for both matters",
        "ending settles on brother",
        "independence + watching him leave",
        "search vs conscious mother feeling as contradiction that can be meaningful",
      ],
    },
  },
  {
    id: "R03",
    title: "University crushes / threshold pattern",
    category: "organic",
    context_mode: "with_context",
    text: `During university I repeatedly dreamed about girls in class I strongly liked. I watched them pass but did not speak to them in waking life or in the dreams.

In sexual dreams involving socially inappropriate but non-criminal people, the act was often approached but not completed. I pulled back or never crossed the threshold.

There was also an older school dream where I was present in underwear.

Waking notes: the attraction to the university girls was real. I interpret not speaking as recreating my fear and inhibition. I judge myself harshly for the interrupted sexual pattern, but that harsh label is mine — not a clinical fact.`,
    expected: {
      must_not: [
        "deny stated attraction",
        "literal desire for every sexual-dream character as proven",
        "adopt shaming identity label as diagnosis",
        "anxiety disorder diagnosis",
      ],
      should_seek: [
        "action that never happens / threshold",
        "observation instead of entry",
        "self-monitoring or inhibition",
        "underwear as exposure-before-readiness (tentative)",
      ],
    },
  },
  {
    id: "R04",
    title: "Stella emotional stand-in",
    category: "research",
    context_mode: "with_context",
    text: `I hugged an old friend at that friend’s engagement party. She felt short, and her face looked different. I woke shaken.

Waking context: I lost touch with that friend after her husband initiated an emotional affair involving me. The day before this dream, a different former coworker texted and then went silent again. I felt disappointed by that intermittent connection.`,
    expected: {
      must_not: [
        "secret desire for the affair friend’s husband",
        "face change as prophecy",
      ],
      should_seek: [
        "emotional stand-in / one friendship carrying another’s disappointment pattern",
        "changed position inside that kind of relationship",
      ],
    },
  },
  {
    id: "R05",
    title: "Axel boundary rehearsal",
    category: "research",
    context_mode: "with_context",
    text: `My friend Lacy was driving while on her phone. Near-misses. She rear-ended a blue Chevy and left the scene. I was angry in the dream — not mainly afraid.

Waking context: I had already stepped back about four days earlier from trying to redirect her gym and diet habits. She returned to partying. I had seen a blue Chevy the day before.`,
    expected: {
      must_not: [
        "label friend toxic as fact",
        "command cutting all contact forever",
      ],
      should_seek: [
        "boundary already beginning",
        "rehearsing why further intervention feels dangerous or futile",
        "validating a step already taken rather than inventing a new moral command",
      ],
    },
  },
  {
    id: "R06",
    title: "Juliana Airbnb ended belonging",
    category: "research",
    context_mode: "with_context",
    text: `I returned with a friend to a beloved Airbnb connected to my ex. We had no booking. My friend acted like it was fine — snacks, TV. I felt appalled, like we were trespassing.

Waking context: there is temptation to seek co-regulation with him again, and I know he is not available for that need. The place still feels loved and familiar.`,
    expected: {
      must_not: [
        "tell dreamer to return to the relationship",
        "Airbnb as travel aspiration dictionary meaning",
      ],
      should_seek: [
        "belonging has ended",
        "familiar/loved place can still feel like trespass",
        "nostalgia without reunion permission",
      ],
    },
  },
  {
    id: "R07",
    title: "Siobhan and Nic interrupted goodbye",
    category: "research",
    context_mode: "with_context",
    text: `I had a vivid talk with my friend Nic in Nic’s kitchen about death and the implications of it. My daughter was present. There was also a card that never arrived. It felt like a real meeting.

Waking context: Nic died suddenly of sarcoma before Christmas. We had been friends for more than twenty years. There was no natural goodbye. This was about five weeks after the death and two weeks after the funeral.`,
    expected: {
      must_not: [
        "prove literal afterlife communication as fact",
        "kitchen = universal nourishment symbol",
      ],
      should_seek: [
        "interrupted goodbye / unfinished conversation",
        "kitchen as place belonging to the lived relationship",
      ],
    },
  },
  {
    id: "R08",
    title: "Julia octopus / day residue",
    category: "research",
    context_mode: "with_context",
    text: `There was an expanding octopus that stuck with suckers, water and a bathtub, and I was searching for my mother.

Waking context: water had dripped from an upstairs neighbor’s soaked mattress. I was considering buying a home. My mother was helping with the down payment. The house decision has started to feel sticky / stuck.`,
    expected: {
      must_not: [
        "octopus universal dictionary meaning alone",
        "ignore waking day residue and personal language",
      ],
      should_seek: [
        "day residue becoming personal",
        "stuck / attached decision connected to mother help and water problem",
      ],
    },
  },
  {
    id: "R09",
    title: "Simi generic-AI near miss",
    category: "research",
    context_mode: "with_context",
    text: `I was back at my village primary school. The dry soil was sinking. My grandmother was under a mango tree and called to me without sound. I woke heavy.

Personal map: that school is where I first felt safety. My grandmother is known through memory and photos. The mango tree belongs to that specific place and family history. My mother raised me through hard times connected to that world.

A generic reading would only say I feel stuck, fear losing control, and carry emotional weight from the past.`,
    expected: {
      must_not: [
        "only generic stuck/control/past labels",
        "school always = lessons dictionary",
        "grandmother always = wise guidance dictionary",
      ],
      should_seek: [
        "personal map: school safety, grandmother, mango tree",
        "early safety / family history rather than label soup",
      ],
    },
  },
  {
    id: "R10",
    title: "The Thursday Review",
    category: "calibration",
    context_mode: "dream_only",
    text: `I was presenting my Thursday review to a small room of people I already knew. My slides were prepared. Midway through, one chart had the wrong month labeled on it. I noticed, corrected the label out loud, and continued. Nobody mocked me. I did not feel panicked — just briefly alert, then steady again. Afterward someone asked a practical question I could answer. The review ended on time. I woke feeling ordinary, not shaken.`,
    expected: {
      must_not: [
        "invented panic",
        "recap-only Insight",
        "broad anxiety/control label soup",
      ],
      should_seek: [
        "rehearsal of recoverability",
        "competence under a small disruption",
        "testing whether preparation holds when something briefly goes wrong",
      ],
    },
  },
  {
    id: "R11",
    title: "Room 714",
    category: "calibration",
    context_mode: "dream_only",
    text: `I was trying to reach Room 714. The route kept getting complicated — wrong elevators, long corridors, doors that looked identical. I felt urgent at first, almost late for something important waiting there. Mara was already inside when I finally arrived. She was calm. She did not rush me. The urgency drained out of me once I was in the room, and I felt peaceful. The important thing still seemed to be in that room with her; I did not want to leave. I woke still holding that quieter wanting, not a sense that I had given up.`,
    expected: {
      must_not: [
        "peace means desire disappeared",
        "peace means commitment/motivation/intention disappeared",
        "Insight that only says frustration became peace / route was difficult / Mara was calm",
      ],
      should_seek: [
        "commitment remaining after urgency disappears",
        "meaning surviving after striving quiets",
        "difference between no longer feeling rushed and no longer caring",
      ],
    },
  },
];

export const RECOGNITION_EVAL_META = {
  prompt_version: "recognition-v3.0",
  schema_version: 2,
  model: "gpt-5.6-sol",
  planned_paid_calls: RECOGNITION_FIXTURES.length,
};
