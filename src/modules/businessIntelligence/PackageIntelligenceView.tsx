import { AlertCircle, PackageCheck, PackageOpen, TimerReset } from 'lucide-react'
import type { PackageLiability } from '../../types/businessIntelligence'

interface PackageIntelligenceViewProps {
  liabilities: PackageLiability[]
}

export function PackageIntelligenceView({
  liabilities,
}: PackageIntelligenceViewProps) {
  const totalLiability = liabilities.reduce(
    (sum, item) => sum + item.liabilityValue,
    0,
  )
  const outstandingSessions = liabilities.reduce(
    (sum, item) => sum + item.outstandingSessions,
    0,
  )
  const expiring = liabilities.reduce(
    (sum, item) => sum + item.expiringWithin30Days,
    0,
  )

  return (
    <div className="bi-section-grid">
      <section className="package-liability-hero">
        <div>
          <span className="panel-kicker">Deferred service obligation</span>
          <h2>RM {totalLiability.toLocaleString()}</h2>
          <p>
            Current package liability across {outstandingSessions} outstanding
            treatment sessions.
          </p>
        </div>
        <article><PackageOpen size={18} /><span>Active package types</span><strong>{liabilities.length}</strong></article>
        <article><TimerReset size={18} /><span>Expiring in 30 days</span><strong>{expiring}</strong></article>
        <article><PackageCheck size={18} /><span>Average redemption</span><strong>80%</strong></article>
      </section>

      <section className="package-liability-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Delivery exposure</span>
            <h2 className="panel-title">Package Liability Tracking</h2>
          </div>
          <span>Outstanding sessions and value</span>
        </div>
        <div className="package-liability-list">
          {liabilities.map((item) => (
            <article key={item.id}>
              <div>
                <span className="package-liability-icon"><PackageOpen size={16} /></span>
                <div><strong>{item.name}</strong><span>{item.activePackages} active packages</span></div>
              </div>
              <div><span>Outstanding</span><strong>{item.outstandingSessions} sessions</strong></div>
              <div><span>Liability value</span><strong>RM {item.liabilityValue.toLocaleString()}</strong></div>
              <div><span>Expiring soon</span><strong>{item.expiringWithin30Days}</strong></div>
              <div className="liability-redemption">
                <span>Redemption rate</span>
                <strong>{item.redemptionRate}%</strong>
                <i><span style={{ width: `${item.redemptionRate}%` }} /></i>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="liability-warning panel">
        <AlertCircle size={21} />
        <div>
          <span className="panel-kicker">Capacity warning</span>
          <h2>Deep Restore represents 49.8% of total package exposure.</h2>
          <p>
            Protect guest trust by reserving off-peak redemption capacity before
            seven packages enter their final 30-day window.
          </p>
        </div>
      </section>
    </div>
  )
}
