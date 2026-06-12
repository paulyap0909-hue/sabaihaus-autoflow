import type { AppointmentStatus } from '../../../types/appointments'

export const appointmentStatuses: AppointmentStatus[] = [
  'Pending',
  'Confirmed',
  'Checked In',
  'In Progress',
  'Completed',
  'Cancelled',
  'No Show',
]

const allowedTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  Pending: ['Confirmed', 'Cancelled'],
  Confirmed: ['Checked In', 'Cancelled', 'No Show'],
  'Checked In': ['In Progress', 'Cancelled', 'No Show'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
  'No Show': [],
}

export function canTransitionAppointment(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus)
}

export function assertAppointmentTransition(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
): void {
  if (!canTransitionAppointment(currentStatus, nextStatus)) {
    throw new Error(
      `Appointment cannot move from ${currentStatus} to ${nextStatus}.`,
    )
  }
}
