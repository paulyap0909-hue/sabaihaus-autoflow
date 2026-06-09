import { therapistSnapshots } from '../../services/mockDashboard'

export function TherapistSnapshot() {
  return (
    <section className="panel team-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Team today</span>
          <h2 className="panel-title">Therapist performance</h2>
        </div>
        <a className="panel-link" href="/therapists">
          View team
        </a>
      </div>
      <div className="therapist-list">
        {therapistSnapshots.map((therapist) => (
          <article className="therapist-item" key={therapist.id}>
            <span className="therapist-avatar">{therapist.initials}</span>
            <div className="therapist-copy">
              <div className="therapist-name">{therapist.name}</div>
              <div className="therapist-meta">
                {therapist.sessions} sessions · {therapist.rebookingRate}% rebook
              </div>
            </div>
            <div className="therapist-revenue">
              <strong>{therapist.revenue}</strong>
              <span>revenue</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
