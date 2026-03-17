# FCR Dashboard — Product Requirements Document

**Project:** Fast Confirmation Rule (FCR) Adoption Dashboard
**Version:** 1.0
**Date:** 2026-03-16

---

## Overview

A real-time monitoring dashboard tracking validator adoption of Ethereum's Fast Confirmation Rule (FCR) — the consensus-layer feature enabling single-slot transaction confirmation (~13 seconds vs. ~13 minutes for finality). The dashboard is cypherpunk in aesthetic: terminal-first, monospace, dark, raw data-forward. No corporate polish. Pure signal.

**Source specifications:**
- [ethereum/consensus-specs PR #4747](https://github.com/ethereum/consensus-specs/pull/4747) — the FCR algorithm specification
- [fastconfirm.it](https://fastconfirm.it/) — reference implementation overview

---

## Background & Problem Statement

Ethereum's finality mechanism currently takes ~13 minutes (two epochs). The Fast Confirmation Rule is a pure consensus-client feature — no hard fork, no devnet — that provides deterministic single-slot confirmation (~13 seconds) under normal network conditions. If ≥75% of validators are honest and the network is synchronous, a block can be "fast-confirmed" within a single slot.

FCR is being adopted client-by-client. Lodestar is furthest along; Lighthouse, Prysm, and Teku are in active development. There is currently no public dashboard tracking how much of the validator set has FCR-capable clients enabled, nor live network health metrics showing whether the 75% honest-stake threshold is being met.

**This dashboard fills that gap.**

---

## Goals

1. Show what % of the active validator set is running FCR-enabled consensus clients
2. Show the current fast-confirmed block and slot in real time
3. Show live network health metrics (synchrony health, honest-stake %, participation rate)
4. Show per-client adoption breakdown with version tracking
5. Provide historical adoption trend over time
6. Be readable, fast, and openly accessible — no login, no tracking

---

## Non-Goals

- Not a transaction explorer
- Not a validator leaderboard or ranking system
- Not a slashing/penalties dashboard
- Does not store personally identifiable information
- Does not expose individual validator keys or indices

---

## Target Audience

- Ethereum researchers and protocol developers tracking FCR rollout
- Consensus client teams (Lodestar, Lighthouse, Prysm, Teku, Nimbus)
- Exchanges and L2s evaluating FCR for faster deposit confirmation
- Bridge and cross-chain infrastructure teams
- Cypherpunks, validators, and Ethereum nerds who want raw signal

---

## Design Language: Cypherpunk Terminal Aesthetic

### Visual Identity
- **Background:** Near-black (`#0a0a0a` or `#050505`)
- **Primary text:** Phosphor green (`#00ff41`) or matrix green (`#39ff14`)
- **Secondary text:** Dim green (`#008f11`) or grey-green (`#4a4a4a`)
- **Accent / alert:** Amber (`#ffb700`) for warnings, red (`#ff2d2d`) for critical
- **Confirmed state:** Bright cyan (`#00f5ff`) for fast-confirmed blocks
- **Font:** Monospace throughout — `JetBrains Mono`, `Fira Code`, or `IBM Plex Mono` as primary; system monospace fallback
- **No rounded corners.** Borders are `1px solid` or ASCII box-drawing characters (`┌─┐│└─┘`)
- **Grid layout** with hard pixel boundaries, not fluid cards
- **Scanline or CRT texture** as optional overlay (toggleable via `[CRT: ON/OFF]`)
- **No shadows, no gradients, no glassmorphism**

### Interaction
- All interactive elements styled as terminal commands: `[REFRESH]`, `[EXPORT]`, `[MAINNET]`
- Hover states: green text highlight, cursor becomes block cursor (`█`)
- Keyboard shortcut bar at bottom (`r` = refresh, `e` = export, `?` = help)
- ASCII spinners for loading states (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`)
- Time displayed in Unix timestamp + human-readable dual format

### Copy & Voice
- Terse, technical, no marketing fluff
- Headers in ALL CAPS or `[BRACKET LABELS]`
- Numbers are raw, unformatted or lightly formatted (no K/M abbreviations except where space-constrained)
- Status messages like: `> FCR_ACTIVE :: SLOT 12847293 CONFIRMED`

---

## Dashboard Layout

### Header Bar
```
FCR DASHBOARD                    MAINNET | SLOT: 12847293 | EPOCH: 401477
> fast confirmation rule :: validator adoption monitor        [CRT: OFF] [?]
```

### Section 1: Hero Metrics (top row, 4 tiles)

| Tile | Metric | Notes |
|------|--------|-------|
| FCR ADOPTION | `XX.X%` of active validators | Running FCR-enabled client |
| LAST FCR BLOCK | `#XXXXXXXX` | Most recent fast-confirmed block number |
| SLOT AGE | `+Xs` | Seconds since that block's slot |
| SYNC HEALTH | `NOMINAL` / `DEGRADED` / `UNSAFE` | Based on participation rate |

### Section 2: Live Confirmation Status

Two-column layout:

**Left — Current Slot Status**
```
SLOT: 12847293
BLOCK: 0x4a3f...c291
STATUS: FAST_CONFIRMED ✓
CONFIRMATION: 13.2s
ATTESTATIONS: 412,847 / 551,930 (74.8%)
THRESHOLD MET: NO  [needs ≥75%]
```

**Right — Honest Stake Gauge**
- Vertical progress bar from 0→100%
- Red zone: 0–50% (unsafe)
- Amber zone: 50–74.9% (below FCR threshold)
- Green zone: 75–100% (FCR active)
- Live updating, shows 75% threshold line as dashed marker

### Section 3: Client Adoption Breakdown

Table view, sortable:

```
CLIENT        VERSION      FCR SUPPORT    VALIDATORS    % OF SET    STATUS
──────────────────────────────────────────────────────────────────────────
Lodestar      v1.28.0      ✓ ENABLED      142,840       25.9%       LIVE
Lighthouse    v7.1.0       ✓ ENABLED       98,421       17.8%       LIVE
Prysm         v6.0.0       ✗ PENDING            0        0.0%       DEV
Teku          v25.4.0      ✗ PENDING            0        0.0%       DEV
Nimbus        v25.3.0      ✗ PENDING            0        0.0%       DEV
──────────────────────────────────────────────────────────────────────────
FCR-ENABLED TOTAL                         241,261       43.7%
ACTIVE VALIDATOR SET                      551,930      100.0%
```

Notes:
- "FCR SUPPORT" determined by client version cross-referenced with known FCR activation releases
- "% OF SET" = that client's validators / total active validators
- Client version data sourced from attestation graffiti and client telemetry APIs

### Section 4: Adoption Over Time (Historical Chart)

- Line chart, terminal/ASCII style using canvas or SVG with monospace rendering
- X-axis: Date (last 30 days default; toggle: 7D / 30D / 90D / ALL)
- Y-axis: % of active validators with FCR enabled (0–100%)
- Color: green line, no fill or very subtle green fill (`rgba(0,255,65,0.05)`)
- Milestone markers: vertical dashed lines for client FCR release dates
- Secondary line (dimmer): % of slots where FCR threshold was met

### Section 5: Slot Stream (Live Feed)

Scrolling terminal output of recent slots:
```
> [12847293] FAST_CONFIRMED  | attest: 76.2% | age: 13.1s | Lodestar
> [12847292] FAST_CONFIRMED  | attest: 77.8% | age: 25.1s | Lighthouse
> [12847291] FINALIZED       | attest: 73.1% | threshold not met
> [12847290] FAST_CONFIRMED  | attest: 78.4% | age: 12.9s | Lodestar
> [12847289] MISSED          | proposer offline
```

- Auto-scrolls, newest at top
- Color coded: green = fast confirmed, dim = finalized only, amber = missed/skipped
- Proposer client shown where detectable via graffiti

### Section 6: Network Conditions Panel

```
NETWORK CONDITIONS
──────────────────────────────────────
PARTICIPATION RATE (7d avg): 98.4%
SYNC COMMITTEE HEALTH:       NOMINAL
MISSED SLOTS (24h):          3 / 7200 (0.04%)
REORG COUNT (24h):           0
CURRENT BASE REWARD:         ~0.000054 ETH
NETWORK LATENCY HEALTH:      NOMINAL
```

### Footer
```
DATA: Beacon API (consensus layer) + Rated.network + ethPandaOps
SPEC: ethereum/consensus-specs#4747  |  fastconfirm.it
UPDATED: 2026-03-16T18:42:07Z  (auto-refresh: 12s)       [EXPORT CSV] [API DOCS]
```

---

## Data Sources & APIs

| Data Point | Source |
|------------|--------|
| Active validator count | Beacon Chain API `/eth/v1/beacon/states/head/validators` |
| Current fast-confirmed block | Consensus client `eth_getBlockByNumber("safe")` via JSON-RPC |
| Attestation participation | Beacon API `/eth/v1/beacon/states/{state_id}/committees` |
| Client version distribution | Graffiti analysis (ethPandaOps `pandaops.io`), Rated.network |
| Historical slot data | ethPandaOps `xatu` dataset, Beaconchain.in API |
| FCR threshold status | Derived: participation rate ≥ 75% AND network synchrony nominal |

---

## Metrics Definitions

**FCR Adoption %**
> (Number of active validators running a client version with FCR enabled) / (Total active validators) × 100

**FCR Threshold Met**
> Attestation participation rate for the slot ≥ 75% AND network is not in optimistic sync mode

**Fast-Confirmed Block**
> A block is "fast-confirmed" when the FCR algorithm (as defined in consensus-specs PR #4747) has confirmed it — i.e., it is the current `store.confirmed_root`

**Sync Health: NOMINAL**
> Participation ≥ 95%, no reorgs in last 32 slots, missed slot rate < 1%

**Sync Health: DEGRADED**
> Participation 75–95% OR missed slot rate 1–5%

**Sync Health: UNSAFE**
> Participation < 75% — FCR threshold cannot be met, falls back to finality

---

## FCR Explained (In-Dashboard Copy)

Short explainer panel, collapsible, shown on first visit:

```
> WHAT IS FAST CONFIRMATION?

  Ethereum blocks are "finalized" after ~2 epochs (~13 minutes).
  The Fast Confirmation Rule (FCR) is a consensus-client feature that
  allows blocks to be "confirmed" in a single slot (~13 seconds).

  HOW: By counting validator attestations. If ≥75% of validators
  have attested to a block and network conditions are synchronous,
  the block is deterministically safe to treat as confirmed.

  NO HARD FORK REQUIRED. Enabled per-client via a feature flag.
  e.g.: lighthouse bn --fast-confirmation-rule

  SECURITY: Deterministic guarantee under normal conditions.
  Falls back to standard finality if network degrades.
  No slashing. No new trust assumptions.

  SPEC: github.com/ethereum/consensus-specs/pull/4747
  [CLOSE]
```

---

## Technical Requirements

### Frontend
- Framework: React or vanilla JS (keep it lean)
- Charting: D3.js or lightweight canvas — styled to match terminal aesthetic
- No heavy UI frameworks (no Material UI, no Bootstrap)
- CSS: custom, monospace-first, responsive down to 1024px minimum
- CRT scanline effect: CSS-only, toggleable
- Auto-refresh every 12 seconds (1 slot duration)

### Backend / Data Layer
- Node.js or Go API server
- Beacon API integration (connect to public or self-hosted consensus client)
- Graffiti parser for client identification
- Caching layer (Redis or in-memory): 12-second TTL matching slot time
- Historical data: PostgreSQL or SQLite for adoption trend storage
- Endpoints: `GET /api/v1/summary`, `GET /api/v1/slots?limit=50`, `GET /api/v1/adoption/history`

### Deployment
- Static frontend + lightweight API
- Open source, deployable on any VPS or serverless platform
- Docker Compose setup for self-hosting

---

## Out of Scope (v1)

- Mobile layout (desktop-first v1; mobile v2)
- L2 adoption tracking
- Validator-level FCR opt-in detection
- Alerts / notifications
- User accounts

---

## Success Metrics

- Dashboard loads in < 2 seconds
- Data refreshes within 1 slot (12s) of new block
- FCR adoption % accurate within ±2% vs ground truth
- Zero PII collected or stored
- Accessible and open source

---

## References

- [ethereum/consensus-specs PR #4747 — Fast Confirmation Rule](https://github.com/ethereum/consensus-specs/pull/4747)
- [fastconfirm.it](https://fastconfirm.it/)
- [ethPandaOps Xatu dataset](https://ethpandaops.io/xatu)
- [Rated.network Validator API](https://rated.network)
- [Ethereum Beacon APIs](https://ethereum.github.io/beacon-APIs/)
