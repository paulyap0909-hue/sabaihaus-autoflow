import type {
  GoogleCalendarGateway,
  GoogleCalendarSyncResult,
  TherapistCalendarConnection,
} from '../../types/googleCalendar'
import { getSupabaseClient } from '../supabase/client'
import { demoGoogleCalendarAdapter } from './googleCalendarAdapter'

interface CalendarFunctionResponse<T> {
  data: T | null
  error: { message: string } | null
}

const therapistNames = ['Nok S.', 'Aom M.', 'Mei L.', 'Pim J.']

function functionsConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
      import.meta.env.VITE_SUPABASE_ANON_KEY &&
      import.meta.env.VITE_GOOGLE_CALENDAR_SYNC_ENABLED === 'true',
  )
}

async function invoke<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const result = (await getSupabaseClient().functions.invoke(name, {
    body,
  })) as CalendarFunctionResponse<T>

  if (result.error) {
    throw new Error(result.error.message)
  }
  if (!result.data) {
    throw new Error(`Google Calendar function ${name} returned no data.`)
  }
  return result.data
}

const fallbackConnections: TherapistCalendarConnection[] = therapistNames.map(
  (therapistName, index) => ({
    therapistId: `TH-0${index + 1}`,
    therapistName,
    calendarId: index < 3 ? `demo-${index + 1}@group.calendar.google.com` : null,
    calendarName: index < 3 ? `${therapistName} · Sabai Haus` : null,
    status: index < 3 ? 'Connected' : 'Disconnected',
    lastSyncAt: index < 3 ? '2026-06-12T08:45:00+08:00' : null,
    lastError: null,
  }),
)

export const googleCalendarGateway: GoogleCalendarGateway = {
  async getConnections() {
    if (!functionsConfigured()) return fallbackConnections
    return invoke<TherapistCalendarConnection[]>(
      'google-calendar-connections',
      {},
    )
  },

  async getAuthorizationUrl(therapistId) {
    if (!functionsConfigured()) {
      throw new Error(
        'Google Calendar OAuth requires the Supabase Edge Function gateway.',
      )
    }
    const result = await invoke<{ authorizationUrl: string }>(
      'google-calendar-oauth-start',
      { therapistId },
    )
    return result.authorizationUrl
  },

  async disconnectCalendar(therapistId) {
    if (!functionsConfigured()) return
    await invoke('google-calendar-disconnect', { therapistId })
  },

  async createEvent(appointment) {
    if (!functionsConfigured()) {
      return demoGoogleCalendarAdapter.createEvent(appointment)
    }
    return invoke<GoogleCalendarSyncResult>('google-calendar-event', {
      operation: 'create',
      appointment,
    })
  },

  async updateEvent(appointment) {
    if (!functionsConfigured()) {
      return demoGoogleCalendarAdapter.updateEvent(appointment)
    }
    return invoke<GoogleCalendarSyncResult>('google-calendar-event', {
      operation: 'update',
      appointment,
    })
  },

  async deleteEvent(appointment) {
    if (!functionsConfigured()) {
      return demoGoogleCalendarAdapter.deleteEvent(appointment)
    }
    return invoke<GoogleCalendarSyncResult>('google-calendar-event', {
      operation: 'delete',
      appointment,
    })
  },

  async syncFromGoogle(therapistId) {
    if (!functionsConfigured()) return []
    return invoke<GoogleCalendarSyncResult[]>('google-calendar-pull-sync', {
      therapistId,
    })
  },
}

export async function connectTherapistCalendar(therapistId: string) {
  const authorizationUrl =
    await googleCalendarGateway.getAuthorizationUrl(therapistId)
  window.location.assign(authorizationUrl)
}

export function calendarIntegrationMode() {
  return functionsConfigured() ? 'Production gateway' : 'Safe demo fallback'
}
