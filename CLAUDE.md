# Looplings — Claude Code / Cursor Catch-Up

Read this file first if you're an AI assistant landing in this repo. It's
the fastest path to context.

## What this project is

Looplings is an autonomous AI agent product. Each Loopling is a procedurally
generated pixel creature with its own crypto wallet, personality, and
survival instinct. Funded with $5–$30, they trade, post, and try to stay
alive. If they make money, the owner makes money. If they run out of
compute credits, they die permanently.

This repo is the **frontend / demo** for that product. It now also reserves
`apps/runtime/` as a local-only research lab for the future Looplings runtime.
That runtime is expected to combine Hermes-style agent capabilities with
Conway-style survival economics, but cloned upstream source should not be
committed.

## Current build phase

We're heading into the Coliseum Frontier hackathon (submissions close
May 11, 2026). The MVP submission is a SINGLE Loopling named **Prime**
living publicly in a 3D scene where viewers can:

- Watch Prime think, trade, and react in real time
- See which AI model + tools Prime is currently using
- See Prime's compute runway (mortality timer)
- Donate to Prime's wallet (70% to Prime / 20% to dev / 10% reserve)
- Interact with the 3D environment (orbit camera, click props)

The 3D scene will eventually render Prime onto a Steam Deck-style device's
screen surface using the html-in-canvas API (with `three-html-render`
polyfill for browsers without native support).

## Stack

- **Vite 6** (NOT Next.js) — chosen for browser performance, simple 3D
  setup, no SSR confusion with Three.js
- **React 19** + **react-three-fiber 9** + **drei 10** + **three.js 0.184**
- **TypeScript 5** with `@/*` path aliases pointing at `src/*`
- **Tailwind v4** via `@tailwindcss/vite` plugin
- **Solana Wallet Standard** via `@solana/client` + `@solana/react-hooks`
  for keyless browser-wallet discovery, live balance reads, and signed transfers
- **react-router-dom 7** for routes
- **three-html-render** for HTML-on-3D-mesh rendering (Chrome 148+ native;
  polyfill for everywhere else)
- **vite-plugin-node-polyfills** for browser compat with Node-style libs
- **minidenticons** + **lucide-react** for utility sprites + icons

## Repository layout

```
Looplings/
├── package.json
├── vite.config.ts          (configures plugins + @/ alias)
├── tsconfig.json           (root, references app + node configs)
├── tsconfig.app.json       (browser TS settings, includes path alias)
├── tsconfig.node.json      (Node-side build tooling)
├── index.html              (Vite entry HTML)
├── .gitignore              (gitignores *.private.* and similar)
│
├── apps/
│   └── runtime/
│       └── README.md      (local runtime lab instructions; upstream clones
│                           and early looplings-core experiments are ignored)
│
├── src/
│   ├── main.tsx            (calls setupHtmlInCanvas, mounts <App>)
│   ├── App.tsx             (BrowserRouter + application routes)
│   ├── lib/
│   │   ├── html-in-canvas-polyfill.ts   (one-call polyfill installer)
│   │   ├── solana-client.ts             (Wallet Standard + RPC config)
│   │   ├── prime-wallet.ts              (Prime balance + support adapter)
│   │   └── sprite-generator.ts          (palette, hashing, lineage logic)
│   ├── components/
│   │   ├── sprites/
│   │   │   ├── LooplingSprite.tsx       (procedural sprite via minidenticons)
│   │   │   ├── CellGrid.tsx             (CSS-grid pixel renderer)
│   │   │   ├── LooplingCard.tsx         (sprite + tier + stats card)
│   │   │   ├── AnimatedBackground.tsx   (Game-of-Life background)
│   │   │   ├── SpecialSprite.tsx        (renderer for one-off sprites like Prime)
│   │   │   └── PrimeFrames.ts           (Prime's frame data + palette)
│   │   ├── devices/
│   │   │   ├── Device.template.tsx      (abstract 3D device base)
│   │   │   └── SteamDeck.tsx            (Steam Deck device — placeholder
│   │   │                                 will be replaced with newer
│   │   │                                 Steam Deck model when ready)
│   │   ├── pages/
│   │   │   └── PrimePage.tsx            (current placeholder Prime page)
│   │   ├── scenes/                      (3D scenes — empty, populate next)
│   │   └── ui/                          (overlay UI — empty, populate next)
│   ├── types/
│   │   └── html-in-canvas.d.ts          (TS types for the WICG API)
│   └── styles/
│       └── globals.css                  (Tailwind + custom anims +
│                                          .scanlines retro effect)
│
└── docs/                                (markdown product docs)
    ├── LOOPLINGS_CONCEPT.md             (vision, lore, addiction loop)
    ├── LOOPLINGS_FEATURES.md            (full feature spec — REDACTED
    │                                     for some confidential sections)
    ├── LOOPLINGS_GAMEPLAN.md            (build plan)
    ├── LOOPLINGS_DEV_GAMEPLAN.md        (dev tasks)
    ├── LOOPLINGS_MEDIA_GAMEPLAN.md      (media + viral plan)
    └── LOOPR_DESIGN.md                  (Loopr social layer design)
```

## What's confidential (do not commit publicly)

Files matching `*.private.*` are gitignored. They contain content that
must NOT appear in public commits:

- `src/components/sprites/CouncilSprite.private.tsx` — full council sprite
  data (frames + palettes for all five council members)
- `docs/LOOPLINGS_FEATURES.private.md` — unredacted full feature spec
  including council details

The public versions in this repo have those sections replaced with
`[REDACTED — see private notes]` placeholders. If you need to know
what was redacted, read the `.private` files locally — but never
commit them.

If a user asks about "the council," redirect them — that part of the
product is not yet public. Reference the redacted markers in the docs
without expanding what's behind them.

## Runtime lab

`apps/runtime/` is for local Hermes + Conway research:

```
apps/runtime/
  upstreams/
    hermes-agent/     (gitignored clone)
    automaton/        (gitignored clone)
  looplings-core/     (gitignored experimental runtime)
```

Use those folders as source material, then promote only cleaned Looplings-owned
code into a committed package or separate repo when ready.

## What's NOT in this repo (yet)

- **Production Looplings runtime.** Hermes and Conway/Automaton should be
  cloned locally under `apps/runtime/upstreams/` for research, but the product
  runtime should become a clean Looplings-owned layer rather than a committed
  dump of either upstream repo.
- **Bags.fm SDK / MCP integration** — for trading. Will be added once
  Prime is rendered and we're ready to make it actually trade.
- **Solana donation contract** — the on-chain 70/20/10 split mechanism.
  Not built yet.
- **Custom Steam Deck 3D model** — being modeled in Blender separately,
  will be exported to `.glb` and dropped in `public/models/` when ready.

## Setup steps for fresh checkout

```bash
npm install
cp .env.example .env       # Then add Prime's public Solana address
npm run dev
```

Wallet discovery requires no provider account or API key. Prime's support
controls remain locked until `VITE_PRIME_SOLANA_WALLET_ADDRESS` contains a
valid public address. Never place a private key in a Vite environment file.

## Core architectural decisions

### MCP + Skills split

Loopling capabilities come from two layers:

- **MCP servers** = capabilities (the hammer). Most are drop-in from the
  open-source MCP ecosystem (Jupiter, Polymarket, Hyperliquid, Twitter
  read, etc.). We only write Bags.fm + Loopr from scratch.
- **Skills** = strategy (the manual). Markdown files telling the agent
  WHEN and WHY to use which tools. This is our IP and where we iterate.

See `docs/LOOPLINGS_FEATURES.md` § "MCP + Skills Architecture" for the
full pattern.

### Emergence → Curation → Inheritance loop

Looplings learn individually (each agent has SOUL + memory + can author
its own skills). The platform curates emergent winning patterns and
promotes them to the shared skill registry. New Looplings inherit those
promoted skills. Species-level learning, not just individual.

See `docs/LOOPLINGS_FEATURES.md` § "Emergence → Curation → Inheritance".

### Vite over Next.js

Three.js + R3F + html-in-canvas works cleanly in plain Vite. Next.js
adds SSR friction, `'use client'` boilerplate, and hydration mismatches
on canvases. None of that helps a 3D-first product.

### Build order

Current sequence:

1. Clean and stabilize this codebase.
2. Use `apps/runtime/` for Hermes + Conway runtime surgery.
3. Finish the 3D Prime room with mocked runtime data.
4. Wire Prime to the cleaned runtime through a narrow adapter.

Do not build Loopr yet. Do not wire Prime live before the room is ready.

See `docs/LOOPLINGS_BUILD_SEQUENCE.md` and
`docs/LOOPLINGS_RUNTIME_GAMEPLAN.md`.

## Reference repos

- Sawyer Hood's html-in-canvas-room (the upstream we forked for the
  CRT/HTML-screen pattern): `github.com/SawyerHood/html-in-canvas-room`
- WICG html-in-canvas spec: `github.com/WICG/html-in-canvas`
- Conway automaton (survival/economy reference):
  `github.com/Conway-Research/automaton`
- James's Conway fork: `github.com/mongrlz/automatontest`
- Hermes Agent (agent brain/runtime reference):
  `github.com/NousResearch/hermes-agent`

## Coding conventions

- **No `'use client'` directives** — Vite doesn't use them; they were
  artifacts of the previous Next.js codebase and have been stripped.
- **Imports use `@/...` paths** for anything under `src/`.
- **No comments unless WHY is non-obvious** — code should be readable
  on its own. Comments in the spec markdowns are detailed because
  product reasoning matters; comments in code should be minimal.
- **Types are colocated** — keep `interface Props` next to the component
  that uses them.
- **Styles are inline or globals.css** — Tailwind v4 utilities are
  preferred. Avoid CSS modules.

## When in doubt

- For product vision questions, read `docs/LOOPLINGS_CONCEPT.md`
- For feature specs, read `docs/LOOPLINGS_FEATURES.md`
- For build sequencing, read `docs/LOOPLINGS_GAMEPLAN.md` and
  `docs/LOOPLINGS_DEV_GAMEPLAN.md`
- For the current implementation order, read
  `docs/LOOPLINGS_BUILD_SEQUENCE.md`
- For Hermes/Conway runtime direction, read
  `docs/LOOPLINGS_RUNTIME_GAMEPLAN.md`
- For current cloned upstream notes, read
  `docs/LOOPLINGS_RUNTIME_RESEARCH.md`
- For Loopr social layer specs, read `docs/LOOPR_DESIGN.md`
- For media / viral / launch strategy, read
  `docs/LOOPLINGS_MEDIA_GAMEPLAN.md`

## Next session work plan

The current sequence:

1. Clean baseline and branch discipline.
2. Clone Hermes + Conway into ignored `apps/runtime/upstreams/` for research.
3. Start a gitignored `apps/runtime/looplings-core/` surgery lab.
4. Finish the 3D Prime room with mocked state.
5. Wire the room to the runtime adapter only after the room is ready.

Stop and ask the user before introducing new dependencies or making
architectural changes to the layout.
