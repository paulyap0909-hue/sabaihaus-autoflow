import type { Appointment } from '../../types/appointments'

export interface CalendarSyncResult {
  eventId: string
  syncedAt: string
  operation: 'created' | 'updated' | 'deleted'
}

export interface TherapistCalendarSync {
  therapist: string
  calendarName: string
  eventsSynced: number
  syncedAt: string
  status: 'Connected' | 'Syncing' | 'Attention'
}

export interface GoogleCalendarAdapter {
  createEvent: (appointment: Appointment) => Promise<CalendarSyncResult>
  updateEvent: (appointment: Appointment) => Promise<CalendarSyncResult>
  deleteEvent: (appointment: Appointment) => Promise<CalendarSyncResult>
  syncTherapistCalendars: (
    appointments: Appointment[],
  ) => Promise<TherapistCalendarSync[]>
}

const eventIds = new Map<string, string>()

function demoDelay() {
  return new Promise<void>((resolve) => window.setTimeout(resolve, 180))
}

function getEventId(appointment: Appointment) {
  const existing = appointment.googleEventId ?? eventIds.get(appointment.id)
  const eventId = existing ?? `gcal-${appointment.id.toLowerCase()}`
  eventIds.set(appointment.id, eventId)
  return eventId
}

export const demoGoogleCalendarAdapter: GoogleCalendarAdapter = {
  async createEvent(appointment) {
    await demoDelay()
    return {
      eventId: getEventId(appointment),
      syncedAt: new Date().toISOString(),
      operation: 'created',
    }
  },

  async updateEvent(appointment) {
    await demoDelay()
    return {
      eventId: getEventId(appointment),
      syncedAt: new Date().toISOString(),
      operation: 'updated',
    }
  },

  async deleteEvent(appointment) {
    await demoDelay()
    const eventId = getEventId(appointment)
    eventIds.delete(appointment.id)
    return {
      eventId,
      syncedAt: new Date().toISOString(),
      operation: 'deleted',
    }
  },

  async syncTherapistCalendars(appointments) {
    await demoDelay()
    const syncedAt = new Date().toISOString()
    const therapists = [...new Set(appointments.map((item) => item.therapist))]

    return therapists.map((therapist) => ({
      therapist,
      calendarName: `${therapist} · Sabai Haus`,
      eventsSynced: appointments.filter(
        (item) =>
          item.therapist === therapist &&
          !['Cancelled', 'No Show'].includes(item.status),
      ).length,
      syncedAt,
      status: 'Connected',
    }))
  },
}
