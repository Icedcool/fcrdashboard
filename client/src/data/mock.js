// Mock data generator — simulates live beacon chain data
// Replace internals with real Beacon API calls when ready

const BASE_SLOT = 12847293
const BASE_BLOCK = 21847293
let slotCounter = 0

const CLIENTS = [
  { name: 'Lodestar',   version: 'v1.28.0', fcrEnabled: true,  validators: 142840, status: 'LIVE' },
  { name: 'Lighthouse', version: 'v7.1.0',  fcrEnabled: true,  validators: 98421,  status: 'LIVE' },
  { name: 'Prysm',      version: 'v6.0.0',  fcrEnabled: false, validators: 143200, status: 'DEV'  },
  { name: 'Teku',       version: 'v25.4.0', fcrEnabled: false, validators: 89340,  status: 'DEV'  },
  { name: 'Nimbus',     version: 'v25.3.0', fcrEnabled: false, validators: 78129,  status: 'DEV'  },
]

const TOTAL_VALIDATORS = CLIENTS.reduce((s, c) => s + c.validators, 0)
const FCR_VALIDATORS   = CLIENTS.filter(c => c.fcrEnabled).reduce((s, c) => s + c.validators, 0)

export function getMockSummary() {
  slotCounter++
  const slot = BASE_SLOT + slotCounter
  const epoch = Math.floor(slot / 32)
  const attestPct = 74.8 + Math.random() * 4   // 74.8–78.8%
  const thresholdMet = attestPct >= 75
  const adoption = (FCR_VALIDATORS / TOTAL_VALIDATORS) * 100

  let syncHealth = 'NOMINAL'
  if (attestPct < 75)       syncHealth = 'UNSAFE'
  else if (attestPct < 95)  syncHealth = 'DEGRADED'

  return {
    slot,
    epoch,
    blockHash: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
    blockNumber: BASE_BLOCK + slotCounter,
    adoptionPct: adoption,
    fcrValidators: FCR_VALIDATORS,
    totalValidators: TOTAL_VALIDATORS,
    attestationPct: parseFloat(attestPct.toFixed(1)),
    thresholdMet,
    syncHealth,
    slotTime: Date.now(),
    confirmationMs: 13100 + Math.round(Math.random() * 800),
    clients: CLIENTS.map(c => ({
      ...c,
      pctOfSet: parseFloat(((c.validators / TOTAL_VALIDATORS) * 100).toFixed(1)),
    })),
    network: {
      participationRate7d: 98.4,
      syncCommitteeHealth: 'NOMINAL',
      missedSlots24h: 3,
      totalSlots24h: 7200,
      reorgCount24h: 0,
      baseReward: '~0.000054 ETH',
      latencyHealth: 'NOMINAL',
    },
  }
}

const STATUS_LABELS = ['FAST_CONFIRMED', 'FAST_CONFIRMED', 'FAST_CONFIRMED', 'FINALIZED', 'MISSED']
const STATUS_PROPOSERS = ['Lodestar', 'Lighthouse', 'Lodestar', null, null]

export function getMockSlots(limit = 50) {
  const slots = []
  for (let i = 0; i < limit; i++) {
    const slot = BASE_SLOT + slotCounter - i
    const idx = Math.floor(Math.random() * STATUS_LABELS.length)
    const status = STATUS_LABELS[idx]
    const proposer = STATUS_PROPOSERS[idx]
    const attestPct = status === 'MISSED' ? null : parseFloat((73 + Math.random() * 7).toFixed(1))
    const ageMs = i * 12000 + Math.round(Math.random() * 2000)
    slots.push({
      slot,
      status,
      attestPct,
      ageMs,
      proposer,
      ts: Date.now() - ageMs,
    })
  }
  return slots
}

export function getMockHistory() {
  const history = []
  const now = Date.now()
  const DAY = 86400000
  let adoption = 18

  // Lodestar FCR release: ~60 days ago
  // Lighthouse FCR release: ~30 days ago
  for (let i = 89; i >= 0; i--) {
    const date = new Date(now - i * DAY)
    const dateStr = date.toISOString().slice(0, 10)

    if (i <= 60 && i > 30) adoption = Math.min(26, adoption + 0.13)
    if (i <= 30)           adoption = Math.min(43.7, adoption + 0.58)

    const thresholdMetPct = Math.max(0, adoption - 5 + Math.random() * 3)

    history.push({
      date: dateStr,
      adoptionPct: parseFloat(adoption.toFixed(2)),
      thresholdMetPct: parseFloat(thresholdMetPct.toFixed(2)),
    })
  }
  return history
}
