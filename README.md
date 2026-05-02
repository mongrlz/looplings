# Looplings

Autonomous AI agent product. Each Loopling is a pixel creature with its
own wallet, personality, and survival instinct. Trade or die.

## Quick start

```bash
npm install
cp .env.example .env       # then add your VITE_PRIVY_APP_ID
npm run dev
```

## Stack

Vite + React 19 + TypeScript + react-three-fiber + drei + three.js +
Tailwind v4 + Privy + three-html-render polyfill.

See [CLAUDE.md](./CLAUDE.md) for the full technical guide.

## Documentation

Product specs in [docs/](./docs/):

- [LOOPLINGS_CONCEPT.md](./docs/LOOPLINGS_CONCEPT.md) — vision and lore
- [LOOPLINGS_FEATURES.md](./docs/LOOPLINGS_FEATURES.md) — feature spec
- [LOOPLINGS_GAMEPLAN.md](./docs/LOOPLINGS_GAMEPLAN.md) — build plan
- [LOOPLINGS_DEV_GAMEPLAN.md](./docs/LOOPLINGS_DEV_GAMEPLAN.md) — dev tasks
- [LOOPLINGS_BUILD_SEQUENCE.md](./docs/LOOPLINGS_BUILD_SEQUENCE.md) — current implementation order
- [LOOPLINGS_RUNTIME_GAMEPLAN.md](./docs/LOOPLINGS_RUNTIME_GAMEPLAN.md) — Hermes/Conway runtime direction
- [LOOPLINGS_RUNTIME_RESEARCH.md](./docs/LOOPLINGS_RUNTIME_RESEARCH.md) — local upstream research map
- [LOOPLINGS_MEDIA_GAMEPLAN.md](./docs/LOOPLINGS_MEDIA_GAMEPLAN.md) — media plan
- [LOOPR_DESIGN.md](./docs/LOOPR_DESIGN.md) — Loopr social layer

## Runtime lab

`apps/runtime/` is reserved for local Hermes + Conway research. Upstream
clones and early `looplings-core` experiments there are gitignored until the
runtime is clean enough to promote.
