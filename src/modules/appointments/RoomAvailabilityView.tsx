import { AlertTriangle, CheckCircle2, DoorOpen, Sparkles } from 'lucide-react'
import type { Appointment } from '../../types/appointments'
import {
  appointmentsOverlap,
  treatmentRooms,
} from './appointmentIntelligence'

interface RoomAvailabilityViewProps {
  appointments: Appointment[]
  date: string
}

export function RoomAvailabilityView({
  appointments,
  date,
}: RoomAvailabilityViewProps) {
  return (
    <section className="room-availability-grid">
      {treatmentRooms.map((room) => {
        const roomAppointments = appointments
          .filter(
            (item) =>
              item.room === room.name &&
              item.date === date &&
              !['Cancelled', 'No Show'].includes(item.status),
          )
          .sort((first, second) => first.time.localeCompare(second.time))
        const hasConflict = roomAppointments.some((appointment, index) =>
          roomAppointments
            .slice(index + 1)
            .some((item) => appointmentsOverlap(appointment, item)),
        )
        const occupiedMinutes = roomAppointments.reduce(
          (sum, item) => sum + item.duration,
          0,
        )

        return (
          <article className="room-card" key={room.id}>
            <header>
              <span className="room-card-icon"><DoorOpen size={18} /></span>
              <div>
                <strong>{room.name}</strong>
                <span>{room.zone} · Capacity {room.capacity}</span>
              </div>
              <span className={`domain-badge ${hasConflict ? 'danger' : roomAppointments.length ? 'gold' : 'success'}`}>
                {hasConflict ? 'Conflict' : roomAppointments.length ? 'Allocated' : 'Available'}
              </span>
            </header>

            <div className="room-features">
              {room.features.map((feature) => (
                <span key={feature}><Sparkles size={11} /> {feature}</span>
              ))}
            </div>

            <div className="room-utilization-line">
              <span>Daily room utilization</span>
              <strong>{Math.round((occupiedMinutes / 480) * 100)}%</strong>
              <div><span style={{ width: `${Math.min(100, (occupiedMinutes / 480) * 100)}%` }} /></div>
            </div>

            <div className="room-bookings">
              {roomAppointments.map((appointment) => (
                <div key={appointment.id}>
                  <time>{appointment.time}</time>
                  <span>
                    <strong>{appointment.customer}</strong>
                    <small>{appointment.service} · {appointment.therapist}</small>
                  </span>
                </div>
              ))}
              {roomAppointments.length === 0 && (
                <p><CheckCircle2 size={15} /> Open for allocation</p>
              )}
            </div>

            {hasConflict && (
              <p className="room-conflict-note">
                <AlertTriangle size={14} />
                Overlapping room allocation requires attention.
              </p>
            )}
          </article>
        )
      })}
    </section>
  )
}
