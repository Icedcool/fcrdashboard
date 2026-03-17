# FCR Dashboard

Real-time monitoring dashboard for Ethereum's **Fast Confirmation Rule (FCR)** — tracking validator adoption and live network health across consensus clients.

FCR enables single-slot transaction confirmation (~13 seconds) without a hard fork. When ≥75% of the active validator set runs an FCR-enabled client, any block attested to by that supermajority is deterministically safe to treat as confirmed — no waiting for 2-epoch finality (~13 minutes).

**Spec:** [ethereum/consensus-specs#4747](https://github.com/ethereum/consensus-specs/pull/4747)

---

## What It Shows

- **FCR Adoption %** — share of the active validator set running FCR-enabled clients
- **Live slot feed** — real-time block stream with `FAST_CONFIRMED` / `FINALIZED` / `MISSED` status per slot
- **Client breakdown** — Lodestar, Lighthouse, Prysm, Teku, Nimbus validator counts derived from block graffiti
- **Adoption history** — 90-day daily chart of FCR rollout
- **Network conditions** — participation rate, missed slots, sync committee health
- **Honest-stake gauge** — visual indicator of whether the 75% FCR threshold is currently met

Data refreshes every 12 seconds (one slot).

---

## Data Sources

| Data | Source |
|------|--------|
| Current slot / epoch / block | [PublicNode Beacon API](https://ethereum-beacon-api.publicnode.com) |
| Execution payload (block hash, number) | [PublicNode Beacon API](https://ethereum-beacon-api.publicnode.com) |
| Client distribution (graffiti analysis) | [ethPandaOps Xatu](https://clickhouse.xatu.ethpandaops.io) — public ClickHouse |
| 90-day adoption history | Xatu `canonical_beacon_block` |
| Recent slot feed | Xatu + Beacon API |

FCR-enabled clients are identified by graffiti string (`Lodestar`, `Lighthouse`). Tracked in the `FCR_CLIENTS` constant in `api/v1/summary.js` — update as more clients ship support.

---

## Stack

- **Frontend:** React + Vite, terminal/cypherpunk aesthetic, no UI frameworks
- **API:** Vercel serverless functions (Node 20)
- **No database** — all data fetched live from public Beacon API and Xatu ClickHouse

---

## Local Development

```bash
# Install dependencies
cd client && npm install

# Run dev server (mocks real API calls locally via Vite proxy)
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

No environment variables are required — the API defaults to public endpoints. Optionally override:

```bash
vercel env add BEACON_API_URL     # default: https://ethereum-beacon-api.publicnode.com
vercel env add EXECUTION_RPC_URL  # default: https://ethereum-rpc.publicnode.com
```

See `.env.example` for reference.

---

## API Endpoints

All endpoints are cached at the edge (`s-maxage=12` for slot data, `s-maxage=300` for history). On upstream failure, handlers return the last successful response.

### `GET /api/v1/summary`
Current adoption snapshot.

```json
{
  "slot": 12847293,
  "epoch": 401477,
  "blockHash": "0x4a3f...c291",
  "blockNumber": 21847293,
  "adoptionPct": 43.7,
  "fcrValidators": 244720,
  "totalValidators": 560000,
  "attestationPct": 43.7,
  "thresholdMet": false,
  "syncHealth": "UNSAFE",
  "clients": [
    { "name": "Lodestar", "fcrEnabled": true, "validators": 142840, "pctOfSet": 25.9 },
    ...
  ],
  "network": { "missedSlots24h": 3, "participationRate7d": 98.4, ... }
}
```

### `GET /api/v1/slots?limit=50`
Recent slot feed (max 200).

```json
[
  { "slot": 12847293, "status": "FAST_CONFIRMED", "attestPct": 76.2, "ageMs": 13100, "proposer": "Lodestar", "ts": 1710614400000 },
  { "slot": 12847292, "status": "FINALIZED", "attestPct": 72.1, ... },
  { "slot": 12847291, "status": "MISSED", "attestPct": null, ... }
]
```

### `GET /api/v1/adoption/history`
90-day daily adoption data.

```json
[
  { "date": "2025-12-17", "adoptionPct": 18.4, "thresholdMetPct": 13.4 },
  ...
]
```

---

## Project Structure

```
fcrdashboard/
├── api/
│   ├── lib/
│   │   ├── beacon.js          # beaconGet() — Beacon API fetch helper
│   │   └── xatu.js            # xatuQuery() — Xatu ClickHouse HTTP helper
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

> Ethereum blocks reach **finality** after 2 epochs (~13 minutes). FCR provides **deterministic confirmation** in a single slot (~13 seconds) when ≥75% of validators are honest and the network is synchronous.
>
> No hard fork. No new trust assumptions. Enabled per-client via a feature flag.
> Example: `lighthouse bn --fast-confirmation-rule`
>
> Falls back to standard finality if network conditions degrade.

**References:**
- Spec: [ethereum/consensus-specs#4747](https://github.com/ethereum/consensus-specs/pull/4747)
- Overview: [fastconfirm.it](https://fastconfirm.it/)
- Data: [ethPandaOps Xatu](https://ethpandaops.io/xatu)
