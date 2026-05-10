# Looplings Build Sequence

This is the current practical sequence for the hackathon build. It keeps the
visible demo, runtime research, and future platform work from stepping on each
other.

## Phase 0: Clean Baseline

Goal: make `main` easy to trust before deeper work starts.

- Keep the root app as the Vite/R3F frontend.
- Keep generated output and local runtime experiments out of commits.
- Document the runtime lab under `apps/runtime`.
- Verify `npm run build` before major checkpoints.

## Phase 1: Runtime Surgery Lab

Goal: learn from Hermes and Conway without making this repo depend on either
whole upstream project.

Local-only layout:

```txt
apps/runtime/
  upstreams/
    hermes-agent/
    automaton/
  looplings-core/
```

Use the upstream clones as reference material. Port only the concepts and
module slices that Looplings needs into `looplings-core`.

Initial extraction targets:

| Source | What to study |
| --- | --- |
| Hermes | skills, memory, OpenRouter/provider routing, MCP, profiles, tool/plugin architecture |
| Conway | wallet identity, heartbeat, compute runway, survival tiers, SOUL, death/replication mechanics |
| Looplings | owner-but-not-controller rules, creature identity, profit policy, frontend state contract |

## Phase 2: Prime Room

Goal: finish the visible 3D room before live runtime wiring.

- Build the room around Prime and the Steam Deck-style device.
- Keep Prime's screen HTML/CSS-driven so it can later be fed by runtime state.
- Preserve this `state → HTML/CSS visual surface` pattern for the future
  media engine described in `docs/LOOPLINGS_MEDIA_ENGINE.md`.
- Place room props and interaction affordances after the core composition works.
- Use mocked state until the runtime contract is ready.

## Phase 3: Prime Runtime Contract

Goal: connect the finished room to the runtime through a narrow adapter.

The frontend should consume a stable Prime state shape:

```ts
interface PrimeRuntimeState {
  identity: {
    name: string;
    walletAddress: string;
  };
  model: {
    provider: string;
    name: string;
  };
  compute: {
    runwaySeconds: number;
    tier: "normal" | "low_compute" | "critical" | "dead";
  };
  tools: string[];
  thoughts: Array<{
    id: string;
    text: string;
    createdAt: string;
  }>;
  actions: Array<{
    id: string;
    label: string;
    status: "thinking" | "running" | "succeeded" | "failed";
    createdAt: string;
  }>;
}
```

The first adapter can be mocked. The second adapter can read from local
`looplings-core`. The frontend should not care which runtime powers it.

## Not Yet

- Do not build Loopr yet.
- Do not wire Prime live before the room is ready.
- Do not commit cloned Hermes or Conway source dumps.
- Do not introduce new dependencies without checking whether the existing
  stack already solves the problem.
- Do not add Remotion/HTML-to-video-style rendering until deterministic React
  media templates are proven in-app.
