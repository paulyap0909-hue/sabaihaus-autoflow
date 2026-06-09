export type AppointmentStatus =
  | 'Booked'
  | 'Confirmed'
  | 'Checked In'
  | 'In Treatment'
  | 'Completed'
  | 'Cancelled'
  | 'No Show'

export type AppointmentSource = 'Walk-in' | 'WhatsApp' | 'Online' | 'Referral'

export interface Appointment {
  id: string
  customer: string
  phone: string
  service: string
  therapist: string
  room: string
  date: string
  time: string
  duration: number
  status: AppointmentStatus
  price: number
  source: AppointmentSource
  notes?: string
}
