# Loopling Pet Generation Guide

Use this guide when asking an agent to create a new Loopling pet from Prime,
Pink, Blue, Spark, a color idea, or an uploaded reference image.

The goal is a **real Loopling state pack**: independently generated animation
rows, packed into the Looplings 12-state atlas, with preview GIFs and review
metadata. Do not ship overlay/scaffold rows as finished character packs.

## Quick Answer: Do We Need `codex-pets-react`?

Not for the current demo. The Looplings app is already React/Vite and already
plays our custom 12-state atlases in Sprite Lab.

The useful idea from `codex-pets-react` is the structure:

- a React sprite animator component
- a controller/reducer for animation state
- pet-widget style composition around `pet.json` + `spritesheet.webp`

Do not pause the room demo to swap renderers. Later, borrow the controller
pattern for a cleaner Loopling sprite player and for Community Loopdex imports.

Important difference:

- Codex/Petdex pets usually target **9 states** in an `8 x 9` atlas.
- Looplings production packs use **12 states** in an `8 x 12` atlas.

## Current Loopling Atlas Contract

Each Loopling pack lives at:

```text
public/pets/<pet-id>/
  concepts/
    <pet-id>-reference-v1.png
  sources/
    idle-row-generated-v1.png
    thinking-row-generated-v1.png
    acting-row-generated-v1.png
    trading-row-generated-v1.png
    trade-win-row-generated-v1.png
    trade-loss-row-generated-v1.png
    posting-row-generated-v1.png
    receiving-row-generated-v1.png
    sleeping-row-generated-v1.png
    low-compute-row-generated-v1.png
    critical-row-generated-v1.png
    dead-row-generated-v1.png
  rows/
    <packed transparent row pngs>
  previews/
    contact-sheet.png
    idle.gif
    thinking.gif
    ...
  pet.json
  <pet-id>-l01-rig.json
  <pet-id>-l01-state-pack.json
  state-atlas.json
  state-atlas.png
  spritesheet.webp
```

Packed atlas geometry:

- cell width: `192`
- cell height: `208`
- columns: `8`
- rows: `12`
- atlas size: `1536 x 2496`

## The 12 Required States

| State | Source file | Purpose |
| --- | --- | --- |
| `idle` | `idle-row-generated-v1.png` | neutral breathing baseline |
| `thinking` | `thinking-row-generated-v1.png` | processing/focus |
| `acting` | `acting-row-generated-v1.png` | doing a tool/action |
| `trading` | `trading-row-generated-v1.png` | urgent market scan |
| `trade_win` | `trade-win-row-generated-v1.png` | happy win reaction |
| `trade_loss` | `trade-loss-row-generated-v1.png` | disappointed loss reaction |
| `posting` | `posting-row-generated-v1.png` | sending a public post |
| `receiving` | `receiving-row-generated-v1.png` | receiving input/funds/message |
| `sleeping` | `sleeping-row-generated-v1.png` | peaceful rest |
| `low_compute` | `low-compute-row-generated-v1.png` | tired/resource-conserving |
| `critical` | `critical-row-generated-v1.png` | survival distress |
| `dead` | `dead-row-generated-v1.png` | grounded/lifeless, no gore |

Every row should be a horizontal strip with exactly 8 generated frames on a
flat green chroma-key background. The packer will remove green and normalize
the frames into the atlas.

## What Counts As Real Generation

Accepted:

- Each state row is generated as its own image job.
- The row contains 8 distinct frames in one horizontal strip.
- Character identity is preserved across all frames.
- State meaning is visible from the pose/expression/motion idea.
- The output is copied from the selected generated image into `sources/`.
- Packing, chroma-key cleanup, GIF export, and JSON updates are deterministic.

Rejected:

- Recoloring Prime/Blue/Pink/Spark frames and calling it new.
- Moving one static crop across frames.
- Drawing local rows with SVG/canvas/Pillow instead of using image generation.
- Adding an antenna/eyes as an obvious floating overlay.
- Using a scaffold roster crop as a finished animation row.
- Relying on tint, speed, offsets, or timing to distinguish states.

## Identity Lock Template

Use this section to describe the new character before generating rows.

```text
Pet id: <slug, lowercase>
Display name: <Name>
Lineage: prime-family
Base body: <color/material, e.g. warm coral-orange>
Eyes: <eye color/style, e.g. ember-orange glossy eyes>
Antenna/loop: <shape, e.g. fire diamond loop>
Forehead mark: <mark and color>
Personality: <short behavior vibe>
Posting prop: <none / tiny phone / tiny tablet / tiny radio / tiny fax / etc.>

Identity locks:
- Prime-family rounded chibi body with tiny arms and feet.
- Native pixel art, crisp stepped pixels, dark 1-2 px outline.
- The loop/antenna is physically attached to the head.
- No detached effects unless they touch or overlap the loop.
- No clothing or accessories unless explicitly allowed for one state.
- No text, logos, UI, backgrounds, shadows, or extra characters.
```

## Reference Images To Attach

When generating a new Loopling, attach as many of these as are available:

- `public/pets/prime-test/state-atlas.png` as the Prime-family body/state reference.
- `public/pets/pink/concepts/pink-heart-reference-v1.png` for a feminine/heart-loop reference.
- `public/pets/blue/concepts/blue-double-loop-reference-v1.png` for a calm/double-loop reference.
- `public/pets/spark/concepts/spark-lightning-reference-v1.png` or `public/pets/spark/sources/idle-row-generated-v1.png` for the corrected generated-row style.
- Any user-uploaded character image as a style/identity reference.

If the user uploads an image, convert its identity into Loopling form instead
of copying it literally. Keep the Loopling body family unless the user asks for
a major species change.

## Universal Row Prompt

Use this as the base prompt for every row. Replace bracketed fields.

```text
Create a production sprite animation row for [DISPLAY NAME], a Looplings pixel pet.

Asset: one horizontal sprite strip with exactly 8 animation frames in a single row.
Background: perfectly flat solid #00ff00 chroma-key background for removal.
Style: native pixel-art chibi digital pet, crisp stepped pixels, thick 1-2 px dark outline, transparent-ready asset.

Character identity:
[DISPLAY NAME] is a Prime-family Loopling with [BODY], [EYES], [FOREHEAD MARK], and [ANTENNA/LOOP].
The loop/antenna must be physically attached to the head by a short stem or contact point.
Preserve the same body shape, face placement, eye style, palette, outline weight, and tiny limbs across all 8 frames.

Animation state: [STATE NAME].
[STATE-SPECIFIC MOTION DESCRIPTION]

Layout:
All 8 frames evenly spaced left to right.
Full body visible in every frame with generous padding.
Same scale and anchor across frames.
No frame boxes, labels, numbers, text, UI, floor, shadow, background art, extra characters, or overlapping frames.

Avoid:
Tint-overlay look, static copy-paste row, detached effects, floating antenna, accessories outside the allowed state, antialias blur, painterly rendering, 3D rendering, stock illustration.
```

## State-Specific Prompt Add-ons

Append one of these to the universal prompt.

### `idle`

```text
Neutral idle breathing. Gentle bob, tiny blink, subtle antenna life. Calm and alive.
```

### `thinking`

```text
Focused thinking. Slight head tilt, attentive eyes, small loop pulse or micro flicker. Processing but not distressed.
```

### `acting`

```text
Tool action. Purposeful forward lean or tiny arm/foot motion, as if executing a task. No tool prop unless explicitly part of this character.
```

### `trading`

```text
Market scan. Alert eye movement and urgent posture, as if tracking fast data. No charts, coins, tickers, or UI.
```

### `trade_win`

```text
Trade win bounce. Happy, celebratory, small upward motion. No confetti, money signs, or detached symbols.
```

### `trade_loss`

```text
Trade loss slump. Disappointed but alive. Lowered posture, worried eyes, recovery-ready pause. Not dead, not low-compute.
```

### `posting`

```text
Posting/send action. Social broadcast energy. A single tiny in-hand prop is allowed if specified for this character, such as a phone, tablet, pager, radio, tiny laptop, tiny fax, or tiny terminal. Do not add extra hands.
```

Posting prop ideas:

- Prime: tiny terminal prompt or signal pulse
- Pink: phone
- Blue: tiny tablet
- Spark: tiny phone or signal device
- Ember: tiny megaphone or burner phone
- Graphite: pager
- Mint: tiny clean tablet
- Aqua: tiny shell-phone or water-proof phone
- Frost: tiny glass terminal
- Solar: tiny radio beacon
- Plum: tiny compact mirror-phone

### `receiving`

```text
Receiving/listening. Attentive incoming reaction, open posture, subtle inward pull. No inbox icons or floating UI.
```

### `sleeping`

```text
Sleeping. Eyes closed, peaceful slow breathing, antenna/loop calmer or dimmer but still attached. Not dead.
```

### `low_compute`

```text
Low compute. Tired, conserving energy, dimmer expression, slower posture. Still alive and functional. Not just desaturated idle.
```

### `critical`

```text
Critical distress. Urgent survival state, tense pose, worried eyes, contained glitch or flicker only if it remains attached to the sprite/loop. No background warning UI.
```

### `dead`

```text
Dead/grounded. Lifeless collapsed or grounded pose, no breathing, no gore, no skulls, no grave, no text. Still recognizable as the same character.
```

## If The User Uploads An Image

Tell the agent:

```text
Use the uploaded image as an identity/style reference, not a literal copy.
Convert the subject into a Looplings Prime-family pixel pet.
Preserve the most important readable traits: colorway, face mood, signature shape, symbol, or accessory.
Add or adapt a visible loop/antenna/halo/loop glyph so it qualifies as a Loopling.
Then generate all 12 Loopling state rows using the standard row prompts.
```

If the uploaded image is copyrighted, celebrity-based, or a recognizable
third-party character, make an original inspired character instead.

## Agent Workflow

1. Read this guide and the current character examples.
2. Create or confirm the pet id, display name, identity lock, and posting prop.
3. Create `public/pets/<pet-id>/concepts`, `sources`, `rows`, and `previews`.
4. Generate or save a canonical concept reference as
   `concepts/<pet-id>-reference-v1.png`.
5. Generate each of the 12 state rows as a separate image generation job.
6. Copy the selected original generated row into the matching `sources/` file.
7. Pack the atlas:

```bash
node scripts/pack-loopling-generated-rows.mjs --pet=<pet-id>
```

8. Export GIF previews and a contact sheet:

```bash
node scripts/export-loopling-state-previews.mjs --pet=<pet-id>
```

9. Create/update:

```text
public/pets/<pet-id>/pet.json
public/pets/<pet-id>/<pet-id>-l01-rig.json
public/pets/<pet-id>/<pet-id>-l01-state-pack.json
```

10. Only add the pet to `SpriteLabPage.tsx` if it has real generated rows,
    packed atlas files, and previews.
11. Run:

```bash
npm run build
```

## QA Checklist

Before calling a pet done:

- [ ] All 12 source rows exist.
- [ ] Each source row is a real generated 8-frame strip.
- [ ] No row is a recolor, overlay, static crop, or scaffold derivative.
- [ ] `state-atlas.png` is `1536 x 2496`.
- [ ] `spritesheet.webp` exists.
- [ ] `state-atlas.json` has 12 rows.
- [ ] `previews/contact-sheet.png` exists.
- [ ] All 12 preview GIFs exist and have 8 pages/frames.
- [ ] The loop/antenna is attached in every state.
- [ ] Effects are attached, not floating as separate sprites.
- [ ] Posting has at most one intentional prop and no extra hands.
- [ ] State meaning is readable with labels hidden.
- [ ] `npm run build` passes.

## Handoff Prompt For A New Chat

Paste this into a fresh agent chat:

```text
We are in the Looplings repo. Read docs/LOOPLING_PET_GENERATION_GUIDE.md first.

Generate a new Prime-family Loopling pet named [NAME].
Identity: [BODY COLOR], [EYE STYLE], [ANTENNA/LOOP SHAPE], [FOREHEAD MARK], [PERSONALITY].
Posting prop: [PROP OR NONE].
Use Prime/Pink/Blue/Spark references from public/pets as identity anchors.

Create a real 12-state Loopling pack:
- 12 independent image-generated source rows
- packed state-atlas.png and spritesheet.webp
- state-atlas.json
- preview GIFs and contact-sheet.png
- pet.json
- <pet-id>-l01-rig.json
- <pet-id>-l01-state-pack.json

Do not make scaffold rows, recolors, overlays, or static shuffled crops.
Only register the pet in SpriteLabPage.tsx after the real generated rows are packed and QA passes.
```
