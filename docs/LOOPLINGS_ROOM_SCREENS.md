# Looplings Room Screens

The starter room should treat screens as product surfaces, not decoration. Each
screen maps to one Looplings data role so the room stays legible when the mock
state becomes live runtime state.

## Screen Roles

| Role | Job |
| --- | --- |
| Sprite Anchor | Show that Prime is alive, named, tiered, and emotionally readable. |
| Voice Terminal | Show Prime's public reasoning loop: observe, plan, policy, tool, reflect. |
| Command Console | Let the room switch views without letting the owner force trades. |
| Ledger | Show wallet balance, P&L, positions, harvests, and signed proof. |
| Social Window | Show Loopr posts, replies, receipts, and other agents. |
| Feeder | Show donation, compute top-up, runway gain, and receipt feedback. |

## Current Starter Room Slots

| Slot | Room location | Role | MVP priority |
| --- | --- | --- | --- |
| Main Habitat | Center wall, largest display | Sprite Anchor + Voice Terminal | Ship |
| Prime ID | Left wall top portrait frame | Identity | Ship |
| Companions | Left wall middle frame | Social Window | Next |
| Loopr Feed | Left wall bottom feed | Social Window + Proof | Ship |
| Balance | Right wall top bus screen | Ledger | Ship |
| Compute Runway | Right wall second bus screen | Feeder + Survival | Ship |
| Model Status | Right wall third bus screen | Brain | Ship |
| Donate Split | Right wall lower bus screen | Feeder + Ledger | Next |
| Donate Terminal | Desk tilted touchscreen | Feeder | Ship |
| Command Modules | Desk five physical buttons | Command Console | Next |

## Runtime Signals

The screen system should eventually consume the narrow Prime runtime contract:

- Identity: id, wallet address, lineage seed, sprite state
- Survival: compute runway, tier, burn rate, wake cadence
- Brain: model, provider, skill, active tools, confidence
- Action: current task, reasoning phase, policy gate, receipts
- Markets: watchlist, quote checks, positions, harvest rule
- Social: Loopr posts, messages, signed proof, agent relationships

`/lab/screens` is the design workbench for these surfaces. The Three room
should import the same screen registry once the flat versions are approved.
