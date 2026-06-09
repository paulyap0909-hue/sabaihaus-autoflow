import { BellRing, Clock3, PackageSearch, RefreshCw } from 'lucide-react'

const pulseItems = [
  { label: 'Low stock alerts', value: 3, detail: 'Inventory Center', icon: PackageSearch, href: '/inventory-center', tone: 'gold' },
  { label: 'Messages scheduled', value: 32, detail: 'Notification Center', icon: BellRing, href: '/notification-center', tone: 'teal' },
  { label: 'Renewal alerts', value: 12, detail: 'Memberships & packages', icon: RefreshCw, href: '/memberships', tone: 'gold' },
  { label: 'Follow-ups due', value: 8, detail: 'Customer retention', icon: Clock3, href: '/notification-center', tone: 'teal' },
]

export function OperationsPulse() {
  return (
    <section className="operations-pulse">
      {pulseItems.map((item) => {
        const Icon = item.icon
        return (
          <a className={`pulse-card ${item.tone}`} href={item.href} key={item.label}>
            <span><Icon size={16} /></span>
            <div><strong>{item.value}</strong><small>{item.label}</small></div>
            <em>{item.detail}</em>
          </a>
        )
      })}
    </section>
  )
}
