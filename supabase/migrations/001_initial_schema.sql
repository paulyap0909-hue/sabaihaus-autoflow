create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  full_name text not null,
  phone text not null,
  email text,
  birthday date,
  source text,
  retention_status text not null default 'Active'
    check (retention_status in ('Active', 'Follow Up Soon', 'At Risk', 'Lost', 'VIP')),
  last_visit_at timestamptz,
  lifetime_value_minor bigint not null default 0 check (lifetime_value_minor >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, phone)
);

create table public.therapists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  full_name text not null,
  role_title text,
  specialties text[] not null default '{}',
  status text not null default 'Active'
    check (status in ('Active', 'Inactive', 'On Leave')),
  joined_on date,
  rating numeric(3, 2) check (rating between 0 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  category text,
  duration_minutes integer not null check (duration_minutes > 0),
  price_minor bigint not null check (price_minor >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id),
  therapist_id uuid references public.therapists(id),
  service_id uuid not null references public.services(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  room_name text,
  status text not null default 'Booked'
    check (status in ('Booked', 'Confirmed', 'Checked In', 'In Treatment', 'Completed', 'Cancelled', 'No Show')),
  source text check (source in ('Walk-in', 'WhatsApp', 'Online', 'Referral')),
  price_minor bigint not null check (price_minor >= 0),
  customer_package_id uuid,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.wellness_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  overall_score integer check (overall_score between 0 and 100),
  risk_level text check (risk_level in ('Low', 'Moderate', 'High')),
  scores jsonb not null default '{}'::jsonb,
  notes text,
  recommendations text[] not null default '{}',
  assessed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.package_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  category text,
  total_sessions integer not null check (total_sessions > 0),
  validity_days integer not null check (validity_days > 0),
  price_minor bigint not null check (price_minor >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_packages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id),
  package_definition_id uuid not null references public.package_definitions(id),
  purchased_at timestamptz not null default now(),
  expires_at timestamptz not null,
  total_sessions integer not null check (total_sessions > 0),
  remaining_sessions integer not null check (remaining_sessions >= 0),
  status text not null default 'Active'
    check (status in ('Active', 'Low Balance', 'Expiring Soon', 'Expired', 'Fully Used')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (remaining_sessions <= total_sessions)
);

alter table public.appointments
  add constraint appointments_customer_package_id_fkey
  foreign key (customer_package_id) references public.customer_packages(id);

create table public.package_redemptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_package_id uuid not null references public.customer_packages(id),
  appointment_id uuid not null references public.appointments(id),
  sessions_redeemed integer not null default 1 check (sessions_redeemed > 0),
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id)
);

create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  tier text not null check (tier in ('Silver', 'Gold', 'Platinum', 'Diamond')),
  price_minor bigint not null check (price_minor >= 0),
  billing_interval text not null default 'Monthly'
    check (billing_interval in ('Monthly', 'Quarterly', 'Annual')),
  benefits jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id),
  membership_plan_id uuid not null references public.membership_plans(id),
  status text not null default 'Active'
    check (status in ('Active', 'Renewal Due', 'Paused', 'Cancelled', 'Expired')),
  started_at timestamptz not null default now(),
  renews_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  category text not null,
  current_stock numeric(12, 3) not null default 0 check (current_stock >= 0),
  unit text not null,
  reorder_level numeric(12, 3) not null default 0 check (reorder_level >= 0),
  cost_per_unit_minor bigint not null default 0 check (cost_per_unit_minor >= 0),
  supplier text,
  expiry_date date,
  status text not null default 'In Stock'
    check (status in ('In Stock', 'Low Stock', 'Out of Stock', 'Expiring Soon')),
  retail_product boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_usage_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  service_id uuid not null references public.services(id),
  inventory_item_id uuid not null references public.inventory_items(id),
  quantity_used numeric(12, 3) not null check (quantity_used > 0),
  unit text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, inventory_item_id)
);

create table public.inventory_usage_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  appointment_id uuid not null references public.appointments(id),
  inventory_item_id uuid not null references public.inventory_items(id),
  usage_rule_id uuid references public.inventory_usage_rules(id),
  quantity_used numeric(12, 3) not null check (quantity_used > 0),
  unit text not null,
  cost_minor bigint not null default 0 check (cost_minor >= 0),
  used_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  applies_to text not null
    check (applies_to in ('Service', 'Package', 'Product', 'Membership')),
  service_id uuid references public.services(id),
  calculation_type text not null
    check (calculation_type in ('Fixed', 'Percentage', 'Tiered')),
  rate numeric(12, 4) not null check (rate >= 0),
  effective_from date not null,
  effective_to date,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_to >= effective_from)
);

create table public.commission_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  therapist_id uuid not null references public.therapists(id),
  appointment_id uuid references public.appointments(id),
  commission_rule_id uuid references public.commission_rules(id),
  source_type text not null
    check (source_type in ('Appointment', 'Package Sale', 'Product Sale', 'Membership Sale', 'Adjustment')),
  source_amount_minor bigint not null default 0 check (source_amount_minor >= 0),
  commission_amount_minor bigint not null,
  rule_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'Pending'
    check (status in ('Pending', 'Approved', 'Paid', 'Reversed')),
  earned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.follow_up_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id),
  appointment_id uuid references public.appointments(id),
  task_type text not null
    check (task_type in ('Aftercare', 'Rebooking', 'Package Renewal', 'Membership Renewal', 'Recovery', 'Birthday')),
  due_at timestamptz not null,
  status text not null default 'Open'
    check (status in ('Open', 'In Progress', 'Completed', 'Cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  name text not null,
  channel text not null
    check (channel in ('WhatsApp', 'SMS', 'Email', 'MeTIME Wellness')),
  trigger_type text not null,
  audience text,
  message_content text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  customer_id uuid not null references public.customers(id),
  appointment_id uuid references public.appointments(id),
  template_id uuid references public.notification_templates(id),
  channel text not null
    check (channel in ('WhatsApp', 'SMS', 'Email', 'MeTIME Wellness')),
  recipient text not null,
  message_content text not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  status text not null default 'Scheduled'
    check (status in ('Scheduled', 'Sent', 'Failed', 'Paused', 'Cancelled')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  appointment_id uuid not null references public.appointments(id),
  event_type text not null
    check (event_type in ('Created', 'Confirmed', 'Checked In', 'Treatment Started', 'Completed', 'Cancelled', 'No Show', 'Corrected')),
  actor_id uuid,
  occurred_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index customers_org_branch_idx on public.customers (organization_id, branch_id);
create index appointments_org_branch_starts_idx on public.appointments (organization_id, branch_id, starts_at);
create index appointments_customer_idx on public.appointments (customer_id);
create index appointments_therapist_idx on public.appointments (therapist_id);
create index customer_packages_customer_idx on public.customer_packages (customer_id);
create index inventory_items_org_branch_status_idx on public.inventory_items (organization_id, branch_id, status);
create index commission_entries_therapist_earned_idx on public.commission_entries (therapist_id, earned_at);
create index follow_up_tasks_due_idx on public.follow_up_tasks (organization_id, branch_id, status, due_at);
create index notification_queue_schedule_idx on public.notification_queue (organization_id, branch_id, status, scheduled_at);
create index appointment_events_appointment_idx on public.appointment_events (appointment_id, occurred_at);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'customers',
    'therapists',
    'services',
    'appointments',
    'wellness_profiles',
    'package_definitions',
    'customer_packages',
    'package_redemptions',
    'membership_plans',
    'customer_memberships',
    'inventory_items',
    'inventory_usage_rules',
    'inventory_usage_logs',
    'commission_rules',
    'commission_entries',
    'follow_up_tasks',
    'notification_templates',
    'notification_queue',
    'appointment_events'
  ]
  loop
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

-- Row Level Security policies will be added with authentication and organization membership.
-- Until then, do not expose this schema to production clients.
