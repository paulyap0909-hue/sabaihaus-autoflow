import {
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  Play,
  UserCheck,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '../../types/appointments'
import { buildWhatsAppUrl } from './appointmentIntelligence'

const queueColumns = ['Waiting', 'Checked In', 'In Progress', 'Completed'] as const
type QueueColumn = (typeof queueColumns)[number]

function queueColumnFor(status: AppointmentStatus): QueueColumn | null {
  if (status === 'Pending' || status === 'Confirmed') return 'Waiting'
  if (status === 'Checked In') return 'Checked In'
  if (status === 'In Progress') return 'In Progress'
  if (status === 'Completed') return 'Completed'
  return null
}

function queueAction(appointment: Appointment) {
  if (appointment.status === 'Pending') {
    return { label: 'Confirm', status: 'Confirmed' as const, icon: Clock3 }
  }
  if (appointment.status === 'Confirmed') {
    return { label: 'Check In', status: 'Checked In' as const, icon: UserCheck }
  }
  if (appointment.status === 'Checked In') {
    return { label: 'Start', status: 'In Progress' as const, icon: Play }
  }
  if (appointment.status === 'In Progress') {
    return { label: 'Complete', status: 'Completed' as const, icon: CheckCircle2 }
  }
  return null
}

interface RealtimeAppointmentQueueProps {
  appointments: Appointment[]
  processingId: string | null
  onStatusChange: (
    appointment: Appointment,
    status: AppointmentStatus,
  ) => void
}

export function RealtimeAppointmentQueue({
  appointments,
  processingId,
  onStatusChange,
}: RealtimeAppointmentQueueProps) {
  return (
    <section className="realtime-queue">
      {queueColumns.map((column) => {
        const queueAppointments = appointments.filter(
          (item) => queueColumnFor(item.status) === column,
        )

        return (
          <article className="queue-lane" key={column}>
            <header>
              <div>
                <span>{column}</span>
                <strong>{queueAppointments.length}</strong>
              </div>
              <small>Live treatment queue</small>
            </header>

            <div className="queue-lane-list">
              {queueAppointments.map((appointment) => {
                const action = queueAction(appointment)
                const ActionIcon = action?.icon

                return (
                  <div className="queue-guest-card" key={appointment.id}>
                    <div>
                      <span className="record-avatar">
                        {appointment.customer.split(' ').map((part) => part[0]).join('')}
                      </span>
                      <div>
                        <strong>{appointment.customer}</strong>
                        <span>{appointment.time} · {appointment.service}</span>
                      </div>
                    </div>
                    <p>{appointment.therapist} · {appointment.room}</p>
                    <div className="queue-card-actions">
                      <a
                        href={buildWhatsAppUrl(appointment, 'Arrival')}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`WhatsApp ${appointment.customer}`}
                      >
                        <MessageCircleMore size={14} />
                      </a>
                      {action && ActionIcon && (
                        <button
                          type="button"
                          disabled={processingId === appointment.id}
                          onClick={() => onStatusChange(appointment, action.status)}
                        >
                          <ActionIcon size={13} />
                          {processingId === appointment.id
                            ? 'Completing...'
                            : action.label}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}

              {queueAppointments.length === 0 && (
                <p className="queue-empty">No guests in this stage.</p>
              )}
            </div>
          </article>
        )
      })}
    </section>
  )
}
