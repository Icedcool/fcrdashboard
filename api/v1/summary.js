// GET /api/v1/summary
import { beaconGet, fetchBlock, fetchFinality, decodeGraffiti, classifyClient, GENESIS_TIME_MS } from '../lib/beacon.js'
import { participationByTargetSlot, estimateActiveValidators } from '../lib/attestations.js'

const SAMPLE_SIZE = 20

// FCR implementation progress per client team.
// Source: ethereum/pm FCR breakout call #6 (2026-04-14, ethereum/pm#1982);
// spec merged 2026-04-16 (ethereum/consensus-specs#4747).
// NO client has FCR enabled in a production release as of this date.
const CLIENT_ORDER = ['Lodestar', 'Lighthouse', 'Teku', 'Prysm', 'Nimbus', 'Grandine']
const CLIENT_META = {
  Lodestar:   { fcrStage: 'STAGING',     stageNote: 'spec tests passing; deploying to staking environment' },
  Lighthouse: { fcrStage: 'POC',         stageNote: 'EPF proof-of-concept; running spec test vectors' },
  Teku:       { fcrStage: 'POC',         stageNote: 'PoC complete; production development starting' },
  Prysm:      { fcrStage: 'IN_DEV',      stageNote: 'older algorithm implemented; ~25% on merged spec' },
  Nimbus:     { fcrStage: 'SPEC_REVIEW', stageNote: 'spec reviewed; active in spec PRs' },
  Grandine:   { fcrStage: 'TBD',         stageNote: 'no public status' },
}
const CLIENT_STATUS_AS_OF = '2026-04-14'

let staleCache = null

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=12, stale-while-revalidate=6')
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const headData = await beaconGet('/eth/v1/beacon/headers/head')
    const headSlot = parseInt(headData.data.header.message.slot)

    const [results, finality] = await Promise.all([
      Promise.all(Array.from({ length: SAMPLE_SIZE }, (_, i) => fetchBlock(headSlot - i))),
      fetchFinality().catch(() => null),
    ])
    const blocks = results.filter(r => r.block).map(r => r.block)
    const headBlock = results[0]?.block

    const ep = headBlock?.data.message.body.execution_payload
    const slot = headSlot
    const epoch = Math.floor(slot / 32)
    const blockHash = ep?.block_hash ?? '0x'
    const blockNumber = ep ? parseInt(ep.block_number) : 0

    // Real attestation participation, measured from aggregation bitfields.
    // Only trust target slots whose next block is inside the fetched window —
    // older slots only show late stragglers and read misleadingly low.
    const oldestFetched = headSlot - SAMPLE_SIZE + 1
    const partMap = participationByTargetSlot(results)
    const measured = [...partMap.entries()]
      .filter(([s, m]) => s >= oldestFetched - 1 && m.committeesCovered >= 32)
      .sort((a, b) => b[0] - a[0])

    const [refSlot, ref] = measured[0] ?? [null, null]
    const windowPct = measured.length
      ? parseFloat((measured.reduce((s, [, m]) => s + m.pct, 0) / measured.length).toFixed(1))
      : null

    const attestationPct = ref?.pct ?? null
    const totalValidators = ref ? estimateActiveValidators(ref) : null
    const thresholdMet = attestationPct != null ? attestationPct >= 75 : null
    const syncHealth = attestationPct == null ? 'UNKNOWN'
      : attestationPct >= 95 ? 'NOMINAL'
      : attestationPct >= 75 ? 'DEGRADED'
      : 'BELOW_FCR'

    const missedSlots = results.filter(r => r.missed).length
    const fetchErrors = results.filter(r => r.error).length

    // Client distribution: graffiti-identified sample of recent proposers.
    // Most proposers set no identifying graffiti — lower-bound sample only.
    const counts = Object.fromEntries(CLIENT_ORDER.map(c => [c, 0]))
    let identified = 0
    for (const block of blocks) {
      const client = classifyClient(decodeGraffiti(block.data.message.body.graffiti))
      if (client && counts[client] !== undefined) { counts[client]++; identified++ }
    }
    const sampleSize = blocks.length
    const clients = CLIENT_ORDER.map(name => ({
      name,
      ...CLIENT_META[name],
      sampleBlocks: counts[name],
      samplePct: sampleSize ? parseFloat((counts[name] / sampleSize * 100).toFixed(1)) : 0,
    }))
    clients.push({
      name: 'UNKNOWN',
      fcrStage: null,
      stageNote: 'proposer graffiti not identifiable',
      sampleBlocks: sampleSize - identified,
      samplePct: sampleSize ? parseFloat(((sampleSize - identified) / sampleSize * 100).toFixed(1)) : 0,
    })

    const result = {
      slot, epoch, blockHash, blockNumber,
      slotTime: GENESIS_TIME_MS + slot * 12000,
      participation: ref ? {
        pct: ref.pct,
        attesting: ref.attesting,
        committeeMembers: ref.committeeMembers,
        refSlot,
        windowPct,
        windowSlots: measured.length,
      } : null,
      attestationPct,
      totalValidators,
      thresholdMet,
      syncHealth,
      finality: finality ? {
        ...finality,
        finalizedSlotsBack: headSlot - ((finality.finalizedEpoch + 1) * 32 - 1),
      } : null,
      adoption: { sampleSize, identified, unknown: sampleSize - identified },
      clients,
      clientStatusAsOf: CLIENT_STATUS_AS_OF,
      network: {
        participationPct: windowPct,
        windowSlots: measured.length,
        missedSlots,
        sampledSlots: SAMPLE_SIZE,
        fetchErrors,
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
