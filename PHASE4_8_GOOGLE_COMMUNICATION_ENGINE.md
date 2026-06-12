# Phase 4.8 - Google and Communication Engine

## Overview

Phase 4.8 adds production integration boundaries for Google Calendar and
customer communication while preserving safe demo behavior when provider
credentials or server functions are unavailable.

Google credentials, refresh tokens, provider secrets, and message-provider
credentials are never stored in the Vite frontend.

## Google Calendar Architecture

Each therapist has an independent calendar connection with:

- Connected, Disconnected, or Sync Error status
- Google account and selected calendar metadata
- Last sync timestamp and error
- Incremental synchronization cursor
- Appointment-to-Google-event mapping

Supported frontend operations:

- Start therapist OAuth connection
- Disconnect therapist calendar
- Create Google event from appointment
- Update Google event from appointment
- Delete Google event when appointment is cancelled
- Pull Google changes into the appointment synchronization layer

The frontend gateway calls these Supabase Edge Functions:

- `google-calendar-oauth-start`
- `google-calendar-connections`
- `google-calendar-disconnect`
- `google-calendar-event`
- `google-calendar-pull-sync`

### Required Server Responsibilities

The Edge Function layer must:

1. Generate and validate OAuth state with PKCE.
2. Exchange authorization codes server-side.
3. Encrypt access and refresh tokens before persistence.
4. Refresh expired access tokens.
5. Resolve the therapist and tenant from authenticated server context.
6. Validate appointment ownership before Google API operations.
7. Store event IDs, ETags, sync cursor, errors, and timestamps.
8. Apply deterministic conflict rules for Google-to-appointment updates.

Set `VITE_GOOGLE_CALENDAR_SYNC_ENABLED=true` only after these functions,
authentication, RLS, Google credentials, and token encryption are deployed.

## Communication Center

Sidebar route: `/communication`

Tabs:

- WhatsApp
- Email
- SMS
- History

Included templates:

- Appointment Reminder
- Check-In Reminder
- Arrival Reminder
- Aftercare Message
- Birthday Message
- Package Expiry
- Membership Renewal
- Win-Back Campaign

Supported variables include:

- `{{customer_name}}`
- `{{appointment_time}}`
- `{{therapist_name}}`
- `{{package_balance}}`

Queue statuses:

- Scheduled
- Pending
- Sent
- Failed
- Cancelled

The provider-neutral communication gateway supports listing, enqueueing,
cancelling, and retrying messages through the `communication-dispatch` Edge
Function. It keeps WhatsApp, email, and SMS vendors outside the UI contract.

Set `VITE_COMMUNICATION_DISPATCH_ENABLED=true` only after provider credentials,
webhook verification, idempotency, rate limits, consent checks, and delivery
status processing are deployed.

## Rebooking Engine

The deterministic rebooking engine detects:

- Completed appointments
- No future active appointment for the same customer

It generates:

- Priority score
- Suggested date 30 days after completion
- Therapist and service context
- Reason for outreach

## Renewal Engine

The deterministic renewal engine detects:

- Package balance of two sessions or fewer
- Membership renewal within 30 days

It generates:

- Opportunity type
- Due date
- Priority score
- Expected renewal revenue

## Dashboard Action Center

The dashboard now shows:

- Today's Follow Ups
- Today's Renewals
- Today's Rebooking Opportunities
- Today's Expiring Packages

## Unified Customer Timeline

The customer profile combines:

- Appointments
- Messages
- Package redemptions
- Membership events
- Follow-ups
- Notes

## Database Migration

`supabase/migrations/003_google_communication_engine.sql` adds:

- `google_calendar_connections`
- `google_calendar_event_links`
- `google_oauth_states`
- Updated five-state notification queue constraint

The Phase 4.8 audit patch in
`supabase/migrations/004_phase4_8_communication_persistence.sql` adds the
canonical persistence layer:

- `message_templates`
- `message_queue`
- `communication_logs`
- `rebooking_opportunities`
- `renewal_opportunities`
- `customer_timeline`

It also enables RLS on the Google Calendar OAuth tables from migration 003.
Those tables remain service-role only; authenticated browser clients receive
calendar metadata through trusted Edge Functions.

Token ciphertext columns are server-only and must not be exposed through client
select policies.

## Environment Flags

```env
VITE_GOOGLE_CALENDAR_SYNC_ENABLED=false
VITE_COMMUNICATION_DISPATCH_ENABLED=false
```

These flags do not contain secrets. They only enable deployed server gateways.

## Verification

- `npm run lint`
- `npm run build`
