// SSZ attestation bitfield math (Electra format, EIP-7549).
//
// Each block carries up to 8 aggregate attestations. An attestation's
// `aggregation_bits` is an SSZ bitlist whose bits map, in order, to the
// members of the committees selected in `committee_bits` for the target
// slot. So for an attestation covering all 64 committees:
//   bitlist length            = total committee seats for that slot
//   popcount (minus delimiter) = validators whose attestation was included
//   bitlist length × 32       ≈ active validator set size
// This lets us measure real participation from blocks we already fetch,
// with no extra Beacon API calls, and it works on historical blocks too
// (the denominator self-adjusts to the validator count of the era).

const POPCOUNT = new Uint8Array(256)
for (let i = 0; i < 256; i++) POPCOUNT[i] = (i & 1) + POPCOUNT[i >> 1]

// Parse an SSZ bitlist hex string. Bit k lives at bytes[k >> 3] >> (k & 7).
// The highest set bit overall is the length delimiter — excluded from both
// the returned bytes (cleared) and bitLength. Returns null for empty/zero input.
export function parseBitlist(hex) {
  if (!hex || hex === '0x') return null
  const bytes = Buffer.from(hex.slice(2), 'hex')
  let last = bytes.length - 1
  while (last >= 0 && bytes[last] === 0) last--
  if (last < 0) return null // no delimiter bit — malformed bitlist
  const highBit = 31 - Math.clz32(bytes[last])
  const out = Buffer.from(bytes.subarray(0, last + 1))
  out[last] &= ~(1 << highBit)
  return { bytes: out, bitLength: last * 8 + highBit }
}

export function popcountBytes(buf) {
  let n = 0
  for (let i = 0; i < buf.length; i++) n += POPCOUNT[buf[i]]
  return n
}

function popcountHex(hex) {
  let n = 0
  for (let i = 2; i < hex.length; i++) n += POPCOUNT[parseInt(hex[i], 16)]
  return n
}

function committeeBitsOverlap(hexA, hexB) {
  const a = Buffer.from(hexA.slice(2), 'hex')
  const b = Buffer.from(hexB.slice(2), 'hex')
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) if (a[i] & b[i]) return true
  return false
}

// Compute participation per attested (target) slot across a set of blocks.
// Accepts raw block JSON or fetchBlock() results ({ block } | { missed } | { error }).
// Returns Map<targetSlot, { attesting, committeeMembers, pct, committeesCovered }>.
export function participationByTargetSlot(blocks) {
  // Group attestations by (target slot, committee_bits); union within a group.
  const groups = new Map()
  for (const item of blocks) {
    const block = item?.data ? item : item?.block
    const atts = block?.data?.message?.body?.attestations
    if (!atts) continue
    for (const att of atts) {
      if (!att.committee_bits) continue // pre-Electra attestation shape
      const parsed = parseBitlist(att.aggregation_bits)
      if (!parsed) continue
      const key = `${att.data.slot}|${att.committee_bits}`
      const existing = groups.get(key)
      if (!existing) {
        groups.set(key, { slot: parseInt(att.data.slot), committeeBits: att.committee_bits, ...parsed })
      } else if (existing.bitLength === parsed.bitLength) {
        for (let i = 0; i < existing.bytes.length; i++) existing.bytes[i] |= parsed.bytes[i]
      } else if (popcountBytes(parsed.bytes) > popcountBytes(existing.bytes)) {
        // bitLength mismatch shouldn't happen for identical committees; keep the fuller one
        groups.set(key, { slot: parseInt(att.data.slot), committeeBits: att.committee_bits, ...parsed })
      }
    }
  }

  // Per slot: greedy disjoint union across committee_bits groups. Committees are
  // disjoint validator sets, so summing counts across non-overlapping groups is
  // exact. Groups overlapping an already-accepted one are skipped (≤~0.1%
  // possible undercount in the numerator; the denominator stays exact for the
  // committees actually covered).
  const bySlot = new Map()
  for (const g of groups.values()) {
    if (!bySlot.has(g.slot)) bySlot.set(g.slot, [])
    bySlot.get(g.slot).push(g)
  }

  const result = new Map()
  for (const [slot, slotGroups] of bySlot) {
    slotGroups.sort((a, b) => b.bitLength - a.bitLength)
    const accepted = []
    for (const g of slotGroups) {
      if (accepted.some(a => committeeBitsOverlap(a.committeeBits, g.committeeBits))) continue
      accepted.push(g)
    }
    const attesting = accepted.reduce((s, g) => s + popcountBytes(g.bytes), 0)
    const committeeMembers = accepted.reduce((s, g) => s + g.bitLength, 0)
    const committeesCovered = accepted.reduce((s, g) => s + popcountHex(g.committeeBits), 0)
    if (committeeMembers === 0) continue
    result.set(slot, {
      attesting,
      committeeMembers,
      pct: parseFloat((attesting / committeeMembers * 100).toFixed(1)),
      committeesCovered,
    })
  }
  return result
}

// One slot's committees hold 1/32 of the active set; scale up for partial coverage.
export function estimateActiveValidators({ committeeMembers, committeesCovered }) {
  if (!committeeMembers || !committeesCovered) return null
  return Math.round(committeeMembers * 32 * (64 / committeesCovered))
}
