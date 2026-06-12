-- Phase 4.8 audit patch: canonical communication and engagement persistence.

create or replace function public.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'organization_id', '')::uuid;
$$;

create or replace function public.current_branch_id()
returns uuid
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'branch_id', '')::uuid;
$$;

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  channel text not null check (channel in ('WhatsApp', 'Email', 'SMS')),
  purpose text not null check (purpose in (
    'Appointment Reminder',
    'Check-In Reminder',
    'Arrival Reminder',
    'Aftercare Message',
    'Birthday Message',
    'Package Expiry',
    'Membership Renewal',
    'Win-Back Campaign'
  )),
  trigger_type text not null,
  content text not null,
  variables text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, branch_id, channel, purpose, name)
);

create table public.message_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  template_id uuid references public.message_templates(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null check (channel in ('WhatsApp', 'Email', 'SMS')),
  purpose text not null check (purpose in (
    'Appointment Reminder',
    'Check-In Reminder',
    'Arrival Reminder',
    'Aftercare Message',
    'Birthday Message',
    'Package Expiry',
    'Membership Renewal',
    'Win-Back Campaign'
  )),
  recipient text not null,
  rendered_content text not null,
  variables jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz not null,
  status text not null default 'Scheduled'
    check (status in ('Scheduled', 'Pending', 'Sent', 'Failed', 'Cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  cancelled_at timestamptz,
  provider_message_id text,
  idempotency_key text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table public.communication_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  message_queue_id uuid references public.message_queue(id) on delete set null,
  template_id uuid references public.message_templates(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null check (channel in ('WhatsApp', 'Email', 'SMS')),
  direction text not null default 'Outbound'
    check (direction in ('Outbound', 'Inbound')),
  event_type text not null check (event_type in (
    'Queued',
    'Dispatch Attempted',
    'Sent',
    'Delivered',
    'Read',
    'Failed',
    'Cancelled',
    'Reply Received'
  )),
  provider_message_id text,
  recipient text,
  content_snapshot text,
  provider_payload jsonb not null default '{}'::jsonb,
  error_message text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.rebooking_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  source_appointment_id uuid not null references public.appointments(id) on delete cascade,
  therapist_id uuid references public.therapists(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  priority_score integer not null check (priority_score between 0 and 100),
  suggested_date date not null,
  reason text not null,
  status text not null default 'Open'
    check (status in ('Open', 'Contacted', 'Booked', 'Dismissed', 'Expired')),
  expected_revenue_minor bigint not null default 0
    check (expected_revenue_minor >= 0),
  resolved_appointment_id uuid references public.appointments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, branch_id, source_appointment_id)
);

create table public.renewal_opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  opportunity_type text not null
    check (opportunity_type in ('Package', 'Membership')),
  customer_package_id uuid references public.customer_packages(id) on delete cascade,
  customer_membership_id uuid references public.customer_memberships(id) on delete cascade,
  package_definition_id uuid references public.package_definitions(id) on delete set null,
  membership_plan_id uuid references public.membership_plans(id) on delete set null,
  due_date date not null,
  remaining_sessions integer check (remaining_sessions is null or remaining_sessions >= 0),
  expected_revenue_minor bigint not null default 0
    check (expected_revenue_minor >= 0),
  priority_score integer not null check (priority_score between 0 and 100),
  status text not null default 'Open'
    check (status in ('Open', 'Contacted', 'Renewed', 'Dismissed', 'Expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (opportunity_type = 'Package' and customer_package_id is not null and customer_membership_id is null)
    or
    (opportunity_type = 'Membership' and customer_membership_id is not null and customer_package_id is null)
  )
);

create table public.customer_timeline (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  event_type text not null check (event_type in (
    'Appointment',
    'Message',
    'Package Redemption',
    'Membership Event',
    'Follow Up',
    'Note'
  )),
  title text not null,
  detail text not null,
  status text,
  occurred_at timestamptz not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  message_queue_id uuid references public.message_queue(id) on delete set null,
  communication_log_id uuid references public.communication_logs(id) on delete set null,
  package_redemption_id uuid references public.package_redemptions(id) on delete set null,
  customer_membership_id uuid references public.customer_memberships(id) on delete set null,
  follow_up_task_id uuid references public.follow_up_tasks(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index message_templates_scope_channel_idx
  on public.message_templates (organization_id, branch_id, channel, active);
create index message_queue_schedule_idx
  on public.message_queue (organization_id, branch_id, status, scheduled_at);
create index message_queue_customer_idx
  on public.message_queue (customer_id, created_at desc);
create index message_queue_provider_idx
  on public.message_queue (provider_message_id)
  where provider_message_id is not null;
create index communication_logs_customer_time_idx
  on public.communication_logs (customer_id, occurred_at desc);
create index communication_logs_provider_idx
  on public.communication_logs (provider_message_id)
  where provider_message_id is not null;
create index rebooking_opportunities_worklist_idx
  on public.rebooking_opportunities (
    organization_id,
    branch_id,
    status,
    priority_score desc,
    suggested_date
  );
create index rebooking_opportunities_customer_idx
  on public.rebooking_opportunities (customer_id, created_at desc);
create index renewal_opportunities_worklist_idx
  on public.renewal_opportunities (
    organization_id,
    branch_id,
    status,
    priority_score desc,
    due_date
  );
create index renewal_opportunities_customer_idx
  on public.renewal_opportunities (customer_id, created_at desc);
create index customer_timeline_customer_time_idx
  on public.customer_timeline (customer_id, occurred_at desc);
create index customer_timeline_scope_type_idx
  on public.customer_timeline (organization_id, branch_id, event_type, occurred_at desc);

create trigger message_templates_set_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

create trigger message_queue_set_updated_at
before update on public.message_queue
for each row execute function public.set_updated_at();

create trigger rebooking_opportunities_set_updated_at
before update on public.rebooking_opportunities
for each row execute function public.set_updated_at();

create trigger renewal_opportunities_set_updated_at
before update on public.renewal_opportunities
for each row execute function public.set_updated_at();

alter table public.message_templates enable row level security;
alter table public.message_queue enable row level security;
alter table public.communication_logs enable row level security;
alter table public.rebooking_opportunities enable row level security;
alter table public.renewal_opportunities enable row level security;
alter table public.customer_timeline enable row level security;
alter table public.google_calendar_connections enable row level security;
alter table public.google_calendar_event_links enable row level security;
alter table public.google_oauth_states enable row level security;

create policy message_templates_tenant_access
on public.message_templates
for all
to authenticated
using (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
)
with check (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy message_queue_tenant_access
on public.message_queue
for all
to authenticated
using (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
)
with check (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy communication_logs_tenant_select
on public.communication_logs
for select
to authenticated
using (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy communication_logs_tenant_insert
on public.communication_logs
for insert
to authenticated
with check (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy rebooking_opportunities_tenant_access
on public.rebooking_opportunities
for all
to authenticated
using (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
)
with check (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy renewal_opportunities_tenant_access
on public.renewal_opportunities
for all
to authenticated
using (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
)
with check (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy customer_timeline_tenant_select
on public.customer_timeline
for select
to authenticated
using (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

create policy customer_timeline_tenant_insert
on public.customer_timeline
for insert
to authenticated
with check (
  organization_id = public.current_organization_id()
  and branch_id = public.current_branch_id()
);

grant select, insert, update, delete
  on public.message_templates,
     public.message_queue,
     public.rebooking_opportunities,
     public.renewal_opportunities
  to authenticated;

grant select, insert
  on public.communication_logs,
     public.customer_timeline
  to authenticated;

revoke all
  on public.google_calendar_connections,
     public.google_calendar_event_links,
     public.google_oauth_states
  from anon, authenticated;

revoke all on function public.current_organization_id() from public;
revoke all on function public.current_branch_id() from public;
grant execute on function public.current_organization_id() to authenticated;
grant execute on function public.current_branch_id() to authenticated;

comment on table public.message_templates is
  'Canonical provider-neutral communication templates for WhatsApp, email, and SMS.';
comment on table public.message_queue is
  'Scheduled outbound communication work queue with provider idempotency and retry state.';
comment on table public.communication_logs is
  'Immutable communication delivery, webhook, failure, and inbound reply events.';
comment on table public.rebooking_opportunities is
  'Persisted rebooking recommendations generated after completed appointments.';
comment on table public.renewal_opportunities is
  'Persisted package and membership renewal worklist with expected revenue.';
comment on table public.customer_timeline is
  'Unified customer activity timeline across appointments, communication, packages, memberships, follow-ups, and notes.';
