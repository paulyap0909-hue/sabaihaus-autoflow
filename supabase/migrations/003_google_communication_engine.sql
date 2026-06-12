-- Phase 4.8: Google Calendar connections and communication workflow foundation.
-- OAuth token encryption/decryption must be performed only by trusted Edge Functions.

alter table public.notification_queue
  drop constraint if exists notification_queue_status_check;

update public.notification_queue
set status = 'Pending'
where status = 'Paused';

alter table public.notification_queue
  add constraint notification_queue_status_check
    check (status in ('Scheduled', 'Pending', 'Sent', 'Failed', 'Cancelled'));

create table public.google_calendar_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  google_account_email text,
  google_calendar_id text,
  google_calendar_name text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  granted_scopes text[] not null default '{}',
  sync_status text not null default 'Disconnected'
    check (sync_status in ('Connected', 'Disconnected', 'Sync Error')),
  sync_cursor text,
  last_sync_at timestamptz,
  last_error text,
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, branch_id, therapist_id)
);

create table public.google_calendar_event_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  connection_id uuid not null references public.google_calendar_connections(id) on delete cascade,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  google_event_id text not null,
  google_event_etag text,
  google_updated_at timestamptz,
  last_synced_at timestamptz not null default now(),
  sync_direction text not null default 'AutoFlow to Google'
    check (sync_direction in ('AutoFlow to Google', 'Google to AutoFlow')),
  sync_status text not null default 'Synced'
    check (sync_status in ('Synced', 'Pending', 'Conflict', 'Error', 'Deleted')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, google_event_id),
  unique (appointment_id)
);

create table public.google_oauth_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  therapist_id uuid not null references public.therapists(id) on delete cascade,
  state_hash text not null unique,
  code_verifier_ciphertext text not null,
  redirect_uri text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index google_calendar_connections_scope_idx
  on public.google_calendar_connections (organization_id, branch_id, sync_status);
create index google_calendar_event_links_appointment_idx
  on public.google_calendar_event_links (appointment_id, sync_status);
create index google_oauth_states_expiry_idx
  on public.google_oauth_states (expires_at)
  where consumed_at is null;

create trigger google_calendar_connections_set_updated_at
before update on public.google_calendar_connections
for each row execute function public.set_updated_at();

create trigger google_calendar_event_links_set_updated_at
before update on public.google_calendar_event_links
for each row execute function public.set_updated_at();

comment on table public.google_calendar_connections is
  'Server-managed Google OAuth connection per therapist. Token ciphertext must never be returned to browser clients.';
comment on table public.google_calendar_event_links is
  'Bidirectional appointment-to-Google event mapping and synchronization audit state.';
comment on table public.google_oauth_states is
  'Short-lived PKCE OAuth state consumed by trusted Supabase Edge Functions.';

-- Production RLS must expose connection metadata only. Token columns remain
-- service-role / Edge Function data and must never be selectable by clients.
