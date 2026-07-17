// Mock data generator — simulates live beacon chain data in the same shape
// as the real /api/v1 endpoints (enable via USE_MOCK in hooks/usePolling.js)

const BASE_SLOT = 14782000
const BASE_BLOCK = 25545000
const COMMITTEE_MEMBERS = 27525
const TOTAL_VALIDATORS = COMMITTEE_MEMBERS * 32
let slotCounter = 0

// Mirrors CLIENT_META in api/v1/summary.js (FCR breakout call #6, 2026-04-14)
const CLIENTS = [
  { name: 'Lodestar',   fcrStage: 'STAGING',     stageNote: 'spec tests passing; deploying to staking environment' },
  { name: 'Lighthouse', fcrStage: 'POC',         stageNote: 'EPF proof-of-concept; running spec test vectors' },
  { name: 'Teku',       fcrStage: 'POC',         stageNote: 'PoC complete; production development starting' },
  { name: 'Prysm',      fcrStage: 'IN_DEV',      stageNote: 'older algorithm implemented; ~25% on merged spec' },
  { name: 'Nimbus',     fcrStage: 'SPEC_REVIEW', stageNote: 'spec reviewed; active in spec PRs' },
  { name: 'Grandine',   fcrStage: 'TBD',         stageNote: 'no public status' },
]

export function getMockSummary() {
  slotCounter++
  const slot = BASE_SLOT + slotCounter
  const epoch = Math.floor(slot / 32)
  const pct = parseFloat((98.8 + Math.random() * 1.1).toFixed(1))  // 98.8–99.9%
  const attesting = Math.round(COMMITTEE_MEMBERS * pct / 100)
  const windowPct = parseFloat((pct - 0.2 + Math.random() * 0.4).toFixed(1))
  const thresholdMet = pct >= 75
  const syncHealth = pct >= 95 ? 'NOMINAL' : pct >= 75 ? 'DEGRADED' : 'BELOW_FCR'

  const sampleSize = 20
  const sampleCounts = { Lodestar: 1, Lighthouse: 1, Teku: 0, Prysm: 1, Nimbus: 1, Grandine: 0 }
  const identified = Object.values(sampleCounts).reduce((s, c) => s + c, 0)

  const clients = CLIENTS.map(c => ({
    ...c,
    sampleBlocks: sampleCounts[c.name],
    samplePct: parseFloat((sampleCounts[c.name] / sampleSize * 100).toFixed(1)),
  }))
  clients.push({
    name: 'UNKNOWN',
    fcrStage: null,
    stageNote: 'proposer graffiti not identifiable',
    sampleBlocks: sampleSize - identified,
    samplePct: parseFloat(((sampleSize - identified) / sampleSize * 100).toFixed(1)),
  })

  return {
    slot,
    epoch,
    blockHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
    blockNumber: BASE_BLOCK + slotCounter,
    slotTime: Date.now(),
    participation: {
      pct,
      attesting,
      committeeMembers: COMMITTEE_MEMBERS,
      refSlot: slot - 1,
      windowPct,
      windowSlots: 20,
    },
    attestationPct: pct,
    totalValidators: TOTAL_VALIDATORS,
    thresholdMet,
    syncHealth,
    finality: {
      justifiedEpoch: epoch - 1,
      finalizedEpoch: epoch - 2,
      finalizedSlotsBack: (slot % 32) + 33,
    },
    adoption: { sampleSize, identified, unknown: sampleSize - identified },
    clients,
    clientStatusAsOf: '2026-04-14',
    network: {
      participationPct: windowPct,
      windowSlots: 20,
      missedSlots: 1,
      sampledSlots: 20,
      fetchErrors: 0,
    },
  }
}

export function getMockSlots(limit = 50) {
  const slots = []
  for (let i = 0; i < limit; i++) {
    const slot = BASE_SLOT + slotCounter - i
    let status, attestPct
    if (i === 0) {
      status = 'PENDING'
      attestPct = null
    } else if (Math.random() < 0.04) {
      status = 'MISSED'
      attestPct = null
    } else {
      attestPct = parseFloat((98.5 + Math.random() * 1.4).toFixed(1))
      status = 'FAST_CONF_EST'
    }
    const attesting = attestPct != null ? Math.round(COMMITTEE_MEMBERS * attestPct / 100) : null
    const ageMs = i * 12000 + Math.round(Math.random() * 2000)
    slots.push({
      slot,
      status,
      attestPct,
      attesting,
      committeeMembers: attestPct != null ? COMMITTEE_MEMBERS : null,
      ageMs,
      proposer: Math.random() < 0.2 ? CLIENTS[Math.floor(Math.random() * CLIENTS.length)].name : null,
      ts: Date.now() - ageMs,
    })
  }
  return slots
}

export function getMockHistory() {
  const history = []
  const now = Date.now()
  const DAY = 86400000

  for (let i = 89; i >= 0; i--) {
    const date = new Date(now - i * DAY)
    history.push({
      date: date.toISOString().slice(0, 10),
      participationPct: parseFloat((99 + Math.random() * 0.9).toFixed(2)),
      adoptionPct: parseFloat((Math.random() < 0.5 ? 0 : 50).toFixed(2)),
      sampleSize: 2,
    })
  }
  return history
}
