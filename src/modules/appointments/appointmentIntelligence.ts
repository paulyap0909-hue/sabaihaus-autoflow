import type {
  Appointment,
  AppointmentCustomerInsight,
  TreatmentRoom,
} from '../../types/appointments'
import { customerPackages, memberships } from '../../services/mockPhase3'
import { customers } from '../../services/mockOperations'

export const appointmentViews = [
  'Schedule',
  'Treatment Flow',
  'Live Queue',
  'Rooms',
] as const

export type AppointmentView = (typeof appointmentViews)[number]

export const therapists = ['Nok S.', 'Aom M.', 'Mei L.', 'Pim J.']

export const scheduleSlots = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
]

export const treatmentRooms: TreatmentRoom[] = [
  {
    id: 'ROOM-LOTUS-1',
    name: 'Lotus 1',
    zone: 'Lotus Wing',
    capacity: 1,
    features: ['Massage bed', 'Hot towel'],
    status: 'Occupied',
  },
  {
    id: 'ROOM-LOTUS-2',
    name: 'Lotus 2',
    zone: 'Lotus Wing',
    capacity: 1,
    features: ['Aromatherapy', 'Sound care'],
    status: 'Occupied',
  },
  {
    id: 'ROOM-LOTUS-3',
    name: 'Lotus 3',
    zone: 'Lotus Wing',
    capacity: 1,
    features: ['Lymphatic setup', 'Quiet room'],
    status: 'Available',
  },
  {
    id: 'ROOM-SIAM-1',
    name: 'Siam 1',
    zone: 'Siam Wing',
    capacity: 1,
    features: ['Head spa basin', 'Scalp camera'],
    status: 'Occupied',
  },
  {
    id: 'ROOM-SIAM-2',
    name: 'Siam 2',
    zone: 'Siam Wing',
    capacity: 2,
    features: ['Thai mats', 'Couple setup'],
    status: 'Occupied',
  },
]

export function getCustomerInsight(
  customerName: string,
): AppointmentCustomerInsight {
  const customer = customers.find((item) => item.name === customerName)
  const membership = memberships.find((item) => item.customer === customerName)
  const customerPackage = customerPackages.find(
    (item) => item.customer === customerName && item.status !== 'Expired',
  )

  return {
    membershipTier:
      membership?.tier ?? customer?.membershipTier ?? 'Guest',
    packageBalance:
      customerPackage?.remainingSessions ?? customer?.packageBalance ?? 0,
    lifetimeSpending: customer?.lifetimeValue ?? 0,
  }
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export function appointmentsOverlap(
  first: Pick<Appointment, 'time' | 'duration'>,
  second: Pick<Appointment, 'time' | 'duration'>,
): boolean {
  const firstStart = timeToMinutes(first.time)
  const secondStart = timeToMinutes(second.time)
  return (
    firstStart < secondStart + second.duration &&
    secondStart < firstStart + first.duration
  )
}

export function findSchedulingConflict(
  candidate: Appointment,
  appointments: Appointment[],
): string | null {
  const conflict = appointments.find(
    (item) =>
      item.id !== candidate.id &&
      item.date === candidate.date &&
      !['Cancelled', 'No Show'].includes(item.status) &&
      appointmentsOverlap(candidate, item) &&
      (item.room === candidate.room || item.therapist === candidate.therapist),
  )

  if (!conflict) return null

  if (conflict.room === candidate.room) {
    return `${candidate.room} is already allocated to ${conflict.customer} at ${conflict.time}.`
  }

  return `${candidate.therapist} is already booked with ${conflict.customer} at ${conflict.time}.`
}

export function buildWhatsAppUrl(
  appointment: Appointment,
  intent: 'Reminder' | 'Arrival' | 'Aftercare',
): string {
  const messages = {
    Reminder: `Hi ${appointment.customer}, a gentle reminder of your ${appointment.service} appointment at Sabai Haus on ${appointment.date} at ${appointment.time}.`,
    Arrival: `Hi ${appointment.customer}, we are ready to welcome you at Sabai Haus. Your treatment room is ${appointment.room}.`,
    Aftercare: `Hi ${appointment.customer}, thank you for visiting Sabai Haus. How are you feeling after your ${appointment.service} treatment?`,
  }
  const phone = appointment.phone.replace(/\D/g, '')
  return `https://wa.me/${phone}?text=${encodeURIComponent(messages[intent])}`
}
