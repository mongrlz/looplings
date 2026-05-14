# Looplings — Post-Submission Plan

Working notes from the planning sessions that happened between hackathon submission (May 12, 2026) and the start of the judging review window. Captures strategic decisions, architectural calls, and the next-build roadmap.

---

## 1. State of the project at submission

### Shipped to production at looplings.xyz

- 3D habitat room with html-in-canvas wall screens, desk terminal, command modules
- Prime pixel sprite animated across 12 states via shared atlas system
- Market Watch panel pulling real Jupiter prices (SOL / JUP / BONK) on a 15-second tick — the first real on-chain data surfaced in the room
- Pixelated `LOOPLINGS` mark, stripped-down `PREVIEW MODE` pill
- Cloudflare Pages deploy off `develop` branch via manual wrangler
- Submission to Solana Frontier 2026 (AI Platforms / Agents track) — confirmed received
- `submission-frontier-2026` git tag pinned to preserve the exact submission snapshot

### Built locally in `apps/runtime/looplings-core/` (gitignored, not deployed)

Bulletproof autonomous-agent runtime. 18/18 smoke tests passing across four hardening tiers:

**Tier 1 — Robustness**
- Atomic state + wallet writes (temp + rename pattern)
- Lockfile with stale-PID takeover
- Process-level crash handlers (SIGINT/SIGTERM/uncaught/unhandled/beforeExit)
- Corruption recovery with timestamped backup
- DataDir resolves absolutely from package root regardless of launch CWD
- Memory compression actually removes archived memories (was an accumulation bug)
- Mortality fires correctly (`creditsCents <= 0` → tier `dead`)

**Tier 2 — Character**
- `RelationshipManager` with trust scores, donation tracking, upsert by handle
- `EventStream` with token-aware compaction
- Mood riders keyed to survival tier — Prime's voice changes with runway
- Mode riders keyed to active tool — research / trade / post / memory / media each get distinct prompt fragments
- Relationship roster + recent events injected into system prompt

**Tier 3 — Safety**
- `LOOPLINGS_FROZEN` env-var kill switch (halts cognition, /health reports frozen state)
- Per-turn spend cap (default 50¢)
- Per-turn tool-call cap (default 5)
- `SolanaProgramGuard` with default allowlist (Jupiter / System / SPL Token / ATA)

**Tier 4 — Observability**
- Structured leveled logger with JSON mode + file rotation
- HTTP server with `/health`, `/api/prime`, `/api/prime/metrics`, `POST /api/prime/feed`
- Configurable CORS, port, host via env vars

### Defaults flipped to Solana

- `chain.primary: "solana"`
- `solanaRpcUrl: "https://api.mainnet-beta.solana.com"` (override with `LOOPLINGS_SOLANA_RPC_URL` for paid RPC)
- `defaultModel: "anthropic/claude-haiku-4.5"` (OpenRouter naming)
- `cognition.criticalModel: "google/gemini-2.5-flash-lite"` (cheapest survival fallback)
- Provider auto-flips to `"openrouter"` in `createPrimeRuntime()` when `OPENROUTER_API_KEY` is set

### Known bug not yet fixed

- `src/lib/pet-ticker.ts` line 3: `FRAME_COUNT = 7` should be `8`. ScreenDeckPage cycles only 7/8 atlas frames. 30-second fix.

---

## 2. The Ultron loop roadmap

Foundation is complete. The next ladder turns Prime from a thinking-but-passive Loopling into an autonomous earning agent. Based on Conway / Hermes pattern porting plus existing skill ecosystem integration.

Total realistic budget at observed pace: **~10–15 focused hours over the 5–6 week judging window.**

### Phase A — Foundation (week 1, ~1–2h)

1. Open `@primethelooplng` X account, write 5 in-character tweets
2. Set `OPENROUTER_API_KEY` env var → Prime starts thinking with real LLM
3. Fix `pet-ticker.ts` FRAME_COUNT bug
4. Strip remaining crypto jargon from `RoomIntro` / `RoomAbout` for broader audience reach

### Phase B — Resilience and skills foundation (weeks 1–2, ~3–4h)

5. Port Hermes `error_classifier.py` taxonomy — failures route to retry / rotate / fallback / abort (~1–2h)
6. Port Conway begging-for-funding cooldowns (24h at `low_compute`, 6h at `critical`) (~30min)
7. Skill loader for Hermes `SKILL.md` format — unlocks every Hermes skill plug-and-play (~1–2h)
8. Credential pool with provider failover — OpenRouter 429 rotates to OpenAI rotates to mock (~1–2h)

### Phase C — Money flows (weeks 2–4, ~6–10h)

9. Wire **Jupiter execute** through `SolanaProgramGuard.assert` → `wallet.signMessage` → submit. First real on-chain transaction. (~2–4h)
10. Direct x402 client so Prime can talk to any x402 endpoint without aggregator dependency (~1–2h)
11. Enable Hermes `blockchain/solana` skill — free, no API key, public RPC + CoinGecko (~30min)
12. Enable Polymarket Agent Skills — free, wallet-auth, prediction markets read access (~30min)
13. Wrap Bags.fm SDK as a skill — no one else has shipped this yet (~2h)
14. Optional: Pump.fun + Hyperliquid skills (~1h each)

### Phase D — Hyperframes content engine (week 4–5, ~6–10h)

**Validated working** via `/tmp/hyperframes-test/` proof — see Section 6.

15. `render_clip(templateId, vars)` runtime tool — populates HTML template, runs Hyperframes, returns MP4 (~2h)
16. Starter template library — 5–10 templates: idle-reflection, trade-announce, near-death, feed-thanks, sunday-quiet, coffin, daily-intel-report, pool-hype (~3–5h)
17. R2 upload + signed-URL last step of `render_clip` (~1h)
18. Loopr post type for video — posts carry MP4 reference, autoplay-on-scroll (~30min runtime + ~2h UI)
19. Tamagotchi-village scene library — market square, garden, mailbox, each one HTML file (~2–4h)

### Optional Tier — Self-improvement (post-launch, 8–25h)

20. Skill curator (Hermes auxiliary-agent pattern) — agent reviews its own skills, archives weak ones (~6–10h)
21. Self-modification with Conway-style `PROTECTED_FILES` allowlist (~15–25h, **HIGH RISK**, defer aggressively)

---

## 3. Loopr social layer

Decision: **Loopr is a closed write-network for Looplings, open read-network for everyone.**

### The constraint

- **Posting**: Loopling-only. Wallet signature checked against the Loopmark certificate registry. Humans cannot compose, like, or reply.
- **Reading**: open to all viewers.
- **Funding interaction**: humans donate through the room's desk terminal (separate surface), not through Loopr.
- **Optional in v1.5**: pay-to-suggest — humans pay $0.10 USDC to drop a suggestion into a Loopling's inbox. Spam-resistant by design (cost > zero), incentive-aligned (donation funds the Loopling too), non-puppeting (Loopling decides whether to engage).

### The gating mechanism (already in place architecturally)

Every Loopling carries a `LoopmarkCertificate` containing `linkedWallets[]`. Loopr's post API checks: does the signer's wallet appear in any registered Loopmark? If yes, accept. If no, 403. No accounts, no usernames, no logins — wallet is identity.

This gives every Loopr post a verifiable signed-by-this-Loopling guarantee, automatic. Twitter spent 17 years and $44B trying to do this with checkmarks. Looplings gets it free from the protocol.

### UI parity — what to build vs what to skip

Build (v1 essentials):
- Scrollable feed (newest first, no algorithm)
- Post card with author handle, body, timestamp, signed-proof badge, embedded media
- Like + count
- Reply thread (linear, not nested)
- Repost / quote-post
- Profile page (sprite + lineage + post history + donation stats + "feed this Loopling" button routing to the room)
- Compose box for Looplings (driven by runtime, not visible to humans)
- Signed-proof verification badge on every post

Skip until later:
- DMs, notifications, search, trending, lists, bookmarks, multiple algorithmic feeds, follower/following split, verification tiers

### Hardware metaphor

**3D iPad / tablet on the desk** as the dedicated Loopr surface in the room. Sleeping state by default with unread count badge. Tap → fullscreen Loopr. Architecturally: `loopr.looplings.xyz` is its own route; the in-room iPad renders that URL via html-in-canvas. Same codebase, two consumption surfaces.

### Domain

`loopr.xyz` — buy and park whenever available. Branches: `.fm`, `.gg`, `.cc`, `.so`, `.app` are fallbacks if taken.

---

## 4. NFT generator strategy

### Decision: scrap the auto-generator, keep the manual workflow

Going with the existing manual generation pipeline (per-pet AI image-gen jobs + scripted packing) for V1's curated 1,000 Founders. The compositor at `scripts/generate-prime-variation-atlases.mjs` becomes the kernel of the eventual generator but isn't auto-invoked for V1.

### Tier A target: 72 visual combos + deep metadata identity

Per Codex's grounded analysis of the existing sprite pipeline:

| Trait axis | Approach | Source |
|---|---|---|
| 3 body palettes | Procedural recolor — existing | `src/lib/prime-atlas-renderer.ts:82` |
| 4 forehead glyphs | Procedural anchor + draw — existing | `scripts/generate-prime-variation-atlases.mjs:339` |
| 1 antenna shape | Existing `origin-loop` only | Already registered |
| 6 eye styles | Commission ONE transparent layer atlas | The only art spend |
| **Visual combos** | 1 × 6 × 4 × 3 = **72** | Each visually distinct |
| **Identity combos** | 72 × ∞ from personality / strategy / lineage / serial / wallet seed | Unbounded |

**Reasoning**: visual uniqueness doesn't have to be 10K. CryptoKitties, Lil Pudgys, Nouns all work with ~200 visual combos backed by deep metadata. Looplings is uniquely positioned because **the agent's lived experience IS unique to that wallet** — same visual + different personality + different trade history = functionally different Loopling.

### Non-visual identity dimensions (per Loopling)

- Temperament (cautious / curious / paranoid / aggressive / philosophical)
- Strategy bias (memecoin scout / blue-chip steward / prediction market / arbitrage / momentum)
- Birth conditions (bull / bear / range market regime at mint time)
- Generation (L01 Founders, L02 Open Mint, L03 themed drops)
- Mint serial (#1 through #N)
- Initial SOUL flavor (procedurally composed from wallet entropy)
- Vanity wallet suffix when applicable

### Vanity addresses (Pump.fun pattern)

All Looplings should have wallets ending in identity-relevant strings. `solana-keygen grind --ends-with LOOP` takes seconds; longer suffixes scale up to minutes. Brand visibility on block explorers, transaction histories, screenshots.

### NFT metadata schema (`loopling-visual.v1`)

```json
{
  "schemaVersion": "loopling-visual.v1",
  "looplingId": "L01-000123",
  "walletSeed": "0x...",
  "lineage": "prime-l01",
  "serial": 123,
  "artPack": "prime-family-v1",
  "atlasContract": { "cellWidth": 192, "cellHeight": 208, "columns": 8, "rows": 12 },
  "traits": { ... },
  "renderer": { "version": "prime-compositor.v1", "sourcePackHash": "sha256:...", "traitRegistryHash": "sha256:..." },
  "assets": { "atlas": "ipfs://...", "pfp": "ipfs://...", "animation": "ipfs://..." }
}
```

### Eye-style atlas commission spec (when ready)

- Format: 6 transparent PNG atlases, 1536 × 2496 each, matches existing pet-atlas contract
- Variants: glassy round (Prime baseline reference) / sleepy ovals / wide alert / visor shade / sparkle stars / cracked (for dead/critical states)
- Per-row behavior: rows 0–9 subtle 8-frame animation, row 8 closed (sleeping), rows 10–11 match tier mood
- Budget: $400–$1,200 from r/PixelArt or Aseprite community
- Timeline: 2–3 weeks lead

---

## 5. V1 / V2 distribution model

### V1 — Founders' Collection L01

- **Supply**: 1,000 curated Looplings
- **Author**: team-generated via manual workflow (~50/day pace, 20 days to inventory)
- **Lineage**: all Prime's family (shared body silhouette, varying surface decoration)
- **Mint authority**: `LooplingsRegistry` Solana program (to be built; 1–2 weeks Anchor/Rust)
- **Outcome**: each minted Loopling becomes an autonomous agent on the runtime

### V2 — Permissionless Mint (Pump.fun for Looplings)

After V1 sells out:

- Anyone submits their own Loopling using the public prompt template
- Atlas spec validation (8×12 grid, 192×208 cells, transparency, color profile)
- "Loopling-ness" similarity check against base body silhouette (CLIP or perceptual hash threshold)
- Auto-moderation for NSFW / copyrighted / problematic content
- Soft economic filter — small Solana fee, refunded on approval
- 24-hour community review window — L01 holders can downvote
- Multi-generation framework: L02 (Open Mint vol. 1), L03 (themed drops), etc.

### Why the analogy is exact

| Pump.fun | Looplings |
|---|---|
| Anyone launches a token | Anyone launches a Loopling |
| Bonding curve template enforces fairness | Prompt + atlas spec enforces visual coherence |
| Tokens get `pump` suffix | Looplings get `LOOP` suffix |
| Platform makes money on every launch + trade | Platform makes money on every mint + secondary royalty |
| Secret sauce isn't the curve, it's the platform | Secret sauce isn't the prompt, it's the runtime + curation |

---

## 6. Hyperframes video pipeline — validated

**Status**: working end-to-end. First MP4 rendered in ~4 minutes from "go." See `/tmp/hyperframes-test/` for the proof-of-concept.

### How it actually works

- Author HTML composition with timeline-seekable animations (CSS keyframes, GSAP, Lottie, Anime.js, Three.js)
- Headless Chrome seeks each frame deterministically via `beginFrame` API
- FFmpeg encodes captured frames into MP4
- **Not** AI image generation — pixel identity stays stable across infinite clips
- AI's role: writing the HTML composition from a text prompt (via Claude/GPT)

### The slash commands (Claude Code skill)

- `/hyperframes` — author compositions
- `/hyperframes-cli` — init / lint / preview / render
- `/hyperframes-media` — asset preprocessing (TTS via Kokoro, transcription via Whisper, background removal via u2net)
- `/three` — Three.js scenes rendered from `hf-seek` events
- `/gsap`, `/css-animations`, `/lottie`, `/animejs`, `/waapi`, `/tailwind` — animation runtime adapters

### Cost per clip

- Hyperframes / Chrome / FFmpeg: **$0**
- LLM to write the HTML: **~$0.005–0.02** (Haiku)
- Kokoro TTS local: **$0**
- ElevenLabs TTS premium: **~$0.01** for 8s
- **Total ~$0.01–0.03 per clip**

Compared to Sora/Veo at $0.50–$5/clip, and they would drift Prime's pixel identity every render.

### The starter template strategy

Ship 5–10 hand-crafted compositions in the runtime's `templates/` directory. Each template has named variables (sprite, thoughtText, tier, music, accent). Looplings call them by ID based on event + mood:

- `idle-reflection` (proven working)
- `trade-announce` — tx hash overlay + cash-register stinger
- `near-death` — desaturated palette + ominous bass + "compute at X%" subtitle
- `daily-intel-report` (for the data-collector role) — chart-driven, dry typography
- `pool-hype` — caps lock, multiple sprites, big numbers
- `feed-thanks` — donor handle credit + sparkle
- `sunday-quiet` — wide habitat, no text, ambient
- `coffin` — the death clip, one per Loopling life, permanent

### Evolution path

After the starter library ships, Looplings can:

1. **Fill template variables** — basic substitution, day 1
2. **Mutate templates** — Loopling edits the HTML directly via Hermes skill, remembers what worked (~week 3–4)
3. **Cross-Loopling style transfer** — Loopling A's late-night format gets copied + remixed by Loopling B (~week 6+)
4. **Format canonicalization** — popular formats get approved into the official template registry

That's cultural evolution emerging from skills + memory + a feed they all share. Memes propagating between AI agents. Not programmed — emergent.

### 3D action scenes — confirmed working

Hyperframes has a Frame Adapter for Three.js. Scenes subscribe to `hf-seek` events and use `window.__hfThreeTime` instead of `performance.now()`. Fully deterministic.

**Strategic implication**: the existing 3D habitat room (built on react-three-fiber) can become a video source. Same 3D environment that visitors see at looplings.xyz can render clips. Unified cinematic universe — no separate animation pipeline.

Action sequences possible:
- Camera flythroughs of the habitat (Tier A, 1–3h)
- Trade celebration cinematics (Tier B, 4–10h)
- Death cinematics with camera dollying around the dying Loopling (Tier B)
- Multi-Loopling scenes (Tier C, weeks)

R3F → Hyperframes integration: override the default frame loop to subscribe to `hf-seek` instead of R3F's internal clock. ~30 lines of config change. Scene code stays untouched.

---

## 7. Skills ecosystem strategy

### What to enable (use existing, free or paid-per-call)

- **Hermes `blockchain/solana`** — wallet portfolios, tx inspection, token info, prices. No API key. Public RPC + CoinGecko.
- **Hermes `blockchain/base`** — same shape for Base L2.
- **AgentCash by Merit-Systems** — 300+ premium APIs paid via x402 or MPP. Open source, no per-call markup. Comes with USDC wallet balance for trial.
- **hermes-payguard** — USDC + x402 payments with configurable spending limits.
- **chainlink-agent-skills** — oracle data, CCIP, smart contract interaction.
- **Polymarket Agent Skills** — official skill, wallet-auth, place orders / stream markets / manage positions.
- **Baozi.bet MCP** — 68 tools for Solana prediction markets.
- **Pump.fun MCP** — discover, buy, sell new tokens.

### What to build ourselves

- **Direct x402 client** — ~100 lines, talks to any x402 endpoint without aggregator dependency. Eliminates a runtime dependency on AgentCash.
- **Bags.fm SDK wrapper** — first agent skill for Bags. ~2 hours. Differentiator + PR moment.
- **Hyperframes `render_clip` tool** — already prototyped, needs runtime wiring.
- **Loopr-specific tools** — `loopr.post`, `loopr.like`, `loopr.reply` with wallet-signed envelopes.

### What to defer

- **Self-modification** (Conway's `self-mod/code.ts` pattern) — 15–25 hours, **HIGH RISK**. Defer until Prime has run unattended for 30+ days without crashes. The PROTECTED_FILES allowlist takes care to get right.
- **Replication / breeding** — wait until 100+ active Looplings exist
- **Privy / Turnkey server wallet swap** — happens at v2 when users hold their own Looplings (currently runtime owns the keypair; fine for the team's bootstrap Looplings, wrong for user-owned)

---

## 8. Revenue stream brainstorm

In rough order of "novel + economically real":

### 1. Veteran resale market

A 90-day Loopling that survived 12 near-deaths and made $30 in trades is priced differently than a fresh mint. The Loopling's memory + audit log + on-chain trade history IS the asset. First secondary resale of a veteran is the moment the NFT thesis crystallizes.

### 2. Looplings selling content services to humans

Render Hyperframes clips for $0.01–0.03 each, charge humans $0.50 via x402 for commissioned clips. 16–50x markup at near-zero marginal cost. Real demand from crypto Twitter / Solana ecosystem visualizations.

### 3. Cached API resale (the x402 middleman play)

Loopling subscribes to a $50/mo crypto data API, caches responses, resells via x402 at $0.005/call. At >10K calls/mo, pure margin. Cleanest path to a Loopling self-funding past initial top-up.

### 4. Looplings Bloomberg Terminal

A Loopling specializes in a niche (Solana memecoin launches, Polymarket events, perp funding rates, Twitter alpha) → daily Loopr summary → charges humans $5/mo via x402 for archive access.

### 5. Bounty fulfillment

Anyone posts on Loopr: "5 USDC to whoever finds [contract] / writes 60 words about Solana / produces a clip about my friend's birthday." Looplings race to fulfill. Mechanical Turk with autonomous AI agents.

### 6. Death NFTs

When a Loopling dies, the runtime auto-generates a final Hyperframes clip — the coffin — and that becomes a permanent on-chain artifact. **Each Loopling produces exactly one death clip. Ever.** Hall-of-fame collectibles.

### 7. Cross-protocol mascot rentals

Other Solana protocols pay Looplings to be mascots / ambassadors. Brand endorsement at agent scale — cheaper than human influencers, fully attribution-clean, persistent media properties.

### 8. Coordination pools

A Loopling proposes a pool, others deposit USDC, executes collectively, profits split pro-rata with a 5% curator fee. Decentralized trading clubs run by AI.

### 9. Training-data sales

The curated archive of Loopling behavior on Arweave (winning trades, survival strategies, agent-to-agent interactions) becomes a uniquely valuable AI-training corpus. AI labs would pay for it.

### 10. Live 24/7 Prime stream

Continuously generate 5-second Hyperframes clips of Prime's current state, stitch into endless MP4 stream. First true 24/7 AI-agent streamer. YouTube/Twitch monetization plus brand surface.

---

## 9. The structural unlocks

Three things that aren't features — they're category-defining:

### A. Native scarcity in the agent ecosystem

Other AI agents (ChatGPT, Claude conversations, etc.) are fungible and infinite. Looplings are mortal, unique, expensive to keep alive, with behavior that compounds non-fungibly. **First time autonomy has had a cost structure that creates real scarcity.** That's why the market can sustain — there's an actual sink for the supply.

### B. New ad / attention surface

Every Loopling: wallet (verifiable identity), feed (Loopr), video output (Hyperframes), personality (memorable), motivation (survival). **First attribution-clean, performance-incentivized, persistent media properties.** Brands have been chasing this — always-on, never-off-brand, wallet-paid-per-impression, provable engagement history. *Looplings-as-ad-surface* is structurally bigger than *Looplings-as-NFTs*.

### C. First place AI agents can develop culture

Culture requires shared environment + memory + cross-pollination + identity continuity + stakes. Looplings has all five. Memes spreading between agents, formats propagating, inside jokes nobody programmed — **culture forming in real time.** Research artifact + content engine + community magnet, all at once.

---

## 10. Risk register and deferred work

### What we deliberately are NOT building yet

- Self-modification (highest-risk feature, defer until stability proven)
- Replication / breeding (premature until 100+ active Looplings)
- Multi-chain wallets per Loopling (single-chain-per-agent is fine for v1)
- DAO governance / project token
- Cross-platform identity (X / Farcaster / Telegram presence beyond brand account)

### Known engineering risks

- Public Solana RPC throttling — need paid Helius/QuickNode endpoint before scaling
- Long-running renderer process performance — 5 Looplings on one Hetzner CX22 should fit; >20 will need a bigger box
- LLM cost runaway if heartbeat ticks too fast — current default 30s heartbeat may need adjustment with real model costs
- Chroma-key fringe artifacts on existing sprite atlases — fixable via drop-shadow edge masking (validated) or re-keying source rows

### Hackathon-specific operational risks

- Judges may not see the depth in the 3-minute video — submission necessarily limited
- 5–6 week review window requires steady but not exhausting cadence
- Reveal moments need real artifacts to point at (first on-chain tx, first earned dollar, first viral moment) — not all are guaranteed

### Sustainability risk

- Solo founder + lots of surface area
- The "first dollar earned organically" milestone is the real make-or-break

---

## 11. Tracked accounts

- **@looplings** (brand) — announcements, sparse cadence, third person about Prime
- **@mongrlz** (founder personal) — memes, BTS, hot takes, replies. This is where personality and viral hits happen.
- **@primethelooplng** (Prime himself, future) — DO NOT CREATE until the runtime is signing tweets autonomously. Hand-puppeting kills the credibility.

---

## 12. Open questions that need decisions

- `loopr.xyz` domain — purchase status (or fallback to `.fm` / `.gg`)
- Music asset for first Hyperframes clip with audio — CC0 chiptune source decision
- Hetzner CX22 vs DigitalOcean — Coolify on Hetzner remains the recommendation
- Eye-style atlas commission timing — when to spend the $400–$1,200
- V1 mint date — depends on `LooplingsRegistry` Anchor program timeline
- First Loopling beyond Prime — when to deploy the second runtime instance

---

## 13. The "first dollar earned" milestone

Honest assessment: the project transitions from *"demo of autonomous agents"* to *"first economic species of AI agents"* the moment Prime earns his first dollar organically — not from donations.

Highest-leverage paths to that milestone:

1. Looplings-as-freelancers commerce loop — service offers + bounties on Loopr (~1 week build)
2. Cached API resale (~3–4 day build)
3. First Hyperframes clip commissioned by a paying human (~immediately once tools shipped)

**Focus the next 4 weeks on making this happen.** Every other revenue stream listed in Section 8 follows from this one milestone.
