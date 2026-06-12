import {
  ArrowRight,
  BadgeAlert,
  BrainCircuit,
  CircleDollarSign,
  Gauge,
  PackageOpen,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import type { ManagementBrainResult } from '../../types/businessIntelligence'

interface ExecutiveBriefViewProps {
  brain: ManagementBrainResult
}

const actionIcons = {
  Growth: TrendingUp,
  Retention: UsersRound,
  Capacity: Gauge,
  Package: PackageOpen,
  Revenue: CircleDollarSign,
}

export function ExecutiveBriefView({ brain }: ExecutiveBriefViewProps) {
  return (
    <div className="bi-section-grid management-brief">
      <section className="management-brief-hero">
        <div className="management-brief-copy">
          <span className="management-brain-mark"><BrainCircuit size={25} /></span>
          <div>
            <span className="panel-kicker">Deterministic management brain</span>
            <h1>{brain.executiveBrief.greeting}</h1>
            <h2>{brain.executiveBrief.headline}</h2>
            <div className="management-observations">
              {brain.executiveBrief.observations.map((observation) => (
                <p key={observation}><Sparkles size={13} /> {observation}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="management-health-card">
          <span>Business Health Score</span>
          <strong>{brain.health.score}<small>/100</small></strong>
          <i><span style={{ width: `${brain.health.score}%` }} /></i>
          <p>{brain.health.status} operating health</p>
        </div>
      </section>

      <section className="owner-action-center panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Owner action center</span>
            <h2 className="panel-title">Recommended Actions</h2>
          </div>
          <span className="bi-heading-signal"><Target size={14} /> Ranked by business impact</span>
        </div>
        <div className="owner-action-grid">
          {brain.recommendedActions.map((action) => {
            const Icon = actionIcons[action.category]
            return (
              <article key={action.id}>
                <header>
                  <span className={`management-priority is-${action.priority.toLowerCase()}`}>
                    {action.priority}
                  </span>
                  <span className="management-confidence">{action.confidence}% confidence</span>
                </header>
                <span className="owner-action-icon"><Icon size={17} /></span>
                <h3>{action.title}</h3>
                <p>{action.summary}</p>
                <div className="owner-action-impact">
                  <span>{action.impact} impact</span>
                  <strong>{action.estimatedImpact}</strong>
                </div>
                <button type="button">
                  {action.actionLabel}
                  <ArrowRight size={14} />
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="management-score-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Scoring model</span>
            <h2 className="panel-title">Business Health Drivers</h2>
          </div>
          <strong>{brain.health.score}/100</strong>
        </div>
        <div className="management-score-list">
          {brain.health.components.map((component) => (
            <div key={component.label}>
              <span>{component.label}</span>
              <i><span style={{ width: `${component.score}%` }} /></i>
              <strong>{component.score}</strong>
              <small>{component.weight}% weight</small>
            </div>
          ))}
        </div>
      </section>

      <section className="growth-opportunity-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Growth opportunities</span>
            <h2 className="panel-title">Where Revenue Can Grow</h2>
          </div>
          <TrendingUp size={18} />
        </div>
        <div className="growth-opportunity-list">
          {brain.growthOpportunities.map((opportunity) => (
            <article key={opportunity.id}>
              <div>
                <strong>{opportunity.title}</strong>
                <p>{opportunity.signal}</p>
              </div>
              <div>
                <span>Potential monthly upside</span>
                <strong>RM {opportunity.potentialMonthlyUpside.toLocaleString()}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{opportunity.confidence}%</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="management-retention-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Retention alerts</span>
            <h2 className="panel-title">Premium Customers Requiring Action</h2>
          </div>
          <span className="bi-risk-count"><ShieldAlert size={14} /> {brain.retentionAlerts.length} alerts</span>
        </div>
        <div className="management-retention-list">
          {brain.retentionAlerts.slice(0, 6).map((alert) => (
            <article key={alert.id}>
              <span className="risk-score">{alert.riskScore}</span>
              <div><strong>{alert.customer}</strong><span>{alert.segment}</span></div>
              <div><span>Inactive</span><strong>{alert.daysInactive} days</strong></div>
              <div><span>Lifetime value</span><strong>RM {alert.lifetimeValue.toLocaleString()}</strong></div>
              <p>{alert.suggestedAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="therapist-opportunity-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Therapist opportunities</span>
            <h2 className="panel-title">Performance Actions</h2>
          </div>
          <UserRoundCheck size={18} />
        </div>
        <div className="therapist-opportunity-list">
          {brain.therapistOpportunities.slice(0, 5).map((opportunity) => (
            <article key={opportunity.id}>
              <div>
                <span>{opportunity.type}</span>
                <strong>{opportunity.therapist}</strong>
                <small>{opportunity.metric}</small>
              </div>
              <p><strong>Coach:</strong> {opportunity.coachingAction}</p>
              <p><strong>Market:</strong> {opportunity.marketingAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="package-risk-engine panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Package risk engine</span>
            <h2 className="panel-title">Outstanding Service Exposure</h2>
          </div>
          <PackageOpen size={18} />
        </div>
        <div className="package-risk-list">
          {brain.packageRiskAlerts.map((alert) => (
            <article key={alert.id}>
              <div>
                <span className={`package-risk-level is-${alert.riskLevel.toLowerCase()}`}>
                  {alert.riskLevel}
                </span>
                <strong>{alert.packageName}</strong>
              </div>
              <div><span>Exposure</span><strong>RM {alert.estimatedExposure.toLocaleString()}</strong></div>
              <div><span>Outstanding</span><strong>{alert.outstandingSessions} sessions</strong></div>
              <div><span>Expiring</span><strong>{alert.expiringWithin30Days}</strong></div>
              <p>{alert.recommendedMitigation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="revenue-opportunity-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Revenue opportunities</span>
            <h2 className="panel-title">Forecast and Revenue Gaps</h2>
          </div>
          <BadgeAlert size={18} />
        </div>
        <div className="revenue-alert-grid">
          {brain.revenueAlerts.map((alert) => (
            <article className={`is-${alert.direction}`} key={alert.id}>
              <span>{alert.title}</span>
              <strong>{alert.displayValue}</strong>
              <p>{alert.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
