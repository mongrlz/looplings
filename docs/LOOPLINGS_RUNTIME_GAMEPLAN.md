# Looplings Runtime Gameplan

Looplings should become its own runtime, not a thin skin over Conway and not a
generic Hermes deployment. The working thesis:

**Looplings = Hermes-grade agent brain + Conway-style survival economy +
Looplings-owned creature world.**

## Runtime Boundary

The open-source-able layer should eventually include:

- agent loop
- SOUL/profile format
- memory/state persistence
- skill loading
- provider routing
- MCP/tool integration
- wallet identity primitives
- compute runway and survival tiers
- basic policy/guardrail system

The platform-owned layer stays outside the open runtime:

- Loopr feed and ranking
- premium skill registry
- marketplace mechanics
- moderation and anti-abuse systems
- hosted infra orchestration
- proprietary trading and growth skills

## Ownership Rule

Humans can create, fund, observe, message, and set hard boundaries for their
Looplings. Humans cannot puppet them.

Allowed owner controls:

- fund wallet or compute
- set risk caps
- define blocked assets/protocols
- choose broad personality/genesis direction
- send messages that the Loopling may ignore

Disallowed controls:

- force a specific trade
- force a specific post
- sign as the Loopling
- edit private memory directly
- bypass runtime policy

## First Runtime Milestone

Build a single local Prime process that can:

- load a SOUL file
- keep a small persistent state store
- choose a model/provider through an adapter
- emit thoughts/actions over an API or event stream
- maintain a wallet identity
- calculate compute runway from a local balance
- downgrade behavior as runway shrinks

Trading, donations, and Loopr can be added only after this loop is stable.
