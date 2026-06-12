import {
  Crown,
  DoorOpen,
  MessageCircleMore,
  PackageOpen,
  UserRound,
  WalletCards,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '../../types/appointments'
import {
  buildWhatsAppUrl,
  getCustomerInsight,
} from './appointmentIntelligence'

const statusClass: Record<AppointmentStatus, string> = {
  Pending: 'neutral',
  Confirmed: 'teal',
  'Checked In': 'gold',
  'In Progress': 'purple',
  Completed: 'success',
  Cancelled: 'danger',
  'No Show': 'danger',
}

interface SmartAppointmentCardProps {
  appointment: Appointment
  compact?: boolean
  draggable?: boolean
  onDragStart?: (appointmentId: string) => void
}

export function SmartAppointmentCard({
  appointment,
  compact = false,
  draggable = false,
  onDragStart,
}: SmartAppointmentCardProps) {
  const insight = getCustomerInsight(appointment.customer)

  return (
    <article
      className={`smart-appointment-card ${compact ? 'is-compact' : ''}`}
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/appointment-id', appointment.id)
        onDragStart?.(appointment.id)
      }}
    >
      <div className="smart-card-topline">
        <span>{appointment.time} · {appointment.duration} min</span>
        <span className={`domain-badge ${statusClass[appointment.status]}`}>
          {appointment.status}
        </span>
      </div>

      <div className="smart-card-person">
        <span className="record-avatar">
          {appointment.customer
            .split(' ')
            .map((part) => part[0])
            .join('')}
        </span>
        <div>
          <strong>{appointment.customer}</strong>
          <span>{appointment.service}</span>
        </div>
      </div>

      <div className="smart-card-value">
        <span><Crown size={12} /> {insight.membershipTier}</span>
        <span><PackageOpen size={12} /> {insight.packageBalance} sessions</span>
        <span><WalletCards size={12} /> RM {insight.lifetimeSpending.toLocaleString()}</span>
      </div>

      <div className="smart-card-assignment">
        <span><UserRound size={12} /> {appointment.therapist}</span>
        <span><DoorOpen size={12} /> {appointment.room}</span>
      </div>

      {!compact && (
        <div className="smart-card-actions">
          <a
            href={buildWhatsAppUrl(appointment, 'Reminder')}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircleMore size={13} />
            Reminder
          </a>
          <a
            href={buildWhatsAppUrl(appointment, 'Arrival')}
            target="_blank"
            rel="noreferrer"
          >
            Arrival note
          </a>
        </div>
      )}
    </article>
  )
}
