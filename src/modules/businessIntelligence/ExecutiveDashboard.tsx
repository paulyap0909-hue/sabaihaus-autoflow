import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Gauge,
  PackageOpen,
  TrendingUp,
  UserRoundCheck,
} from 'lucide-react'
import type { BusinessIntelligenceSnapshot } from '../../types/businessIntelligence'
import { IntelligenceTrendChart } from './IntelligenceTrendChart'

interface ExecutiveDashboardProps {
  snapshot: BusinessIntelligenceSnapshot
}

const kpiIcons = [
  CircleDollarSign,
  TrendingUp,
  UserRoundCheck,
  PackageOpen,
  Gauge,
]

export function ExecutiveDashboard({ snapshot }: ExecutiveDashboardProps) {
  return (
    <div className="bi-section-grid">
      <section className="executive-kpi-grid">
        {snapshot.kpis.map((kpi, index) => {
          const Icon = kpiIcons[index]
          const DirectionIcon =
            kpi.direction === 'up'
              ? ArrowUpRight
              : kpi.direction === 'down'
                ? ArrowDownRight
                : ArrowRight

          return (
            <article className="executive-kpi-card" key={kpi.label}>
              <div>
                <span className="executive-kpi-icon"><Icon size={17} /></span>
                <span className={`executive-kpi-change ${kpi.direction}`}>
                  <DirectionIcon size={13} />
                  {kpi.change}
                </span>
              </div>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small>{kpi.context}</small>
            </article>
          )
        })}
      </section>

      <section className="business-health-panel panel">
        <div className="business-health-score">
          <div
            className="business-health-ring"
            style={{ '--health-score': `${snapshot.health.score * 3.6}deg` } as React.CSSProperties}
          >
            <span>
              <strong>{snapshot.health.score}</strong>
              <small>/ 100</small>
            </span>
          </div>
          <div>
            <span className="panel-kicker">Business health score</span>
            <h2>{snapshot.health.status} and accelerating</h2>
            <p>
              Sabai Haus improved {snapshot.health.change} points this month,
              led by revenue momentum and customer return frequency.
            </p>
          </div>
        </div>
        <div className="health-component-list">
          {snapshot.health.components.map((component) => (
            <div key={component.label}>
              <span>{component.label}</span>
              <div><span style={{ width: `${component.score}%` }} /></div>
              <strong>{component.score}</strong>
              <small className={component.change >= 0 ? 'positive' : 'negative'}>
                {component.change >= 0 ? '+' : ''}{component.change}
              </small>
            </div>
          ))}
        </div>
      </section>

      <section className="executive-trend-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Six-month trajectory</span>
            <h2 className="panel-title">Revenue Momentum</h2>
          </div>
          <span className="bi-heading-signal"><TrendingUp size={14} /> 14.8% growth</span>
        </div>
        <IntelligenceTrendChart
          labels={snapshot.revenueTrend.map((item) => item.label)}
          series={[
            {
              label: 'Current year',
              color: 'teal',
              values: snapshot.revenueTrend.map((item) => item.value),
            },
            {
              label: 'Prior year',
              color: 'gold',
              dashed: true,
              values: snapshot.revenueTrend.map((item) => item.comparison),
            },
          ]}
          valueFormatter={(value) => `RM ${(value / 1000).toFixed(1)}k`}
        />
      </section>

      <section className="executive-priority-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Owner priorities</span>
            <h2 className="panel-title">Executive Focus</h2>
          </div>
          <BriefcaseBusiness size={18} />
        </div>
        <div className="executive-priority-list">
          <article>
            <span>01</span>
            <div>
              <strong>Convert Friday head-spa demand</strong>
              <p>Open additional premium capacity worth an estimated RM 8.4k monthly.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <strong>Reduce package delivery exposure</strong>
              <p>Schedule 82 Deep Restore sessions before upcoming expiry pressure.</p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <strong>Protect high-value member retention</strong>
              <p>Recover nine premium members approaching 60 days without a visit.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
