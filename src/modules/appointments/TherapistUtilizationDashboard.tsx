import { Activity, CircleDollarSign, Gauge, UserRoundCheck } from 'lucide-react'
import type { Appointment } from '../../types/appointments'
import { therapists } from './appointmentIntelligence'

interface TherapistUtilizationDashboardProps {
  appointments: Appointment[]
}

export function TherapistUtilizationDashboard({
  appointments,
}: TherapistUtilizationDashboardProps) {
  return (
    <section className="utilization-panel panel">
      <div className="utilization-heading">
        <div>
          <span className="panel-kicker">Capacity intelligence</span>
          <h2 className="panel-title">Therapist Utilization</h2>
        </div>
        <span>Based on an 8-hour treatment day</span>
      </div>

      <div className="utilization-grid">
        {therapists.map((therapist) => {
          const therapistAppointments = appointments.filter(
            (item) =>
              item.therapist === therapist &&
              !['Cancelled', 'No Show'].includes(item.status),
          )
          const completed = therapistAppointments.filter(
            (item) => item.status === 'Completed',
          )
          const bookedMinutes = therapistAppointments.reduce(
            (sum, item) => sum + item.duration,
            0,
          )
          const utilization = Math.min(
            100,
            Math.round((bookedMinutes / 480) * 100),
          )
          const completion = therapistAppointments.length
            ? Math.round((completed.length / therapistAppointments.length) * 100)
            : 0
          const revenue = completed.reduce((sum, item) => sum + item.price, 0)

          return (
            <article key={therapist}>
              <div className="utilization-person">
                <span>{therapist.split(' ').map((part) => part[0]).join('')}</span>
                <strong>{therapist}</strong>
              </div>
              <div className="utilization-metrics">
                <span><Activity size={13} /> Appointments <strong>{therapistAppointments.length}</strong></span>
                <span><CircleDollarSign size={13} /> Revenue <strong>RM {revenue}</strong></span>
                <span><Gauge size={13} /> Utilization <strong>{utilization}%</strong></span>
                <span><UserRoundCheck size={13} /> Completion <strong>{completion}%</strong></span>
              </div>
              <div className="utilization-progress">
                <span style={{ width: `${utilization}%` }} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
