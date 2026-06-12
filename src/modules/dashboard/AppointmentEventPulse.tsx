import {
  BadgeDollarSign,
  Boxes,
  CalendarCheck2,
  PackageCheck,
  Send,
  Workflow,
} from 'lucide-react'
import { useSyncExternalStore } from 'react'
import {
  getAppointmentEventMetrics,
  subscribeToAppointmentEventMetrics,
} from '../appointments/eventEngine/demoAppointmentEventStore'

export function AppointmentEventPulse() {
  const metrics = useSyncExternalStore(
    subscribeToAppointmentEventMetrics,
    getAppointmentEventMetrics,
  )

  const items = [
    {
      label: "Today's Completed Appointments",
      value: metrics.completedAppointments.toString(),
      detail: 'Customer and revenue updated',
      icon: CalendarCheck2,
    },
    {
      label: 'Package Redemptions',
      value: metrics.packageRedemptions.toString(),
      detail: 'Sessions deducted',
      icon: PackageCheck,
    },
    {
      label: 'Inventory Consumed',
      value: `${metrics.inventoryConsumed.toFixed(2)} units`,
      detail: 'Movement records created',
      icon: Boxes,
    },
    {
      label: 'Commission Generated',
      value: `RM ${(metrics.commissionGeneratedMinor / 100).toFixed(2)}`,
      detail: 'Pending payroll approval',
      icon: BadgeDollarSign,
    },
    {
      label: 'Follow Ups Created',
      value: metrics.followUpsCreated.toString(),
      detail: 'Due in 30 days',
      icon: Send,
    },
  ]

  return (
    <section className="event-pulse panel" aria-label="Appointment event engine activity">
      <div className="event-pulse-heading">
        <div>
          <span className="panel-kicker">Completion automation</span>
          <h2 className="panel-title">Appointment Event Pulse</h2>
        </div>
        <span className="event-engine-status">
          <Workflow size={14} />
          Engine active
        </span>
      </div>

      <div className="event-pulse-grid">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.label}>
              <span className="event-pulse-icon">
                <Icon size={17} strokeWidth={1.8} />
              </span>
              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
