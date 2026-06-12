export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Checked In'
  | 'In Progress'
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
  googleEventId?: string
  notes?: string
}

export interface AppointmentCustomerInsight {
  membershipTier: string
  packageBalance: number
  lifetimeSpending: number
}

export interface TreatmentRoom {
  id: string
  name: string
  zone: 'Lotus Wing' | 'Siam Wing'
  capacity: number
  features: string[]
  status: 'Available' | 'Occupied' | 'Turnover'
}
