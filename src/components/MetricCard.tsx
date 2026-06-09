import type { DashboardMetric } from '../types/dashboard'

interface MetricCardProps {
  metric: DashboardMetric
}

export function MetricCard({ metric }: MetricCardProps) {
  const Icon = metric.icon

  return (
    <article className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{metric.label}</span>
        <span className="metric-icon">
          <Icon size={17} strokeWidth={1.8} />
        </span>
      </div>
      <strong className="metric-value">{metric.value}</strong>
      <span className="metric-change">{metric.change}</span>
    </article>
  )
}
