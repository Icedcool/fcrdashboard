// GET /api/v1/summary
import { beaconGet, decodeGraffiti, classifyClient, GENESIS_TIME_MS } from '../lib/beacon.js'

const FCR_CLIENTS = ['Lodestar', 'Lighthouse']
const ESTIMATED_TOTAL_VALIDATORS = 560000
const CLIENT_ORDER = ['Lodestar', 'Lighthouse', 'Prysm', 'Teku', 'Nimbus']
const CLIENT_META = {
  Lodestar:   { version: 'v1.28.0', fcrEnabled: true,  status: 'LIVE' },
  Lighthouse: { version: 'v7.1.0',  fcrEnabled: true,  status: 'LIVE' },
  Prysm:      { version: 'v6.0.0',  fcrEnabled: false, status: 'DEV'  },
  Teku:       { version: 'v25.4.0', fcrEnabled: false, status: 'DEV'  },
  Nimbus:     { version: 'v25.3.0', fcrEnabled: false, status: 'DEV'  },
}

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=12, stale-while-revalidate=6')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const headData = await beaconGet('/eth/v1/beacon/headers/head')
    const headSlot = parseInt(headData.data.header.message.slot)

    // Fetch last 20 blocks in parallel for graffiti-based client distribution
    const rawBlocks = await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        beaconGet(`/eth/v2/beacon/blocks/${headSlot - i}`).catch(() => null)
      )
    )
    const blocks = rawBlocks.filter(Boolean)
    const headBlock = blocks[0]

    const ep = headBlock?.data.message.body.execution_payload
    const slot = headSlot
    const epoch = Math.floor(slot / 32)
    const blockHash = ep?.block_hash ?? '0x'
    const blockNumber = ep ? parseInt(ep.block_number) : 0

    // Count client occurrences from graffiti
    const counts = Object.fromEntries(CLIENT_ORDER.map(c => [c, 0]))
    for (const block of blocks) {
      const client = classifyClient(decodeGraffiti(block.data.message.body.graffiti))
      if (client && counts[client] !== undefined) counts[client]++
    }

    const totalSampled = blocks.length || 1
    const clients = CLIENT_ORDER.map(name => {
      const count = counts[name]
      const pctOfSet = parseFloat((count / totalSampled * 100).toFixed(1))
      const validators = Math.round((count / totalSampled) * ESTIMATED_TOTAL_VALIDATORS)
      return { name, ...CLIENT_META[name], validators, pctOfSet }
    })

    const fcrValidators = clients
      .filter(c => FCR_CLIENTS.includes(c.name))
      .reduce((s, c) => s + c.validators, 0)

    const adoptionPct = parseFloat((fcrValidators / ESTIMATED_TOTAL_VALIDATORS * 100).toFixed(1))
    const attestationPct = adoptionPct
    const thresholdMet = attestationPct >= 75
    const syncHealth = attestationPct >= 95 ? 'NOMINAL' : attestationPct >= 75 ? 'DEGRADED' : 'UNSAFE'
    const missedSlots24h = rawBlocks.filter(b => b === null).length

    const result = {
      slot, epoch, blockHash, blockNumber,
      adoptionPct, fcrValidators, totalValidators: ESTIMATED_TOTAL_VALIDATORS,
      attestationPct, thresholdMet, syncHealth,
      slotTime: GENESIS_TIME_MS + slot * 12000,
      confirmationMs: 13100,
      clients,
      network: {
        participationRate7d: attestationPct,
        syncCommitteeHealth: 'NOMINAL',
        missedSlots24h,
        totalSlots24h: 7200,
        reorgCount24h: 0,
        baseReward: '~0.000054 ETH',
        latencyHealth: 'NOMINAL',
      },
    }

    staleCache = result
    res.json(result)
  } catch (err) {
    console.error('summary error:', err)
    if (staleCache) return res.json(staleCache)
    res.status(500).json({ error: err.message })
  }
}
