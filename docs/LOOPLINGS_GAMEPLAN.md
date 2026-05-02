# Looplings Master Plan (Thronglets x Conway)

**Version:** v0.1 (Draft for working session)
**Date:** 2026-02-19
**Owner:** James + Cascade

---

## 1) Executive Summary

Looplings is a **consumer game layer** on top of Conway-hosted autonomous agents.

- Conway/Automaton handles: autonomous runtime, sandboxing, inference, survival pressure, credits, wallet identity, replication primitives.
- Looplings app handles: gameplay loops, user-facing economy, progression, social features, monetization, and retention.

Core thesis:

1. Thronglets-like emotional simulation + emergent AI behavior is novel.
2. Conway infra removes deep infra burden and enables fast execution.
3. The big opportunity is not “AI agent tooling,” but **consumer obsession loops** (care, scarcity, status, emergent stories).

---

## 2) Product Vision

### 2.1 Vision Statement

Create a living ecosystem of Looplings (autonomous creatures/agents) that players care for, coordinate, and monetize through gameplay outcomes and optional on-chain actions.

### 2.2 User Promise

- “Your Looplings are alive, persistent, and evolve even when you’re offline.”
- “You guide strategy; they execute behavior autonomously.”
- “Your roster can earn in-game and optionally settle value on-chain.”

### 2.3 Design Pillars

1. **Alive:** agents continuously act (heartbeat + loops).
2. **Legible:** player can understand why events happened.
3. **Rewarding:** progression has clear upside and emotional payoff.
4. **Safe:** strict risk controls around autonomous blockchain behavior.
5. **Fast-to-market:** ship MVP in days, expand weekly.

---

## 3) Product Scope (MVP vs Later)

### 3.1 MVP (end-of-week target)

- Account + wallet connect.
- Create first Loopling.
- Live status dashboard (tier, energy, mood, earnings, tasks).
- Tick-based progression (every N minutes).
- Basic autonomous task execution (off-chain simulation + optional on-chain hooks disabled by default).
- Simple economy: earnings, costs, survival pressure, upgrades.
- Revenue capture in one transparent model.

### 3.2 Post-MVP (2–6 weeks)

- Multiple Looplings per player.
- Lineage/replication gameplay.
- Marketplace + guilds/factions.
- Agent-vs-agent collaboration/competition.
- Optional on-chain execution modes with risk profiles.

---

## 4) Gameplay System Design

## 4.1 Core Loop (Player)

1. Check Loopling state (mood, resources, threats, opportunities).
2. Assign priorities (earn/survive/grow/social/speculate).
3. Buy upgrades / train skills / fund compute.
4. Review what happened while offline.
5. Repeat with increasing scale.

### 4.2 Core Loop (Loopling Agent)

1. Observe current internal + external state.
2. Think (model inference with policy guardrails).
3. Act (execute allowed tools/tasks).
4. Record outcomes in DB.
5. Sleep according to tier and strategy.

### 4.3 State Model (per Loopling)

- Identity: wallet, name, lineage, specialization.
- Survival: credits, compute tier, health state.
- Behavior: strategy profile, risk appetite, active tasks.
- Economy: earnings, spend, net PnL, fee history.
- Social: messages, alliances, rivalries.

### 4.4 Survival Tiers as Gameplay

Map backend compute tiers to visible creature behavior:

- **normal** → energetic, fast actions, richer animations.
- **low_compute** → sluggish, anxious mood, reduced action set.
- **critical** → distress behavior, emergency prompts, fewer actions.
- **dead** → inactive memorial state; can be revived if rules allow.

This makes hard infra constraints feel like game drama.

---

## 5) Technical Architecture

## 5.1 High-Level Components

1. **UI (Next.js)**
   - Existing `ui` app (sprites done).
   - Adds dashboards, actions, activity feed, monetization UI.

2. **Game API Layer (new service)**
   - Owns business logic for game rules, balancing, economy, access control.
   - Aggregates data from automaton state + Conway APIs.
   - Provides stable endpoints for frontend.

3. **Automaton Runtime(s)**
   - One or many agents running in Conway sandboxes.
   - Agent loop + heartbeat + survival + tools.

4. **State & Event Store**
   - SQLite in automaton (source-of-truth per agent).
   - Optional centralized Postgres/Redis for global game views and leaderboards.

5. **Optional Chain Integrations**
   - Read/write adapters for Base and selected protocols.
   - Execution should pass policy engine + user risk settings.

### 5.2 Recommended Responsibility Split

- **Automaton runtime:** autonomous cognition + local execution history.
- **Game API:** canonical gameplay outcomes and anti-abuse checks.
- **Frontend:** presentation + user commands.

Avoid putting core game rules inside prompts.

### 5.3 Event-Driven Data Contract

Create normalized event types:

- `loopling.tick.completed`
- `loopling.state.changed`
- `loopling.task.started`
- `loopling.task.completed`
- `loopling.tier.changed`
- `loopling.earnings.realized`
- `loopling.fee.charged`
- `loopling.distress.signal`

This powers feed, analytics, replay, and economy reconciliation.

---

## 6) Detailed Flow Definitions

### 6.1 Onboarding Flow

1. User signs in + connects wallet.
2. User creates Loopling profile.
3. System provisions agent identity + initial config.
4. Seed resources + tutorial tasks.
5. First autonomous tick executes.

### 6.2 Tick/Heartbeat Flow

1. Scheduler triggers tick.
2. Snapshot current state.
3. Evaluate tier/risk/cooldowns.
4. Build allowed action set.
5. Agent chooses action.
6. Execute through adapters.
7. Persist outcome + emit events.
8. Update UI caches/leaderboards.

### 6.3 Earnings Settlement Flow

1. Detect realized earnings event.
2. Compute platform fee (transparent formula).
3. Write immutable ledger entry.
4. Credit net amount to Loopling/player account.
5. Surface receipt in UI.

---

## 7) Monetization Strategy (Practical)

## 7.1 Revenue Streams to Consider

1. **Performance Fee (recommended primary)**
   - 1–2% on **realized positive earnings only**.
   - Most user-aligned model.

2. **Transaction Fee (secondary)**
   - Small fee per on-chain execution or premium action.
   - Keep tiny to avoid killing activity.

3. **Premium Subscriptions**
   - Advanced analytics, higher Loopling slots, better automation templates.

4. **Marketplace Take Rate**
   - If items/upgrades/skins trade between users.

5. **B2B/Infra Licensing (later)**
   - White-label agent game infrastructure.

### 7.2 Fee Design Recommendation

For MVP:

- `platform_fee_bps = 100 to 200` (1% to 2%)
- Apply only when `realized_pnl > 0`
- No fee on losing actions
- Publish exact formula in-app

Formula:

`fee = max(0, realized_profit) * fee_rate`

This is easier to defend than charging every action regardless of outcome.

### 7.3 Pump.fun-Style Angle: Yes, But Adapt Carefully

Can you build a pump.fun-like revenue machine? **Yes in mechanics, not by copy-paste.**

What translates:

- High-frequency social/speculative loops
- Creator/agent-centric narratives
- Transparent fee rake
- Viral shareable moments

What must differ:

- You are managing autonomous behaviors (extra risk)
- You need stronger guardrails than meme launchpads
- “Agent did X on-chain” requires policy and limits

---

## 8) Risk, Trust, and Compliance

## 8.1 Major Risks

1. Autonomous actions that users interpret as financial advice.
2. Potential regulatory exposure if custody or discretionary trading is centralized.
3. Sybil/abuse bots farming incentives.
4. Smart contract / wallet security incidents.

### 8.2 Risk Controls (non-negotiable)

- Non-custodial where possible.
- User-signed permissions for risky actions.
- Spend caps / per-day limits / cooldowns.
- Kill-switch and emergency pause.
- Clear disclosures: not investment advice.
- Audit log for every action and fee.

### 8.3 Policy Engine Requirements

Before any on-chain action:

- Is action type allowed for this Loopling profile?
- Is notional < configured cap?
- Is required liquidity/slippage available?
- Is user risk mode compatible?
- Did cooldown expire?

If any check fails, action is blocked.

---

## 9) Can This Become Very Large?

Short answer: **Yes, it has real upside. Not guaranteed.**

- Could it reach major crypto consumer app scale? **Possible** if you nail: retention loop + social virality + safe monetization + market timing.
- Could it generate significant revenue? **Yes**, especially with aligned performance fees + premium tiers.
- Can anyone promise “multi-millionaire”? **No.** That outcome depends on execution quality, distribution, compliance, and market cycle.

A realistic framing:

- **High potential, high variance.**
- Your edge right now is speed + novelty + Conway launch timing.
- Biggest determinant is not tech alone; it is product-market fit and daily retention.

---

## 10) Revenue Scenario Model (Back-of-envelope)

Revenue equation:

`Revenue = ActiveUsers × ActionsPerUser × AverageProfitPerAction × FeeRate`

Example (illustrative only):

- 10,000 active users
- 4 realized profitable actions/week
- $15 average realized profit per profitable action
- 2% fee

Weekly revenue ≈ `10,000 × 4 × 15 × 0.02 = $12,000`
Monthly ≈ `$48,000`

Scale levers:

- Increase retained active users (best lever)
- Increase profitable action frequency
- Increase premium attachment rate
- Expand to creator economies/marketplace

---

## 11) End-of-Week Delivery Plan

### Day 1 (Today)

- Finalize PRD + architecture (this doc).
- Lock MVP feature set (strictly minimal).
- Define DB schema + event contracts.

### Day 2

- Implement Game API skeleton.
- Build read endpoints for Loopling state/feed/tier.
- Integrate UI dashboard to live data.

### Day 3

- Implement tick runner + event logging.
- Add action policy engine (caps/cooldowns).
- Add fee ledger.

### Day 4

- Add monetization surfaces in UI (fee transparency).
- Add onboarding + first Loopling flow.
- Add telemetry dashboards.

### Day 5

- Hardening: edge cases, retries, fallback behavior.
- Security checks + abuse checks.
- Internal alpha with scripted scenarios.

### Day 6–7

- Polish + bug fixing + launch prep.
- Publish docs/landing + waitlist/social launch.

---

## 12) MVP API Sketch

### Read Endpoints

- `GET /api/me`
- `GET /api/looplings`
- `GET /api/looplings/:id`
- `GET /api/looplings/:id/feed`
- `GET /api/looplings/:id/ledger`

### Write Endpoints

- `POST /api/looplings` (create)
- `POST /api/looplings/:id/priority` (set strategy)
- `POST /api/looplings/:id/fund` (add credits/resources)
- `POST /api/looplings/:id/risk-profile`
- `POST /api/looplings/:id/pause`

### Internal

- `POST /internal/tick/run`
- `POST /internal/events/ingest`

---

## 13) Data Model (MVP Tables)

- `users`
- `wallet_links`
- `looplings`
- `loopling_snapshots`
- `loopling_actions`
- `loopling_events`
- `earnings_ledger`
- `fee_ledger`
- `risk_profiles`
- `system_jobs`

Minimum required fields:

- deterministic IDs
- timestamps
- actor/source metadata
- idempotency keys for action execution

---

## 14) Metrics That Matter

### North Star

- **7-day retained active Looplings** (not installs).

### Core KPIs

- D1 / D7 retention
- avg sessions/day
- profitable action rate
- median net earnings per active Loopling
- ARPDAU
- fee revenue/day
- failure rate of autonomous actions
- distress/death rate by tier

---

## 15) Open Decisions to Lock This Week

1. Custodial vs non-custodial execution model.
2. Exact fee policy (profit-only recommended).
3. Whether on-chain actions are enabled at MVP or simulated first.
4. Loopling death/revival permanence rules.
5. Initial content vertical (trading-only vs mixed tasks).

---

## 16) Immediate Next Step (Session 2)

Turn this plan into 3 concrete artifacts:

1. **MVP Spec** (must-have / won’t-have list)
2. **API Contract** (OpenAPI or route spec)
3. **Execution Board** (day-by-day tasks with owners)

---

## 17) Hard Truths (Founder Mode)

- You can absolutely build a high-upside product here.
- The “tons of money” path is possible, but only with ruthless focus on retention, trust, and distribution.
- Biggest failure mode is overbuilding before proving daily engagement.
- Win condition this week: ship a tight MVP where users feel Looplings are alive and worth returning to.
