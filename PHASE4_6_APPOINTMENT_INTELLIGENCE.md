# Phase 4.6 Appointment Intelligence Center

Phase 4.6 turns the appointment page into a schedule-first operational workspace
while preserving the Phase 4.5 completion engine.

## Workspace Views

- **Schedule**: therapist calendar with drag-and-drop rescheduling.
- **Treatment Flow**: aligned operational rows with customer value context.
- **Live Queue**: Waiting, Checked In, In Progress, and Completed lanes.
- **Rooms**: allocations, utilization, availability, and overlap warnings.

## Scheduling Safety

Every drag-and-drop move checks:

- Therapist overlap for the selected time.
- Room overlap for the selected time.
- Appointment duration, not only the displayed start hour.

Conflicting moves are rejected and the existing appointment remains unchanged.
New appointments use the same conflict check.

## Google Calendar Boundary

`src/services/calendar/googleCalendarAdapter.ts` defines the production
integration boundary:

- Create event.
- Update event.
- Delete event.
- Synchronize therapist calendars.

The current adapter is an in-browser demo implementation because Google Calendar
OAuth requires authenticated server-side token storage and refresh handling.
The UI already calls the adapter for booking creation, drag-and-drop changes,
status updates, cancellations, and full calendar sync.

A production adapter should be implemented in a Supabase Edge Function or
another trusted backend. Google client secrets and refresh tokens must never be
stored in Vite environment variables or browser local storage.

## Customer Intelligence

Smart appointment cards combine existing mock customer, membership, and package
data to display:

- Customer name.
- Membership tier.
- Remaining package sessions.
- Lifetime spending.
- Therapist.
- Treatment room.

## WhatsApp Actions

Quick actions generate prefilled `wa.me` links for reminders, arrival notes, and
aftercare. They do not send messages automatically.

## Future Production Steps

1. Add Google OAuth account and therapist calendar mapping tables.
2. Store encrypted refresh tokens in a trusted server environment.
3. Add webhook channels and incremental sync tokens.
4. Persist room definitions, operating hours, and therapist availability.
5. Add database exclusion constraints or transactional conflict checks.
6. Subscribe the live queue to Supabase Realtime.
7. Replace `wa.me` links with approved WhatsApp Business templates and delivery
   status tracking.
