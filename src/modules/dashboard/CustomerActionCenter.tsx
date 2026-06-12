import {
  CalendarCheck2,
  Clock3,
  PackageOpen,
  RefreshCw,
} from 'lucide-react'
import { customerPackages } from '../../services/mockPhase3'
import {
  generateRebookingOpportunities,
  generateRenewalOpportunities,
} from '../communication/communicationEngine'

export function CustomerActionCenter() {
  const rebooking = generateRebookingOpportunities()
  const renewals = generateRenewalOpportunities()
  const expiringPackages = customerPackages.filter(
    (item) => item.status === 'Expiring Soon',
  )
  const actions = [
    { label: "Today's Follow Ups", value: 8, detail: 'Aftercare and recovery', icon: Clock3, tone: 'teal' },
    { label: "Today's Renewals", value: renewals.length, detail: `RM ${renewals.reduce((sum, item) => sum + item.expectedRevenue, 0).toLocaleString()} expected`, icon: RefreshCw, tone: 'gold' },
    { label: "Today's Rebooking Opportunities", value: rebooking.length, detail: 'Completed with no future booking', icon: CalendarCheck2, tone: 'teal' },
    { label: "Today's Expiring Packages", value: expiringPackages.length, detail: 'Require capacity planning', icon: PackageOpen, tone: 'gold' },
  ]

  return (
    <section className="customer-action-center panel">
      <div className="records-header">
        <div>
          <span className="panel-kicker">Customer engagement</span>
          <h2 className="panel-title">Today's Action Center</h2>
        </div>
        <span>Prioritized for the front desk</span>
      </div>
      <div className="customer-action-grid">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <article className={`is-${action.tone}`} key={action.label}>
              <span><Icon size={17} /></span>
              <div><small>{action.label}</small><strong>{action.value}</strong><p>{action.detail}</p></div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
