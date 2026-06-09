import { ArrowUpRight, MessageCircleMore } from 'lucide-react'

export function GrowthAdvisor() {
  return (
    <section className="panel advisor-panel">
      <span className="panel-kicker">Growth opportunity</span>
      <h2 className="panel-title">Business advisor</h2>
      <div className="advisor-lead">24 guests are ready to return.</div>
      <p className="advisor-copy">
        Guests who previously booked massage treatments have not returned in
        45 days. A thoughtful wellness check-in could recover an estimated
        RM 3,840 in bookings.
      </p>
      <div className="advisor-actions">
        <button className="advisor-action" type="button">
          <MessageCircleMore size={15} />
          Review follow-ups
        </button>
        <button className="advisor-action advisor-secondary" type="button">
          View insight
          <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  )
}
