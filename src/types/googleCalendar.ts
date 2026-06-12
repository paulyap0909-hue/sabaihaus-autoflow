import type { Appointment } from './appointments'

export type GoogleCalendarConnectionStatus =
  | 'Connected'
  | 'Disconnected'
  | 'Sync Error'

export interface TherapistCalendarConnection {
  therapistId: string
  therapistName: string
  calendarId: string | null
  calendarName: string | null
  status: GoogleCalendarConnectionStatus
  lastSyncAt: string | null
  lastError: string | null
}

export interface GoogleCalendarSyncResult {
  eventId: string
  syncedAt: string
  operation: 'created' | 'updated' | 'deleted' | 'imported'
}

export interface GoogleCalendarGateway {
  getConnections(): Promise<TherapistCalendarConnection[]>
  getAuthorizationUrl(therapistId: string): Promise<string>
  disconnectCalendar(therapistId: string): Promise<void>
  createEvent(appointment: Appointment): Promise<GoogleCalendarSyncResult>
  updateEvent(appointment: Appointment): Promise<GoogleCalendarSyncResult>
  deleteEvent(appointment: Appointment): Promise<GoogleCalendarSyncResult>
  syncFromGoogle(
    therapistId?: string,
  ): Promise<GoogleCalendarSyncResult[]>
}
