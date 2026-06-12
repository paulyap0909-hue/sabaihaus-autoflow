import { AlertTriangle, ArrowRight, UsersRound } from 'lucide-react'
import type {
  AtRiskCustomer,
  CustomerSegment,
} from '../../types/businessIntelligence'

interface CustomerIntelligenceViewProps {
  atRiskCustomers: AtRiskCustomer[]
  segments: CustomerSegment[]
}

export function CustomerIntelligenceView({
  atRiskCustomers,
  segments,
}: CustomerIntelligenceViewProps) {
  return (
    <div className="bi-section-grid">
      <section className="customer-segment-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Customer portfolio</span>
            <h2 className="panel-title">Value Segments</h2>
          </div>
          <UsersRound size={18} />
        </div>
        <div className="customer-segment-bar">
          {segments.map((segment) => (
            <span
              className={segment.color}
              style={{ width: `${segment.revenueShare}%` }}
              key={segment.label}
            />
          ))}
        </div>
        <div className="customer-segment-grid">
          {segments.map((segment) => (
            <article key={segment.label}>
              <i className={segment.color} />
              <span>{segment.label}</span>
              <strong>{segment.customers}</strong>
              <small>{segment.revenueShare}% revenue share</small>
            </article>
          ))}
        </div>
      </section>

      <section className="at-risk-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Retention intelligence</span>
            <h2 className="panel-title">At-Risk Customers</h2>
          </div>
          <span className="bi-risk-count"><AlertTriangle size={14} /> 42 need attention</span>
        </div>
        <div className="at-risk-customer-list">
          {atRiskCustomers.map((customer) => (
            <article key={customer.id}>
              <span className="risk-score">{customer.riskScore}</span>
              <div className="risk-customer-name">
                <strong>{customer.name}</strong>
                <span>{customer.membershipTier} · {customer.daysInactive} days inactive</span>
              </div>
              <div>
                <span>Lifetime value</span>
                <strong>RM {customer.lifetimeValue.toLocaleString()}</strong>
              </div>
              <p>{customer.reason}</p>
              <div className="risk-action">
                <span>Recommended next action</span>
                <strong>{customer.recommendedAction}</strong>
              </div>
              <button type="button" aria-label={`Open ${customer.name} recovery action`}>
                <ArrowRight size={15} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
