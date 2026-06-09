import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import { PageHeader } from './PageHeader'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
  actionLabel: string
  features: string[]
}

export function PlaceholderPage({
  title,
  description,
  icon: Icon,
  actionLabel,
  features,
}: PlaceholderPageProps) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={
          <button className="primary-button" type="button">
            <Plus size={16} />
            {actionLabel}
          </button>
        }
      />
      <section className="placeholder-card">
        <span className="placeholder-icon">
          <Icon size={22} strokeWidth={1.7} />
        </span>
        <h2>{title} workspace</h2>
        <p>
          The foundation for this module is ready. Operational workflows and
          detailed records will be introduced in the next implementation phase.
        </p>
        <div className="placeholder-features">
          {features.map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </section>
    </>
  )
}
