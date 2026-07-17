# FCR Dashboard

Real-time monitoring dashboard for Ethereum's **Fast Confirmation Rule (FCR)** — tracking live attestation participation against the FCR threshold, client implementation readiness, and network health.

FCR enables single-slot transaction confirmation (~13 seconds) without a hard fork. Assuming network synchrony and <25% adversarial stake — i.e. ≥75% of stake honest **and attesting** — a block attested to by that supermajority is deterministically safe to treat as confirmed, no waiting for 2-epoch finality (~13 minutes).

**Spec:** [ethereum/consensus-specs#4747](https://github.com/ethereum/consensus-specs/pull/4747) (merged Apr 2026) · **Info site:** [fastconfirm.it](https://fastconfirm.it/)

**Live:** https://fcrdashboard.vercel.app/

---

## What It Shows

- **Attestation participation** — % of expected attesters included on-chain per slot, measured directly from attestation aggregation bitfields. This is the observable proxy for FCR's ≥75% honest-and-attesting stake assumption.
- **Live slot feed** — real-time stream with `FAST_CONF_EST` / `FINALIZED` / `PENDING` / `LOW_PARTICIP` / `MISSED` status per slot
- **Client FCR implementation status** — per-team progress (Lodestar, Lighthouse, Teku, Prysm, Nimbus, Grandine), plus a graffiti-identified sample of recent proposers
- **History** — 90-day chart of measured participation vs the 75% threshold, with graffiti-based client-adoption estimate
- **Network conditions** — window participation, missed slots, finalized/justified epochs, active validator estimate

Data refreshes every 12 seconds (one slot). No client has FCR enabled in a production release yet — the dashboard shows whether the network currently *satisfies the rule's participation assumption*, and tracks implementation progress.

---

## Data Sources

| Data | Source | How |
|------|--------|-----|
| Slot / epoch / block / execution payload | [PublicNode Beacon API](https://ethereum-beacon-api.publicnode.com) | `/eth/v1/beacon/headers/head`, `/eth/v2/beacon/blocks/{slot}` |
| Attestation participation | Beacon API block bodies | Set bits ÷ bitlist length of Electra `aggregation_bits` (attestations for slot N are included in block N+1) |
| Active validator count | Derived | attestation bitlist length × 32 slots/epoch |
| Finality checkpoints | Beacon API | `/eth/v1/beacon/states/head/finality_checkpoints` |
| Client sample | Block graffiti | Lower-bound estimate — most proposers set no identifying graffiti |
| Client FCR stages | [ethereum/pm FCR breakout calls](https://github.com/ethereum/pm/issues/1982) | Static constants in `api/v1/summary.js` (`CLIENT_META`, dated) — update after each breakout call |

---

## Stack

- **Frontend:** React + Vite, terminal/cypherpunk aesthetic, no UI frameworks
- **API:** Vercel serverless functions (Node 20)
- **No database** — all data fetched live from the public Beacon API

---

## Local Development

```bash
# Install dependencies
cd client && npm install

# Run dev server
npm run dev
```

The frontend runs at `http://localhost:5173`. API calls (`/api/v1/*`) proxy to the Vercel dev runtime — to run those locally you need the Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

To toggle between mock data and live data, edit `client/src/hooks/usePolling.js`:

```js
const USE_MOCK = false  // true = mock data, false = real API
```

---

## Deployment (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Icedcool/fcrdashboard)

Or manually:

```bash
vercel --prod
```

No environment variables are required — the API defaults to PublicNode. Optionally point at any standard Beacon API node (e.g. your own, or a provider like Alchemy):

```bash
vercel env add BEACON_API_URL     # default: https://ethereum-beacon-api.publicnode.com
```

See `.env.example` for reference.

---

## API Endpoints

All endpoints are cached at the edge (`s-maxage=12` for slot data, `s-maxage=300` for history). On upstream failure, handlers return the last successful response.

### `GET /api/v1/summary`
Current network snapshot.

```json
{
  "slot": 14782384,
  "epoch": 461949,
  "blockHash": "0x7d02...4fae",
  "blockNumber": 25545871,
  "slotTime": 1784212631000,
  "participation": {
    "pct": 99.7, "attesting": 27456, "committeeMembers": 27526,
    "refSlot": 14782383, "windowPct": 99.5, "windowSlots": 20
  },
  "attestationPct": 99.7,
  "totalValidators": 880832,
  "thresholdMet": true,
  "syncHealth": "NOMINAL",
  "finality": { "justifiedEpoch": 461948, "finalizedEpoch": 461947, "finalizedSlotsBack": 49 },
  "adoption": { "sampleSize": 20, "identified": 2, "unknown": 18 },
  "clients": [
    { "name": "Lodestar", "fcrStage": "STAGING", "stageNote": "spec tests passing; deploying to staking environment", "sampleBlocks": 1, "samplePct": 5.0 },
    { "name": "UNKNOWN", "fcrStage": null, "stageNote": "proposer graffiti not identifiable", "sampleBlocks": 18, "samplePct": 90.0 }
  ],
  "clientStatusAsOf": "2026-04-14",
  "network": { "participationPct": 99.5, "windowSlots": 20, "missedSlots": 0, "sampledSlots": 20, "fetchErrors": 0 }
}
```

### `GET /api/v1/slots?limit=50`
Recent slot feed (max 50). The head slot is always `PENDING` — its attestations arrive in the next block.

```json
[
  { "slot": 14782388, "status": "PENDING", "attestPct": null, "attesting": null, "committeeMembers": null, "ageMs": 6670, "proposer": null, "ts": 1784212679000 },
  { "slot": 14782387, "status": "FAST_CONF_EST", "attestPct": 99.6, "attesting": 27420, "committeeMembers": 27526, "ageMs": 18670, "proposer": null, "ts": 1784212667000 }
]
```

Statuses: `FAST_CONF_EST` (participation ≥75% — would be fast-confirmable under FCR), `FINALIZED` (epoch ≤ finalized checkpoint), `PENDING` (attestations not yet on-chain), `LOW_PARTICIP` (<75%), `MISSED` (no block produced), `NO_DATA` (RPC error).

### `GET /api/v1/adoption/history`
90-day daily history: measured participation + graffiti-based client-adoption estimate (2 sampled blocks/day).

```json
[
  { "date": "2026-04-17", "participationPct": 99.85, "adoptionPct": 0, "sampleSize": 2 }
]
```

---

## Project Structure

```
fcrdashboard/
├── api/
│   ├── lib/
│   │   ├── beacon.js          # Beacon API fetch helpers (typed 404 handling, finality)
│   │   └── attestations.js    # SSZ bitlist math — real participation from aggregation bitfields
│   └── v1/
│       ├── summary.js         # GET /api/v1/summary
│       ├── slots.js           # GET /api/v1/slots
│       └── adoption/
│           └── history.js     # GET /api/v1/adoption/history
├── client/
│   └── src/
│       ├── components/        # React components (one per dashboard section)
│       ├── hooks/
│       │   └── usePolling.js  # Polling hook with mock/real toggle
│       └── data/
│           └── mock.js        # Mock data for local dev without API
├── vercel.json
└── .env.example
```

---

## FCR: Quick Reference

> Ethereum blocks reach **finality** after 2 epochs (~13 minutes). FCR provides **deterministic confirmation** in a single slot (~13 seconds) when ≥75% of stake is honest and attesting and the network is synchronous.
>
> No hard fork. No new trust assumptions. Enabled per-client via a feature flag.
> Example: `lighthouse bn --enable-fast-confirmation`
> Query via `eth_getBlockByNumber("safe")` — the safe tag returns the latest fast-confirmed block.
>
> Falls back to standard finality if network conditions degrade.

**References:**
- Spec: [ethereum/consensus-specs#4747](https://github.com/ethereum/consensus-specs/pull/4747)
- Research: [Confirmation Rule for Ethereum PoS (ethresear.ch)](https://ethresear.ch/t/confirmation-rule-for-ethereum-pos/15454)
- Overview: [fastconfirm.it](https://fastconfirm.it/)
- Client progress: [FCR breakout calls (ethereum/pm)](https://github.com/ethereum/pm/issues/1982)
