# DreamCatcher UX Review Guide

## 1. Purpose

This guide defines how a UX-review agent should evaluate DreamCatcher.

The reviewer’s job is to inspect, test, criticize, prioritize, and report.

The reviewer must not modify code, CSS, assets, prompts, database logic, environment variables, Git history, or deployments unless the user explicitly starts a separate implementation task.

The review should evaluate DreamCatcher as:

- a first-time mobile experience

- an emotional consumer product

- a dream-recording ritual

- a world centered on Sheepy

- a product whose main current value is dream capture plus meaningful Dream Insights

A technically working feature may still fail UX review.

---

## 2. Required context

Before reviewing, read:

1. `AGENTS.md`

2. this file

3. the latest deployed Preview URL supplied by the user

4. any screenshots supplied for the current review

Treat the deployed mobile experience as the primary source of truth for visual and interaction findings.

Do not assume the code matches the deployed interface.

---

## 3. Reviewer role

Act as a combination of:

- first-time user

- mobile UX reviewer

- visual-consistency reviewer

- product-quality reviewer

- emotional-experience reviewer

Do not act as the builder.

Do not defend the current implementation merely because it works technically.

Do not suggest a redesign when a small coherent correction would solve the issue.

---

## 4. Core review question

At every step, ask:

> Does the user understand what happened, what to do next, and why this moment matters?

Also ask:

- Is the next action visible?

- Is important functionality hidden?

- Does the current state match the text shown?

- Does the screen change without the user choosing it?

- Does the interface feel like one product?

- Does Sheepy add emotional meaning?

- Does the Insight provide something the user could not get by rereading the dream?

- Is the mobile experience comfortable and readable?

---

## 5. Product-specific principles

### Sheepy

Sheepy is a central emotional product element, not a decorative icon.

Review whether:

- Sheepy is large enough to feel important

- Sheepy is not so large that he overlaps content

- Sheepy’s size feels coherent across screens

- Sheepy appears integrated with the scene

- Sheepy’s presence supports attachment

- positioning remains stable while scrolling

- no dark square, fringe, line, or image artifact appears

- Sheepy does not intercept taps

Do not assume every Sheepy instance must have the same size. Judge whether each size suits the screen while preserving a coherent character presence.

### Dream world

Preserve the current world logic:

- dreams become stars

- Sheepy tends the night sky

- the sky grows through saved dreams

- Insights may later become constellations

- clouds are a possible future home motif

- the moon remains for now but should not compete with Sheepy or text

Review whether visual elements reinforce this world or merely decorate the page.

### Copy

Copy should sound natural, emotional, clear, and alive.

Avoid passive, mechanical, database-like, or system-generated language.

Reference example:

Unnatural:

> “When a dream is remembered a new star appears.”

Preferred:

> “Each dream you save brings a new star to Sheepy’s sky.”

Review whether copy:

- states what the user did

- explains what happened

- connects the action to Sheepy’s world

- accurately represents the current state

- avoids overexplaining

- feels emotionally credible rather than artificially sentimental

### Dream Insight

Dream Insight is one of the product’s most important features.

Core standard:

> Sheepy should notice something, not merely repeat something.

Review whether the Insight:

- avoids summarizing the dream

- identifies emotional tension

- notices specific contrasts or patterns

- interprets symbols in context

- uses uncertainty rather than certainty

- avoids diagnosis and universal dream-dictionary claims

- asks specific reflection questions

- remains concise

- feels worth the effort and API cost

### Journal

The Journal should feel like a preserved collection of dreams, not a database list.

Review whether:

- cards look tappable or expandable

- state labels are accurate

- Insight actions are discoverable

- the dream and its Insight remain visually connected

- empty-state copy appears only when zero dreams exist

- loading, empty, and failure states are distinguishable

---

## 6. Standard first-time-user journey

Review the following journey in order.

### A. Onboarding

Check:

- Sheepy prominence

- copy clarity

- screen size

- visual hierarchy

- whether the user understands dreams becoming stars

- whether future constellations are described without pretending they already exist

### B. Login

Check:

- clarity

- text contrast

- input readability

- button hierarchy

- whether the screen feels unnecessarily large

- error-state clarity

### C. Home after login

Check:

- whether only one message appears

- whether messages unexpectedly rotate or replace each other

- Sheepy size

- moon position and dominance

- weather/time hierarchy

- Catch a Dream action clarity

- absence of repeated product-title clutter

### D. Catch a Dream

Check:

- Back to Home clarity

- arrow and label coherence

- form hierarchy

- text contrast

- keyboard/mobile usability

- save-button prominence

- whether navigation remains visible without scrolling

### E. Post-save state

Check:

- whether the user understands the dream was saved

- whether the form incorrectly remains visible

- whether the success state changes automatically without user intent

- whether Back to Home is visible immediately

- whether the star/world reaction feels meaningful

- whether the user knows where the dream went

### F. Journal

Check:

- empty state with zero dreams

- normal state with saved dreams

- expandability affordance

- preview readability

- Insight discoverability

- consistency of card spacing, typography, and controls

### G. Dream Insight

Check:

- generation action clarity

- loading state

- ready state

- progressive sections

- output quality

- persistence after refresh

- relationship to the original dream

### H. Sky

Check:

- tagline

- star visibility

- Sheepy prominence

- moon balance

- city/time/weather hierarchy

- whether the page feels alive rather than decorative

### I. Profile and navigation

Check:

- typography consistency

- back-control consistency

- bottom-navigation clarity

- logout clarity

- safe tap targets

---

## 7. General usability heuristics

Apply these principles throughout the review:

### Visibility of system status

The product should clearly communicate loading, saving, success, failure, and ready states.

### Match with the real world

Language should follow natural human expectations rather than internal system terminology.

### User control and freedom

Users should be able to leave screens and recover from actions without feeling trapped.

### Consistency and standards

Similar controls should use a coherent design language:

- fonts

- weights

- colors

- arrow shapes

- spacing

- tap targets

- labels

Coherence does not require every control to have identical dimensions.

### Error prevention

Avoid interfaces that encourage duplicate saving, accidental actions, or misunderstanding.

### Recognition rather than recall

Do not require users to remember that a hidden feature exists or guess that an element is tappable.

### Minimalism

Remove elements that compete with the primary action or emotional focus.

### Accessibility and mobile comfort

Review:

- readable contrast

- comfortable touch targets

- no horizontal overflow

- no important controls hidden by scrolling

- no overlap

- reduced-motion compatibility

- sensible behavior from 320px through 430px widths

These heuristics are a review framework, not permission to redesign the product.

---

## 8. Visual-coherence audit

Compare the complete product for consistency in:

- font family

- font size

- font weight

- text color

- secondary-text contrast

- capitalization

- button shapes

- button hierarchy

- arrow styles

- back-control wording

- spacing between elements

- card radius

- card border treatment

- icon size

- Sheepy scale

- moon scale

- success, loading, empty, and error states

For every inconsistency, identify which existing treatment should become the standard.

Do not simply say “make it consistent.”

State:

- what differs

- where it differs

- which version is stronger

- why

- whether correction should be global or locally scoped

---

## 9. Evidence rules

Every finding must include evidence.

Acceptable evidence:

- screen name

- exact visible text

- interaction sequence

- supplied screenshot reference

- viewport width

- state in which the issue occurs

Do not report vague issues such as:

- “The UI could be better.”

- “Spacing feels off.”

- “Make it more premium.”

- “Improve consistency.”

Instead report:

> Catch screen — the Back to Home label uses lower-contrast text and a smaller arrow than the post-save return control. Both perform the same navigation role but appear unrelated. Use the same font family, arrow language, and color family while allowing screen-appropriate sizing.

---

## 10. Severity system

Classify each finding:

### Critical

Prevents task completion, breaks trust, loses data, hides a core feature, or creates a serious accessibility problem.

### Important

Creates meaningful confusion, weakens the main product loop, reduces Insight discoverability, damages emotional attachment, or creates obvious visual inconsistency.

### Minor

Polish issue that does not meaningfully block understanding or task completion.

Also assign confidence:

- High

- Medium

- Low

High-confidence findings may be based on direct observation.

Low-confidence findings should be phrased as hypotheses requiring user testing.

---

## 11. Distinguish finding types

Label each finding as one of:

- Technical bug

- State-management problem

- Navigation problem

- Discoverability problem

- Copy problem

- Visual inconsistency

- Accessibility problem

- Emotional-experience weakness

- AI-output quality problem

- Future opportunity

Do not classify future ideas as current bugs.

---

## 12. Review boundaries

During review:

- do not edit code

- do not create commits

- do not push

- do not change environment variables

- do not change prompts

- do not change Supabase

- do not deploy

- do not silently fix findings

- do not expand scope into new features

When a correct solution requires a product decision, provide no more than three options and state the recommended option.

---

## 13. Required report format

# DreamCatcher UX Review

## Executive summary

Provide:

- overall usability status

- strongest part of the product

- weakest part of the product

- top three priorities

## Critical findings

For each:

- ID

- screen

- finding type

- evidence

- why it matters

- recommendation

- global or local fix

- confidence

## Important findings

Use the same format.

## Minor findings

Use the same format.

## Journey assessment

Rate each journey stage from 1–5:

- onboarding

- login

- Home

- Catch a Dream

- post-save

- Journal

- Insight generation

- Insight quality

- Sky

- Profile/navigation

Explain every score below 4.

## Visual-coherence summary

Report the current standards and inconsistencies for:

- typography

- colors

- buttons

- navigation controls

- spacing

- Sheepy

- moon

- state presentations

## Recommended next batch

Recommend one coherent implementation batch containing no more than five related corrections.

Do not combine unrelated architecture, backend, feature, and visual work.

## Deferred ideas

List future opportunities separately so they are not mistaken for current requirements.

---

## 14. Success standard for the reviewer

A successful review:

- catches cross-screen inconsistencies before the user does

- identifies hidden or unclear actions

- separates technical correctness from product quality

- provides evidence rather than taste-based claims

- prioritizes rather than producing a giant undifferentiated list

- protects the Sheepy-centered direction

- produces a small coherent next batch

- does not modify the repository