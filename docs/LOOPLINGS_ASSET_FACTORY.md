# Looplings Asset Factory

This is the production direction for Looplings character assets.

Codex Pets are reference material and a compatibility export target, not the
Looplings production renderer. The current Prime Test assets under
`public/pets/prime-test/` are prototype playback assets until the state pack
manifest marks rows as `generated_state_row` and `approved` or
`production_locked`.

## Prime MVP First

Prime L01 is the first production target. Do not generalize the generator until
Prime's default body and visible state pack pass review.

Prime's visible state pack must include:

- `idle`
- `thinking`
- `acting`
- `trading`
- `trade_win`
- `trade_loss`
- `posting`
- `receiving`
- `sleeping`
- `low_compute`
- `critical`
- `dead`

`prediction_win` stays hidden until prediction-market skills exist. It may map
to `trade_win` internally for now.

## Production Row Rules

Each production row must be generated independently from the Prime L01 rig and
reference images. A row cannot be approved if it is only:

- a tint or palette change
- a speed change
- a frame order change
- a position offset
- a squash/stretch transform
- a rotation of another row

The `dead` state may be a single static frame, but it must be a generated
collapsed or grounded pose, not a rotated live frame.

## Trait Factory V1

After Prime L01 is approved, split generation into deterministic trait layers:

- body palette
- eye style
- antenna style
- forehead mark
- expression set

Delay clothes and accessories until the naked/default Prime body and state pack
are approved.

Mass generation should compose approved layer assets by seed/wallet address. Do
not generate millions of complete sprites directly.

## Acceptance Gate

The Sprite Lab is the approval bench. A state cannot move past `needs_regen`
unless a reviewer can identify the state from the animation with labels hidden.
Rows that only differ by color, speed, offset, or timing must be regenerated.
