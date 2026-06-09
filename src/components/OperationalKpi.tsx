import type { LucideIcon } from 'lucide-react'

interface OperationalKpiProps {
  label: string
  value: string | number
  detail?: string
  icon: LucideIcon
  tone?: 'teal' | 'gold' | 'neutral'
}

export function OperationalKpi({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'teal',
}: OperationalKpiProps) {
  return (
    <article className={`operational-kpi ${tone}`}>
      <span className="operational-kpi-icon">
        <Icon size={17} strokeWidth={1.8} />
      </span>
      <div>
        <span className="operational-kpi-label">{label}</span>
        <strong>{value}</strong>
        {detail && <small>{detail}</small>}
      </div>
    </article>
  )
}
