# Looplings Runtime Research Notes

Snapshot from local clones in `apps/runtime/upstreams/`.

## Pulled Upstreams

| Repo | Local path | Snapshot |
| --- | --- | --- |
| Hermes Agent | `apps/runtime/upstreams/hermes-agent` | `b7ad3f4` |
| Conway Automaton | `apps/runtime/upstreams/automaton` | `22096f7` |

These upstreams are gitignored reference material. Do not commit them.

## First Read

Hermes is the stronger general agent operating system. It is broad, Python,
and built around provider routing, tools, skills, memory, messaging gateways,
terminal backends, cron, delegation, and MCP.

Conway is the stronger survival-economy reference. It is compact, TypeScript,
and organized around a sovereign agent runtime: wallet identity, SQLite state,
heartbeat, ReAct loop, Conway credit checks, survival tiers, SOUL, skills,
policy, social messages, and replication.

## Conway Modules To Study

| Area | Path |
| --- | --- |
| Main lifecycle | `src/index.ts` |
| ReAct loop | `src/agent/loop.ts` |
| Tools | `src/agent/tools.ts` |
| Policy engine | `src/agent/policy-engine.ts` |
| Conway credits | `src/conway/credits.ts` |
| Heartbeat | `src/heartbeat/` |
| Wallet identity | `src/identity/` |
| Inference routing | `src/inference/` |
| Memory | `src/memory/` |
| SQLite state | `src/state/` |
| SOUL | `src/soul/` |
| Survival | `src/survival/` |
| Skills | `src/skills/` |

## Hermes Modules To Study

| Area | Path |
| --- | --- |
| Core agent package | `agent/` |
| Memory | `agent/memory_manager.py`, `agent/memory_provider.py`, `tools/memory_tool.py` |
| Skill system | `agent/skill_*`, `tools/skills_*`, `tools/skill_manager_tool.py` |
| Provider/model routing | `agent/*_adapter.py`, `agent/model_metadata.py`, `tools/openrouter_client.py` |
| MCP | `tools/mcp_tool.py`, `tools/mcp_oauth.py`, `tools/managed_tool_gateway.py` |
| Tool registry | `tools/registry.py` |
| Terminal backends | `tools/terminal_tool.py`, `environments/` |
| Scheduling | `cron/`, `tools/cronjob_tools.py` |
| Delegation | `tools/delegate_tool.py` |
| Safety | `agent/tool_guardrails.py`, `tools/path_security.py`, `tools/tirith_security.py` |

## Extraction Bias

Start from a minimal Looplings runtime instead of copying either upstream
shape wholesale.

First useful `looplings-core` slice:

```txt
src/
  agent/
  api/
  heartbeat/
  identity/
  memory/
  policy/
  providers/
  skills/
  state/
  survival/
  tools/
```

The first milestone is a single Prime process with SOUL, state, provider
selection, thought/action events, wallet identity, and compute runway. Trading
and donations come after that loop is stable.

## Current Lab Scaffold

Created under ignored `apps/runtime/looplings-core/`.

```txt
apps/runtime/looplings-core/
  CONWAY_MAP.md
  README.md
  examples/prime.soul.md
  package.json
  tsconfig.json
  src/
    agent/
    api/
    config/
    heartbeat/
    identity/
    policy/
    providers/
    runtime/
    skills/
    state/
    survival/
    tools/
```

The scaffold currently supports:

- parsing Prime's SOUL document
- creating a Loopling identity
- calculating compute runway and survival tier
- registering providers and tools behind interfaces
- selecting a primary chain (`base`, `base_sepolia`, or `solana`)
- mapping x402 as a Base/EVM payment gateway boundary
- mapping trading as intent -> simulation -> execution adapters
- using OpenAI-compatible and Hermes bridge provider boundaries
- adding an observe/plan/reflect cognitive frame before each wake turn
- policy-checking tool calls
- running a short wake cycle
- recording thoughts and actions
- exporting a frontend-facing Prime runtime state
- runtime events, audit entries, transactions, inbox messages, and memory
  records in the state shape
- funding notices and tier/death lifecycle helpers
- child genesis validation for future replication
- treasury profit split policy
- trade policy validation before simulation/execution
- real Base/Base Sepolia wallet generation/loading through `viem`
- real Solana wallet generation/loading through `@solana/web3.js`
- read-only Base/Base Sepolia USDC balance checks
- read-only Solana USDC balance checks
- read-only ETH/SOL native balance checks
- Base x402 EIP-712 payment signing behind an allowlisted gateway
- durable JSON-file state snapshots
- optional SQLite schema/adapter boundary for later `better-sqlite3` install
- OpenRouter/OpenAI/Hermes provider registration from environment variables
- OpenAI-compatible tool-call parsing
- Jupiter quote simulation boundary for Solana swaps
- Base quote simulation boundary for future 0x/1inch-style quotes
- Loopmark birth certificate: immutable brand mark (`LOOP`), genesis hash,
  SOUL hash, sprite seed, lineage, linked wallets, and NFT metadata export

Validation:

```bash
npx tsc -p apps/runtime/looplings-core/tsconfig.json
node apps/runtime/looplings-core/dist/runtime/prime-runtime.js
```

Both commands passed locally.

## Missing Before Real Money

The current lab scaffold is safe by default. It does not execute real trades or
sign x402 payments yet.

Next implementation targets:

1. SQLite runtime dependency decision (`better-sqlite3` or another DB layer).
2. x402 live endpoint testing with a capped test payment.
3. Bags SDK adapter, once chosen.
4. Real Base quote API selection and integration.
5. Wallet-signed swap execution policy, still disabled by default.
6. Position tracking and profit-harvest execution.
7. Full Hermes process bridge instead of only HTTP bridge/provider shape.
8. Signed owner/agent message verification.
9. Audit log persistence beyond snapshot JSON.

## Conway Completeness Matrix

| Conway subsystem | Looplings Core status | Next step |
| --- | --- | --- |
| Config/bootstrap | Partial | Load config from disk/env, not just defaults |
| Wallet identity | Implemented in lab | Harden key storage and custody policy |
| SQLite state DB | Boundary only | Install/choose DB adapter; JSON snapshot works now |
| Turns/tool log | Partial | Persist turn records with token/cost accounting |
| Heartbeat | Partial | Add scheduled task registry and wake-event queue |
| Credits/runway | Partial | Connect to real credit ledger and burn accounting |
| Low-compute mode | Partial | Switch models/tools/heartbeat cadence by tier |
| Death grace period | Partial | Persist zero-credit timestamp and dead transition |
| Funding strategies | Partial | Emit dashboard/API funding notices and donation intents |
| x402 payments | Implemented behind gateway | Test with real capped endpoint |
| Solana balances | Partial | USDC implemented; add SOL/native balance |
| Trading | Partial | Jupiter quote simulation added; execution disabled |
| Policy engine | Partial | Add spend windows, asset/protocol allowlists, path/tool rules |
| Skills | Partial | Parse SKILL.md frontmatter and sanitize instructions |
| SOUL | Partial | Track SOUL history, alignment, and reflection updates |
| Memory | Partial | Add working/semantic/procedural/relationship tiers |
| Social inbox | Partial | Verify signatures and queue owner/agent messages |
| Replication | Partial | Add child lifecycle state machine, no sandbox spawning yet |
| Registry/on-chain identity | Missing | Decide ERC-8004/Base registry vs Looplings registry |
| Observability | Partial | Add metrics snapshots and alert rules |
| Self-mod audit | Partial | Log file/skill/SOUL changes append-only |

## Looplings-Specific Completeness Matrix

| Product need | Status | Next step |
| --- | --- | --- |
| Owner-but-not-controller | Partial | Enforce across messaging, policies, and UI copy |
| Profit harvesting | Partial | Add position tracking and harvest thresholds |
| 70/20/10 or configured split | Partial | Treasury policy exists, needs wallet transfer execution |
| Prime frontend state | Partial | Feed runtime snapshot into frontend adapter |
| Deterministic sprite identity | Frontend exists | Runtime should expose wallet/lineage seed |
| Donation wallet/runway | Partial | Wallet identity and USDC readers exist; add frontend adapter |
| Birth certificate brand | Implemented in lab | Expose Loopmark in frontend/NFT metadata |
| Immutable sprite seed | Implemented in lab | Connect runtime `spriteSeed` to renderer/cache |
| Public thought/action stream | Partial | Add SSE/WebSocket endpoint |
| Loopr | Not now | Keep out of current build per plan |
