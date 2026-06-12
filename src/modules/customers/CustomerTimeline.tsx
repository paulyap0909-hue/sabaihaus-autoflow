import {
  CalendarCheck2,
  ClipboardPen,
  Clock3,
  Crown,
  MessageCircleMore,
  PackageCheck,
} from 'lucide-react'
import type { CustomerTimelineEventType } from '../../types/communication'
import { buildCustomerTimeline } from '../communication/communicationEngine'

const icons: Record<CustomerTimelineEventType, typeof CalendarCheck2> = {
  Appointment: CalendarCheck2,
  Message: MessageCircleMore,
  'Package Redemption': PackageCheck,
  'Membership Event': Crown,
  'Follow Up': Clock3,
  Note: ClipboardPen,
}

export function CustomerTimeline({ customerName }: { customerName: string }) {
  const events = buildCustomerTimeline(customerName)

  return (
    <section className="profile-section">
      <h3><Clock3 size={17} /> Unified Customer Timeline</h3>
      <div className="unified-customer-timeline">
        {events.map((event) => {
          const Icon = icons[event.type]
          return (
            <article key={event.id}>
              <span><Icon size={15} /></span>
              <div>
                <header><strong>{event.title}</strong><small>{event.occurredAt.slice(0, 10)}</small></header>
                <p>{event.detail}</p>
                <footer><span>{event.type}</span>{event.status && <em>{event.status}</em>}</footer>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
