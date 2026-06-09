import { StatusBadge } from '../../components/StatusBadge'
import { todaysAppointments } from '../../services/mockDashboard'

export function TodaySchedule() {
  return (
    <section className="panel schedule-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Live operations</span>
          <h2 className="panel-title">Today&apos;s schedule</h2>
        </div>
        <a className="panel-link" href="/appointments">
          View calendar
        </a>
      </div>
      <div className="schedule-list">
        {todaysAppointments.map((appointment) => (
          <article className="schedule-item" key={appointment.id}>
            <time className="schedule-time">{appointment.time}</time>
            <span className={`schedule-marker ${appointment.color}`} />
            <div>
              <div className="schedule-name">{appointment.customer}</div>
              <div className="schedule-service">
                {appointment.service} · {appointment.therapist}
              </div>
            </div>
            <StatusBadge label={appointment.status} />
          </article>
        ))}
      </div>
    </section>
  )
}
