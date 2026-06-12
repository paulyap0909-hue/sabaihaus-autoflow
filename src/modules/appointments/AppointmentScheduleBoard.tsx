import { CalendarRange, GripVertical } from 'lucide-react'
import type { Appointment } from '../../types/appointments'
import { scheduleSlots, therapists } from './appointmentIntelligence'
import { SmartAppointmentCard } from './SmartAppointmentCard'

interface AppointmentScheduleBoardProps {
  appointments: Appointment[]
  date: string
  onReschedule: (
    appointmentId: string,
    therapist: string,
    time: string,
  ) => void
}

export function AppointmentScheduleBoard({
  appointments,
  date,
  onReschedule,
}: AppointmentScheduleBoardProps) {
  const activeAppointments = appointments.filter(
    (item) =>
      item.date === date && !['Cancelled', 'No Show'].includes(item.status),
  )

  return (
    <section className="schedule-workspace panel">
      <div className="schedule-workspace-heading">
        <div>
          <span className="panel-kicker">Drag and drop scheduling</span>
          <h2 className="panel-title">Therapist Calendar</h2>
        </div>
        <span className="schedule-drag-hint">
          <GripVertical size={14} />
          Move cards to reschedule
        </span>
      </div>

      <div className="schedule-board-scroll">
        <div className="schedule-board">
          <div className="schedule-corner">
            <CalendarRange size={16} />
            Time
          </div>
          {therapists.map((therapist) => (
            <div className="schedule-therapist-heading" key={therapist}>
              <span>{therapist.split(' ').map((part) => part[0]).join('')}</span>
              <div>
                <strong>{therapist}</strong>
                <small>
                  {activeAppointments.filter((item) => item.therapist === therapist).length} bookings
                </small>
              </div>
            </div>
          ))}

          {scheduleSlots.map((slot) => (
            <div className="schedule-row" key={slot}>
              <time>{slot}</time>
              {therapists.map((therapist) => {
                const slotAppointments = activeAppointments.filter(
                  (item) =>
                    item.therapist === therapist &&
                    item.time.slice(0, 2) === slot.slice(0, 2),
                )

                return (
                  <div
                    className="schedule-drop-zone"
                    key={`${slot}-${therapist}`}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const appointmentId = event.dataTransfer.getData(
                        'text/appointment-id',
                      )
                      if (appointmentId) {
                        onReschedule(appointmentId, therapist, slot)
                      }
                    }}
                  >
                    {slotAppointments.map((appointment) => (
                      <SmartAppointmentCard
                        appointment={appointment}
                        compact
                        draggable
                        key={appointment.id}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
