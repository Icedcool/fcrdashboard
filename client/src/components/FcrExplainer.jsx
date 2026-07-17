export default function FcrExplainer({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <pre style={{ color: 'var(--green-dim)', fontSize: '0.8rem', marginBottom: '12px' }}>
{`> WHAT IS FAST CONFIRMATION?`}
        </pre>
        <pre style={{ lineHeight: 1.8 }}>{`  Ethereum blocks are finalized after ~2 epochs (~13 minutes).
  The Fast Confirmation Rule (FCR) is a consensus-client feature
  that lets blocks be confirmed in a single slot (~13 seconds).

  HOW: By counting validator attestations. Assuming network
  synchrony and <25% adversarial stake (≥75% honest AND
  attesting), a block attested by that supermajority is
  safe to treat as confirmed.

  NO HARD FORK REQUIRED. Client-side flag, e.g.:
    lighthouse bn --enable-fast-confirmation
  Query via eth_getBlockByNumber("safe") — the safe tag
  returns the latest fast-confirmed block.

  SECURITY: Deterministic under the stated assumptions;
  falls back to standard finality when they break.
  An adversary above 5% can delay confirmation by slots
  (15% → +1 slot, 18% → +2, 20% → +3). No slashing changes.

  STATUS: Spec merged Apr 2026 (consensus-specs#4747).
  Clients are implementing — none live in production yet.

  SPEC: github.com/ethereum/consensus-specs/pull/4747
  MORE: fastconfirm.it`}
        </pre>
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--green-dim)', paddingTop: '12px' }}>
          <button className="btn" onClick={onClose}>[CLOSE]</button>
        </div>
      </div>
    </div>
  )
}
