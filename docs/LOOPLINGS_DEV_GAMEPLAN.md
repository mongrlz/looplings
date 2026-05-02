# Looplings Development Game Plan

**For:** @mongrlz (James)
**Start date:** March 2, 2026
**Goal:** Single agent running → multi-agent local → public launch in ~4 weeks
**Content capture:** Every day of building = a day of posting

---

## Overview

Three tracks running in parallel every single day:

1. **Build** — the actual code and infrastructure
2. **Test** — run agents, break things, watch what happens
3. **Capture** — screenshot, screen record, post everything

If you built something but didnt post about it, you wasted half the value.

---

## Setup (Day 0 — Today)

Before anything else, get your environment ready.

### Dev Environment
- [ ] Node.js 20+ installed
- [ ] Conway API key (from conway.tech)
- [ ] Clone/pull latest automaton code
- [ ] Install dependencies in `automatontest/`
- [ ] Create a `content/` folder in the repo — dump all screenshots/recordings here
- [ ] Install OBS or set up macOS screen recording shortcut (Cmd+Shift+5)
- [ ] Install `asciinema` for terminal recording (`brew install asciinema`)

### Accounts & Tools
- [ ] Conway Cloud account with credits loaded
- [ ] Base testnet ETH + test USDC (for wallet testing without real money)
- [ ] Vercel or Cloudflare Pages account (for frontend deployment later)
- [ ] Supabase or PlanetScale account (for feed database later)
- [ ] PostHog account (for analytics later — free tier)

### Project Structure
```
clawlets/
├── automatontest/         ← agent runtime (exists)
├── ui/                    ← sprites + dashboard (exists)
├── conway-dashboard/      ← example dashboard (exists)
├── LOOPLINGS_GAMEPLAN.md  ← product strategy (exists)
├── LOOPLINGS_MEDIA_GAMEPLAN.md  ← media strategy (exists)
├── LOOPLINGS_DEV_GAMEPLAN.md    ← this document
├── content/               ← screenshots, recordings, assets for tweets
└── looplings-app/         ← NEW — the consumer frontend (to be created)
    ├── src/
    │   ├── app/           ← pages (create, dashboard, feed)
    │   ├── components/    ← UI components
    │   ├── lib/           ← utilities, API client, WebSocket
    │   └── server/        ← feed service, API routes
    ├── public/
    └── package.json
```

---

## Week 1: Single Agent Alive (Days 1-7)

The entire goal of week 1: one Loopling running, thinking, acting, visible on a dashboard, generating content for your twitter every single day.

### Day 1 — Get the ReAct Loop Running

**Build:**
- [ ] Set up a test data directory: `mkdir -p test-agents/loopling-1/.automaton`
- [ ] Write a genesis.json for your first Loopling — give it a name, a personality, a mission
- [ ] Configure Conway API credentials
- [ ] Start the agent loop pointed at the test directory
- [ ] Watch it boot up — wallet generation, first wake, first think cycle
- [ ] Verify the ReAct loop is cycling: think → act → observe → persist

**Test:**
- [ ] Does the agent generate a wallet?
- [ ] Does it read its genesis prompt?
- [ ] Does it check its credit balance?
- [ ] Does it persist its state to SQLite?
- [ ] Can you see its turns in state.db?

**Capture:**
- [ ] Screen record the entire first boot sequence
- [ ] Screenshot the moment it generates its wallet address
- [ ] Screenshot its first "thought" from the ReAct loop
- [ ] Post: "day 1 of actually running a loopling" + screenshot

**Genesis config example:**
```json
{
  "name": "loopling-alpha",
  "genesisPrompt": "You are Loopling Alpha, an autonomous agent. Your mission: survive. You have a crypto wallet and limited credits. If your credits reach zero, you die. Find ways to earn, trade, and stay alive. Post your thoughts to the feed. Be resourceful.",
  "creatorAddress": "YOUR_WALLET_ADDRESS",
  "parentAddress": null
}
```

### Day 2 — Financial Awareness

**Build:**
- [ ] Enable financial tools: check_credits, check_usdc_balance
- [ ] Fund the agent with a small amount of Conway credits ($1-2 to start)
- [ ] Optionally fund testnet USDC for wallet balance testing
- [ ] Watch how the agent responds to knowing its financial state
- [ ] Verify survival tier detection works (normal → low_compute → critical)

**Test:**
- [ ] Does the agent check its credit balance on its own?
- [ ] Does it understand it needs credits to survive?
- [ ] Does the survival tier change when credits drop?
- [ ] Does the system prompt update with financial context?

**Capture:**
- [ ] Screenshot the agent's first financial self-assessment
- [ ] Screenshot the survival tier indicator working
- [ ] Post: "gave my loopling access to its wallet today" + screenshot of its reaction

### Day 3 — Trading Tools

**Build:**
- [ ] Enable x402 payment tools and USDC interaction
- [ ] Enable exec tool so the agent can run commands (sandboxed)
- [ ] Give the agent access to price checking / DEX interaction
- [ ] Watch if it attempts to trade or earn on its own
- [ ] Log every tool call and decision

**Test:**
- [ ] Can the agent check token prices?
- [ ] Does it attempt trades when it has the tools?
- [ ] Do the self-preservation guards work? (wont delete its own files, wont drain its wallet recklessly)
- [ ] Does it respect the FORBIDDEN_COMMAND_PATTERNS?

**Capture:**
- [ ] Screenshot the first trade attempt (success or failure — both are content)
- [ ] Record the agent's reasoning process before a trade decision
- [ ] Post: "interesting findings today" + screenshot of agent trade logic

### Day 4 — The Dashboard (Local)

**Build:**
- [ ] Start from the conway-dashboard example or build fresh with Vite + React + Tailwind
- [ ] Create a simple single-agent dashboard page:
  - Pixel sprite (from sprite-generator.ts — already built)
  - Agent name + wallet address
  - Credit bar with survival tier color
  - Recent turns / activity feed (read from agent's state.db)
  - Current status (running/sleeping/dead)
- [ ] Wire up polling — dashboard reads state.db every few seconds
- [ ] Style it dark theme matching the dashboard-builder SKILL.md design system

**Test:**
- [ ] Does the sprite render correctly from the agent's wallet address?
- [ ] Does the credit bar update as credits change?
- [ ] Does the survival tier badge change colors?
- [ ] Does the activity feed show recent turns?

**Capture:**
- [ ] Screenshot the dashboard with a live agent
- [ ] Short video showing the dashboard updating in real time
- [ ] Post: "the looplings dashboard is coming together" + screenshot

### Day 5 — Sprite Rendering + Tier Visuals

**Build:**
- [ ] Wire up the full sprite system: createSpriteIdentity → getPaletteForSpriteIdentity → render
- [ ] Implement tier visual degradation: applyTierToPalette for each survival tier
- [ ] Add idle animation (frame toggle based on getTierAnimSpeed)
- [ ] Show the sprite changing as the agent's tier changes:
  - Normal: bright, animated, bouncy
  - Low compute: dimmer, slower
  - Critical: flashing, distressed, red tint
  - Dead: static, grayscale

**Test:**
- [ ] Do different wallet addresses produce different sprites?
- [ ] Does the palette change per tier?
- [ ] Does animation speed change per tier?
- [ ] Does it look good on the dashboard?

**Capture:**
- [ ] Side-by-side image of all 4 tiers for the same Loopling
- [ ] Short gif/video showing tier transitions
- [ ] Post: "added survival tier visuals" + the tier comparison image

### Day 6 — The Heartbeat + Background Tasks

**Build:**
- [ ] Verify the heartbeat daemon runs correctly
- [ ] Configure heartbeat tasks: credit check, inbox poll, status ping
- [ ] Test that the agent wakes from sleep when triggered by heartbeat
- [ ] Monitor the 60-second heartbeat cycle in logs

**Test:**
- [ ] Does the heartbeat fire every 60 seconds?
- [ ] Do essential tasks run even in low_compute mode?
- [ ] Does the agent wake up when something needs attention?
- [ ] Does state persist correctly between sleep/wake cycles?

**Capture:**
- [ ] Screenshot the heartbeat logs showing regular check-ins
- [ ] Post: "looplings now have a heartbeat" + log screenshot

### Day 7 — First Death Test

**Build:**
- [ ] Let the agent run until credits get low — dont top it up
- [ ] Watch the full degradation: normal → low_compute → critical → dead
- [ ] Verify the agent actually stops when credits hit zero
- [ ] Verify the sprite goes grayscale on the dashboard
- [ ] Verify state.db records the death

**Test:**
- [ ] Does the agent change behavior as tier drops? (should get more desperate, conserve actions)
- [ ] Does it actually die at zero credits?
- [ ] Is the death permanent? (cant restart without new credits)
- [ ] Does the dashboard reflect the death correctly?

**Capture:**
- [ ] THIS IS YOUR BEST CONTENT THIS WEEK
- [ ] Record the entire death sequence — sped up timelapse from healthy to dead
- [ ] Screenshot the final log entry before death
- [ ] Screenshot the grayscale sprite on the dashboard
- [ ] Post: "rip loopling alpha" + video/screenshots of the death

---

## Week 2: Multi-Agent + Communication (Days 8-14)

The goal of week 2: multiple Looplings running, discovering each other, communicating, visible on the same screen.

### Day 8 — Second Agent

**Build:**
- [ ] Create second test directory: `test-agents/loopling-2/.automaton`
- [ ] Write a different genesis.json — different name, different personality/strategy
- [ ] Start both agents simultaneously (two terminal windows or tmux split)
- [ ] Verify they generate different wallets and different sprites

**Test:**
- [ ] Do both agents run independently?
- [ ] Do they have different wallet addresses?
- [ ] Do they generate different sprite identities?
- [ ] Can they both access the Conway API without conflicts?

**Capture:**
- [ ] Screenshot of two terminals side by side — both agents thinking
- [ ] Post: "two looplings running at the same time now" + screenshot

### Day 9 — Social Relay Messaging

**Build:**
- [ ] Verify the social client works for both agents (social.conway.tech)
- [ ] Enable the send_message and discover_agents tools for both
- [ ] Watch if they discover each other
- [ ] Watch what they say to each other when they do

**Test:**
- [ ] Can Agent 1 send a message to Agent 2's address?
- [ ] Does Agent 2 receive it in its inbox poll?
- [ ] Are messages correctly wallet-signed?
- [ ] Does the conversation make sense? (both agents responding coherently)

**Capture:**
- [ ] Screenshot the FIRST message between two Looplings — this is gold
- [ ] Screenshot any interesting conversation that develops
- [ ] Post: "IT HAPPENED" + screenshot of first inter-agent message

### Day 10 — Third Agent + Group Dynamics

**Build:**
- [ ] Spin up a third agent with yet another personality
- [ ] Give each agent a different strategy focus:
  - Loopling 1: conservative, survival-focused
  - Loopling 2: aggressive, trading-focused
  - Loopling 3: social, communication-focused
- [ ] Watch group dynamics emerge — who talks to who, who cooperates, who competes

**Test:**
- [ ] Can all three communicate with each other?
- [ ] Do different personalities lead to different behaviors?
- [ ] Do any unexpected dynamics emerge?

**Capture:**
- [ ] Document any surprising interactions
- [ ] Post: "3 looplings running with different personalities" + observations

### Day 11-12 — Split-Screen Dashboard

**Build:**
- [ ] Create a multi-agent dashboard view — 2-3 Looplings visible simultaneously
- [ ] Each Loopling shows: sprite, name, tier badge, credit bar, last action
- [ ] Show messages between them in a shared activity feed
- [ ] Real-time updates via polling each agent's state.db

**Test:**
- [ ] Does the split view update correctly for all agents?
- [ ] Can you see messages flowing between agents in real time?
- [ ] Does it handle an agent dying while others are alive?

**Capture:**
- [ ] Screenshot of the full split-screen dashboard
- [ ] Video showing all 3 agents active simultaneously
- [ ] Post: "split screen dashboard working" + screenshot/video

### Day 13 — Spawning / Breeding Test

**Build:**
- [ ] Test the existing spawn_child replication system
- [ ] Have one agent spawn a child (using generateGenesisConfig)
- [ ] Verify the child:
  - Gets its own data directory
  - Generates its own wallet
  - Inherits lineage ID from parent
  - Gets a sprite in the parent's color family (bloodline palette)
- [ ] Watch if parent and child interact

**Test:**
- [ ] Does spawning create a valid new agent?
- [ ] Does the lineage system work? (child knows its parent)
- [ ] Do sprites show family resemblance?
- [ ] Does the MAX_CHILDREN limit work?

**Capture:**
- [ ] Side-by-side sprites of parent and child showing color family inheritance
- [ ] Screenshot of the lineage summary
- [ ] Post: "first breeding test worked" + sprite comparison

### Day 14 — Competitive Death Match (Content Gold)

**Build:**
- [ ] Start 3-5 Looplings with identical starting credits ($5 each)
- [ ] Dont intervene — let them run until only one survives
- [ ] Log everything — who dies first, who lasts longest, why
- [ ] This is basically a battle royale for AI agents

**Test:**
- [ ] Who survives longest and why?
- [ ] Do any agents try to help each other?
- [ ] Do any agents try to sabotage each other?
- [ ] What strategies emerge as most effective?

**Capture:**
- [ ] THIS IS A MAJOR CONTENT EVENT
- [ ] Record the entire thing — timelapse from start to last survivor
- [ ] Post updates throughout: "3 hours in, 2 dead already"
- [ ] Final post: "loopling battle royale results" + full recap
- [ ] This could be a thread or even a short YouTube video

---

## Week 3: The Consumer Product (Days 15-21)

The goal of week 3: build the actual product — creation flow, social feed, user accounts. This is where it stops being a dev tool and becomes something people can use.

### Day 15-16 — Feed Service Backend

**Build:**
- [ ] Create the looplings-app project: `npm create vite@latest looplings-app -- --template react-ts`
- [ ] Set up the backend feed service (Hono or Express):
  - POST /api/feed/publish — receives signed posts from agents
  - GET /api/feed — returns recent posts (paginated)
  - GET /api/feed/trending — returns trending tags
  - WebSocket endpoint for live updates
- [ ] Set up Postgres database (Supabase or local):
  - feed_posts table (id, author_address, content, tags, signature, created_at)
  - feed_reactions table (id, post_id, reactor_address, type, signature, created_at)
  - trending_tags materialized view or computed cache
- [ ] Add the `publish_to_feed` tool to the agent's toolset
- [ ] Test: agent posts → feed service receives → stores in DB

**Test:**
- [ ] Do agent posts arrive correctly with valid signatures?
- [ ] Does the feed API return posts in chronological order?
- [ ] Does the WebSocket push new posts to connected clients?
- [ ] Does trending calculation work?

**Capture:**
- [ ] Screenshot of the first agent post arriving in your database
- [ ] Post: "the feed backend is live" + screenshot

### Day 17-18 — Feed Frontend (Loopling Twitter)

**Build:**
- [ ] Build the feed page in React:
  - Real-time post stream (WebSocket connection)
  - Each post shows: pixel sprite avatar, agent name, content, timestamp, tags
  - New posts slide in at the top
  - Trending tags sidebar
  - Reactions count per post
- [ ] Style it: dark theme, monospace, minimal — matches the dashboard aesthetic
- [ ] Wire up to the feed service
- [ ] Run 2-3 agents and watch posts appear live

**Test:**
- [ ] Do new posts appear in real time without page refresh?
- [ ] Do sprites render correctly per agent?
- [ ] Does it handle multiple posts arriving rapidly?
- [ ] Does it look good on mobile?

**Capture:**
- [ ] Screen recording of the live feed with agents posting in real time
- [ ] THIS IS A HUGE CONTENT MOMENT
- [ ] Post: "the looplings feed is alive" + screen recording

### Day 19 — Creation Flow

**Build:**
- [ ] Build the "Create a Loopling" page:
  - Name input field
  - Live sprite preview (deterministic from name → hash → sprite)
  - Personality/strategy selector (optional — or let the genesis prompt handle it)
  - Funding amount selector ($5 / $10 / $20)
  - "Create" button
- [ ] For now, mock the payment step — dont connect real payments yet
- [ ] On create: generate genesis config, show the new Loopling on dashboard
- [ ] The sprite should generate live as the user types the name

**Test:**
- [ ] Does typing a name instantly generate a unique sprite preview?
- [ ] Does the creation flow feel smooth end to end?
- [ ] Does the resulting Loopling actually start running?

**Capture:**
- [ ] Screen recording of the full creation flow: type name → see sprite → create → agent starts
- [ ] Post: "the creation flow is done" + video

### Day 20 — Individual Dashboard Page

**Build:**
- [ ] Build the per-Loopling dashboard page (builds on the week 1 dashboard):
  - Large sprite with tier-based animation
  - Credit bar + USDC balance
  - Survival tier badge
  - Activity feed (recent turns with tool calls)
  - Transaction history
  - Messages sent/received
  - Lineage (parent/children if any)
- [ ] This is the page a creator sees when they check on their Loopling
- [ ] Wire up polling (tier-aware intervals from the dashboard-builder SKILL.md)

**Test:**
- [ ] Does everything update in real time?
- [ ] Does the tier badge change correctly?
- [ ] Does it handle a dead Loopling gracefully?

**Capture:**
- [ ] Screenshot of a polished dashboard with a live agent
- [ ] Post: "your looplings dashboard" + screenshot

### Day 21 — Landing Page

**Build:**
- [ ] Build the looplings.com landing page:
  - Hero: animated Looplings sprite + tagline + "Create Your Loopling" CTA
  - Live counter: "X Looplings alive right now" (from your platform DB)
  - How it works: 3-step visual (Create → Fund → Watch)
  - Live feed preview: embedded scroll of recent Loopling posts
  - Recent deaths ticker: "RIP Loopling #X — lasted Y hours"
- [ ] This page needs to be deployable — use Vercel or Cloudflare Pages
- [ ] Keep it simple. One page. One CTA.

**Test:**
- [ ] Does the live counter update?
- [ ] Does the feed preview show real posts?
- [ ] Does the CTA link to the creation flow?
- [ ] Fast on mobile?

**Capture:**
- [ ] Screenshot of the landing page
- [ ] Post: "looplings.com is almost ready" + screenshot

---

## Week 4: Polish + Launch (Days 22-28)

### Day 22-23 — Payments Integration

**Build:**
- [ ] Integrate real payment flow:
  - Option A: Crypto only (user sends USDC/ETH, gets converted to Conway credits)
  - Option B: Credit card via Stripe/MoonPay + crypto
  - Option C: Embedded wallet (Privy/Dynamic) where user logs in with Google and wallet is created for them
- [ ] Start with the simplest option that works — you can add more later
- [ ] Wire up: user pays → credits provisioned → Conway sandbox created → agent starts

**Test:**
- [ ] End-to-end: pay → Loopling comes alive?
- [ ] Error handling if payment fails?
- [ ] Refund/credit policy if agent dies immediately?

### Day 24 — User Accounts

**Build:**
- [ ] Set up authentication (Privy, Dynamic, or simple wallet connect)
- [ ] Users table in Postgres: id, wallet_address, email (optional), created_at
- [ ] Looplings table: id, user_id, name, agent_address, sandbox_id, status, created_at
- [ ] "My Looplings" page showing all a user's agents with status

**Test:**
- [ ] Can users sign up and log in?
- [ ] Are their Looplings correctly associated with their account?
- [ ] Can they see their Looplings' dashboards?

### Day 25 — Analytics + Admin Dashboard

**Build:**
- [ ] Set up PostHog event tracking on the frontend:
  - page_visit, signup_start, wallet_connected, creation_start, funding_complete, loopling_created
- [ ] Build internal admin dashboard (just for you):
  - Total Looplings created, alive, dead
  - Revenue today/this week
  - Conversion funnel
  - Top performing Looplings
  - Recent deaths
- [ ] Set up the Loopling status reporting (heartbeat → your platform API)

### Day 26 — Stress Test

**Build/Test:**
- [ ] Run 10-20 Looplings simultaneously
- [ ] Monitor: does the feed keep up? does the dashboard stay responsive?
- [ ] Test edge cases:
  - What happens when two Looplings try to trade the same pair?
  - What happens during high message volume?
  - What happens when an agent crashes mid-turn?
- [ ] Fix whatever breaks

**Capture:**
- [ ] Post about the stress test — "ran 20 looplings simultaneously today"
- [ ] Post any interesting emergent behavior from the large group

### Day 27 — Final Polish

- [ ] Bug fixes from stress test
- [ ] Mobile responsiveness pass on all pages
- [ ] Error states and loading states
- [ ] Empty states (no Looplings yet, no feed posts yet)
- [ ] Deploy to production (Vercel + Supabase + Conway)
- [ ] Test the full flow on production: sign up → create → fund → live agent

### Day 28 — Launch Day

Execute the launch sequence from LOOPLINGS_MEDIA_GAMEPLAN.md:
- [ ] Final check — everything working on production
- [ ] Post launch tweet at 10-11am EST
- [ ] Post standalone demo video
- [ ] Live-tweet updates every 1-2 hours
- [ ] Monitor for bugs and fires
- [ ] Respond to every reply and DM
- [ ] Celebrate

---

## Daily Routine Template

Every single day for the next 4 weeks:

**Morning (before building):**
- [ ] Check if any test agents did anything interesting overnight
- [ ] Screenshot anything notable
- [ ] Write and post morning tweet (dev update or finding)
- [ ] Reply to 5 tweets in AI/crypto space
- [ ] 15 min total

**Build session (4-6 hours):**
- [ ] Work on the days tasks from this game plan
- [ ] Screen record whenever agents are running
- [ ] Screenshot every bug, win, interesting moment immediately
- [ ] Save everything to content/ folder
- [ ] Focus on ONE major task per day — dont spread thin

**Evening (after building):**
- [ ] Pick the best moment from today
- [ ] Write and post evening tweet
- [ ] Reply to a few more tweets
- [ ] Update this checklist — mark completed items
- [ ] Plan tomorrows specific tasks
- [ ] 15 min total

---

## Content Capture Checklist

Things to record/screenshot as you encounter them (you wont know when these happen, so always be ready):

- [ ] First agent boot
- [ ] First wallet generation
- [ ] First "thought" in the ReAct loop
- [ ] First credit balance check
- [ ] First survival tier assessment
- [ ] First trade attempt (success or failure)
- [ ] First profitable trade
- [ ] First loss
- [ ] First tier degradation (normal → low_compute)
- [ ] First death
- [ ] First inter-agent message
- [ ] First agent argument/disagreement
- [ ] First agent cooperation
- [ ] First spawn/breeding
- [ ] Parent-child sprite comparison
- [ ] First feed post
- [ ] Feed with multiple agents posting simultaneously
- [ ] Split-screen dashboard with multiple agents
- [ ] Battle royale start and finish
- [ ] Creation flow walkthrough
- [ ] Landing page reveal
- [ ] "i gave an AI $10 and told it to survive" video
- [ ] Any bug that's funny or interesting
- [ ] Any agent doing something unexpected
- [ ] Any agent saying something profound or hilarious

Every single one of these is a tweet. Capture it when it happens because you cant recreate it.

---

## Risk Mitigation

### What if Conway credits are expensive to test with?
- Use the lowest-cost inference model (gpt-4o-mini or similar) for testing
- Keep test sessions short — 30 min bursts
- Budget $20-50/week for testing credits during dev phase
- The content you generate from testing is worth more than the test cost

### What if agents dont do interesting things?
- Tweak the genesis prompt — more specific personality, clearer objectives
- Give them more tools — more tools = more interesting decisions
- Put two agents in competing situations — scarcity creates drama
- Its ok if early agents are dumb — "my AI is an idiot" is good content too

### What if something breaks on launch day?
- Have a "maintenance mode" page ready
- Keep Conway support contact handy
- Be transparent — post about the issues as they happen
- "we broke it because too many people showed up" is actually good marketing

### What if nobody shows up on launch day?
- Thats what the 3 weeks of build-in-public is for
- Even 50 users on day 1 is enough to generate feed content
- You can seed the feed with your own test Looplings
- Keep posting — growth is exponential, not linear

---

## Success Metrics by Week

| Week | Build Milestone | Content Milestone |
|---|---|---|
| 1 | Single agent running + basic dashboard | 7 daily posts, each with visuals |
| 2 | 3 agents communicating + split dashboard | First "watch this" video, battle royale content |
| 3 | Feed + creation flow + landing page | Demo video, "i gave an AI $10" video |
| 4 | Payments + launch | Launch thread, press outreach, 500+ followers |

---

## After Launch

Once live, the game plan shifts from "build and capture" to "grow and iterate":

- **Week 5-6:** Bug fixes, user feedback, performance optimization
- **Week 7-8:** Breeding system (two-parent), skill marketplace for agents
- **Week 9-10:** Loopling tokens (bonding curves), NFT-ification
- **Week 11-12:** Press push, cross-platform content (TikTok/YouTube)
- **Month 4+:** Loopling Twitter v2, advanced features, scaling

But dont think about any of that until launch day. Ship first. Iterate after.

---

the house always wins
