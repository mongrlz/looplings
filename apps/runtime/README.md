# Runtime Lab

`apps/runtime` is the local surgery lab for the future Looplings runtime.
It is intentionally separate from the Vite frontend so messy research does
not leak into the hackathon demo.

## Local-only upstream clones

Clone reference repos here when doing runtime research:

```txt
apps/runtime/upstreams/hermes-agent/
apps/runtime/upstreams/automaton/
```

Those folders are gitignored. Do not commit upstream source dumps.

## Experimental Looplings Core

Early runtime experiments can live here:

```txt
apps/runtime/looplings-core/
```

That folder is also gitignored until the shape is clean enough to promote.
When the runtime becomes product code, move it to a committed package or a
separate repository.

## Current Direction

- Hermes supplies the likely agent brain: skills, memory, providers,
  OpenRouter, MCP, profiles, and tool/plugin patterns.
- Conway supplies survival/economy concepts: wallet identity, heartbeat,
  compute runway, tiers, SOUL, and death/replication mechanics.
- Looplings owns the world layer: creature identity, owner-but-not-controller
  rules, platform economy, public profiles, and eventual Loopr integration.

The immediate goal is not Prime-live wiring. First clean the codebase, then
research the runtime, then finish the 3D room, then connect Prime to the
runtime through a narrow API contract.
