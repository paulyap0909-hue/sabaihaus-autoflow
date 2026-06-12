import { Award, Star, TrendingUp } from 'lucide-react'
import type { TherapistIntelligence } from '../../types/businessIntelligence'

interface TherapistIntelligenceViewProps {
  therapists: TherapistIntelligence[]
}

export function TherapistIntelligenceView({
  therapists,
}: TherapistIntelligenceViewProps) {
  return (
    <div className="bi-section-grid">
      <section className="top-performer-grid">
        {therapists.slice(0, 3).map((therapist, index) => (
          <article className={index === 0 ? 'is-leading' : ''} key={therapist.id}>
            <span className="performer-rank">0{index + 1}</span>
            <div className="performer-avatar">{therapist.initials}</div>
            <div>
              <span>{index === 0 ? 'Top performer' : 'High performer'}</span>
              <h3>{therapist.name}</h3>
              <p>RM {therapist.revenue.toLocaleString()} revenue</p>
            </div>
            <span className="performer-growth"><TrendingUp size={13} /> +{therapist.revenueChange}%</span>
          </article>
        ))}
      </section>

      <section className="therapist-intelligence-panel panel">
        <div className="bi-panel-heading">
          <div>
            <span className="panel-kicker">Team economics</span>
            <h2 className="panel-title">Therapist Performance Matrix</h2>
          </div>
          <span>Revenue · Capacity · Retention</span>
        </div>
        <div className="therapist-bi-list">
          {therapists.map((therapist, index) => (
            <article key={therapist.id}>
              <span className="therapist-bi-rank">{index + 1}</span>
              <span className="therapist-bi-avatar">{therapist.initials}</span>
              <div className="therapist-bi-name">
                <strong>{therapist.name}</strong>
                <span><Star size={11} fill="currentColor" /> {therapist.rating}</span>
              </div>
              <div><span>Revenue</span><strong>RM {therapist.revenue.toLocaleString()}</strong></div>
              <div><span>Appointments</span><strong>{therapist.appointments}</strong></div>
              <div className="therapist-bi-meter">
                <span>Utilization</span>
                <strong>{therapist.utilization}%</strong>
                <i><span style={{ width: `${therapist.utilization}%` }} /></i>
              </div>
              <div><span>Completion</span><strong>{therapist.completionRate}%</strong></div>
              <div><span>Rebooking</span><strong>{therapist.rebookingRate}%</strong></div>
              <div><span>Upsell</span><strong>{therapist.upsellRate}%</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="team-opportunity-panel panel">
        <Award size={20} />
        <div>
          <span className="panel-kicker">Performance opportunity</span>
          <h2>Pim J. has the strongest available growth capacity.</h2>
          <p>
            A 4.7 rating with 72% utilization creates room for targeted
            lymphatic-recovery demand without adding payroll hours.
          </p>
        </div>
        <strong>RM 4,600<small>monthly upside</small></strong>
      </section>
    </div>
  )
}
