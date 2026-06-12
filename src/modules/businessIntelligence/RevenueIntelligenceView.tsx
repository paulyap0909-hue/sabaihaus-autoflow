import { BadgeDollarSign, CircleDollarSign, Target, TrendingUp } from 'lucide-react'
import type {
  RevenueForecastPoint,
  RevenueMixItem,
} from '../../types/businessIntelligence'
import { IntelligenceTrendChart } from './IntelligenceTrendChart'

interface RevenueIntelligenceViewProps {
  forecast: RevenueForecastPoint[]
  revenueMix: RevenueMixItem[]
}

export function RevenueIntelligenceView({
  forecast,
  revenueMix,
}: RevenueIntelligenceViewProps) {
  const nextQuarter = forecast
    .filter((item) => item.actual === undefined)
    .reduce((sum, item) => sum + item.forecast, 0)

  return (
    <div className="bi-section-grid">
      <section className="revenue-forecast-summary">
        <article>
          <span><TrendingUp size={18} /></span>
          <div><small>Next-quarter forecast</small><strong>RM {nextQuarter.toLocaleString()}</strong><p>8.7% above target trajectory</p></div>
        </article>
        <article>
          <span><Target size={18} /></span>
          <div><small>June target attainment</small><strong>107.2%</strong><p>RM 8,640 above plan</p></div>
        </article>
        <article>
          <span><BadgeDollarSign size={18} /></span>
          <div><small>Average revenue per visit</small><strong>RM 286</strong><p>+RM 24 since March</p></div>
        </article>
      </section>

      <section className="revenue-forecast-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Actual, forecast and plan</span>
            <h2 className="panel-title">Revenue Forecast</h2>
          </div>
          <span className="bi-heading-signal"><CircleDollarSign size={14} /> Confidence 89%</span>
        </div>
        <IntelligenceTrendChart
          labels={forecast.map((item) => item.month)}
          series={[
            {
              label: 'Actual revenue',
              color: 'teal',
              values: forecast.map((item) => item.actual),
            },
            {
              label: 'Forecast',
              color: 'mint',
              dashed: true,
              values: forecast.map((item) => item.forecast),
            },
            {
              label: 'Target',
              color: 'gold',
              dashed: true,
              values: forecast.map((item) => item.target),
            },
          ]}
          valueFormatter={(value) => `RM ${(value / 1000).toFixed(1)}k`}
        />
      </section>

      <section className="revenue-mix-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Revenue quality</span>
            <h2 className="panel-title">Revenue Mix</h2>
          </div>
          <span>RM 128,640 total</span>
        </div>
        <div className="revenue-mix-bar">
          {revenueMix.map((item, index) => (
            <span className={`mix-${index + 1}`} style={{ width: `${item.share}%` }} key={item.label} />
          ))}
        </div>
        <div className="revenue-mix-grid">
          {revenueMix.map((item, index) => (
            <article key={item.label}>
              <i className={`mix-${index + 1}`} />
              <span>{item.label}</span>
              <strong>RM {item.amount.toLocaleString()}</strong>
              <small>{item.share}% share · {item.change >= 0 ? '+' : ''}{item.change}%</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
