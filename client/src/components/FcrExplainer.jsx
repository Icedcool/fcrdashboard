export default function FcrExplainer({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <pre style={{ color: 'var(--green-dim)', fontSize: '0.8rem', marginBottom: '12px' }}>
{`> WHAT IS FAST CONFIRMATION?`}
        </pre>
        <pre style={{ lineHeight: 1.8 }}>{`  Ethereum blocks are "finalized" after ~2 epochs (~13 minutes).
  The Fast Confirmation Rule (FCR) is a consensus-client feature
  that allows blocks to be "confirmed" in a single slot (~13s).

  HOW: By counting validator attestations. If ≥75% of validators
  have attested to a block and network conditions are synchronous,
  the block is deterministically safe to treat as confirmed.

  NO HARD FORK REQUIRED. Enabled per-client via a feature flag.
  e.g.: lighthouse bn --fast-confirmation-rule

  SECURITY: Deterministic guarantee under normal conditions.
  Falls back to standard finality if network degrades.
  No slashing. No new trust assumptions.

  SPEC: github.com/ethereum/consensus-specs/pull/4747`}
        </pre>
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--green-dim)', paddingTop: '12px' }}>
          <button className="btn" onClick={onClose}>[CLOSE]</button>
        </div>
      </div>
    </div>
  )
}
