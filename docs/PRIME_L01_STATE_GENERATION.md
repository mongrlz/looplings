# Prime L01 State Generation Spec

This is the production prompt and review spec for Prime's visible state rows.
The current `public/pets/prime-test/state-atlas.png` and
`public/pets/prime-test/state-atlas.json` are prototype assets only. They are
useful for testing row layout, playback, and UI wiring, but they are not the
source of truth for final motion.

Production rows must be generated as independent state animation jobs. Do not
derive final rows by tinting, shifting, rotating, squashing, stretching, or
retiming the same base frames. Each state needs a distinct readable pose,
silhouette, expression, and motion idea while preserving Prime's identity.

## Prime Identity Lock

All rows must keep Prime recognizable:

- Pearl-white L01 body with tiny pale-blue reserved marks.
- Small black eyes, compact rounded body, tiny feet.
- Crisp pixel-art silhouette on transparent background.
- No extra character, hands, props, text, labels, UI, speech bubbles, or
  environment baked into the sprite.
- Pixel grid must stay stable enough for row-by-row atlas playback.
- The final sprite should read clearly at small in-game sizes.

## Shared Output Requirements

- One transparent-background animation row per state.
- Recommended row shape: 8 frames per state, except `dead`, which may hold on a
  single frame if the export format supports it.
- Camera, scale, anchor point, and canvas bounds must match across all states.
- Motion must loop cleanly for loop states and settle cleanly for one-shot
  reaction states.
- Death and low-compute states should feel sad and legible, not gory.

## State Jobs

| State | Generation Prompt | Acceptance Criteria |
| --- | --- | --- |
| `idle` | Prime L01 stands calmly, alive and alert, with a soft breathing bob and occasional tiny blink. Pearl-white body, pale-blue reserved marks, small black eyes, transparent pixel-art sprite. | Reads as the neutral baseline. No dramatic emotion, no props, no warning color. Loop feels calm and seamless. |
| `thinking` | Prime L01 concentrates, eyes focused, reserved marks and antenna/top mark subtly pulsing like a thought signal. Body remains mostly still with small attentive micro-motions. | Clearly says "processing" without looking distressed. Motion is distinct from idle, not just faster idle. |
| `acting` | Prime L01 executes a tool action: leaning forward with determined energy, tiny feet braced, body making a purposeful reach or tap-like motion without adding hands or tools. | Reads as "doing work now." Pose has intent and momentum while staying Prime-shaped. |
| `trading` | Prime L01 reacts to fast market data, darting attention left/right with alert eyes and quick pulse marks, as if tracking an opportunity. | More urgent than acting, less celebratory than win, less panicked than critical. No chart, coin, ticker, or UI embedded. |
| `trade_win` | Prime L01 celebrates a successful trade with a small joyful bounce, bright expression, and upward lively motion while preserving the same body design. | Feels earned and happy. One-shot can return to idle cleanly. Avoid confetti, text, money symbols, or oversized effects. |
| `trade_loss` | Prime L01 absorbs a bad trade with a small slump, lowered posture, worried eyes, and a muted pause before recovering. | Clearly disappointed but alive. Not confused with low compute or dead. No red X, chart, text, or UI marks. |
| `posting` | Prime L01 composes and sends a public post: attentive stance, tiny outward signal/wave motion from the reserved marks, focused but social energy. | Reads as communication rather than trading. No speech bubble, letters, logos, or platform UI baked into the sprite. |
| `receiving` | Prime L01 receives funds, input, or a message: posture opens toward an incoming invisible signal, reserved marks glow softly, body pulls the energy inward. | Feels receptive and grateful/curious. Motion differs from posting by pulling inward instead of broadcasting outward. |
| `sleeping` | Prime L01 rests in a curled or lowered sleepy pose, eyes closed or half-lidded, with a very slow breathing loop. | Peaceful, not dead. Still has warmth and life. Loop is slow and stable, with no alarm cues. |
| `low_compute` | Prime L01 looks tired and underpowered: drooped body, faint reserved marks, slower breathing, anxious but still functional eyes. | Reads as resource scarcity. Must be independently drawn, not a desaturated idle row. Not as severe as critical. |
| `critical` | Prime L01 is in survival distress: tense body, unstable stance, sharp worried eyes, flickering reserved marks, small glitch-like pixel instability contained to the sprite. | Urgent and unmistakable. Distinct silhouette/pose from low_compute. No gore, no large effects, no background warning UI. |
| `dead` | Prime L01 is permanently lifeless: collapsed or grounded body, dark still eyes or closed eyes, reserved marks dimmed, no breathing or recovery motion. | Reads as irreversible death, not sleep. Still recognizable as Prime. Hold frame is acceptable; no comic skulls, graves, text, or gore. |

## Review Gate

A production row passes only if a reviewer can identify the state from the
sprite alone with labels hidden. If two rows are only separable by color tint,
speed, horizontal offset, rotation, or playback timing, regenerate at least one
of them from a new prompt.
