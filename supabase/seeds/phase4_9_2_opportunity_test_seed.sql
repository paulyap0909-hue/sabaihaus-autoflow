-- Phase 4.9.2 Opportunity Engine validation seed.
-- Safe to rerun: deterministic UUIDs are updated with fresh relative dates.

begin;

-- Shared therapist.
insert into public.therapists (
  id,
  organization_id,
  branch_id,
  full_name,
  role_title,
  specialties,
  status,
  joined_on,
  rating
)
values (
  '49200000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Phase 4.9 Validation Therapist',
  'Senior Wellness Therapist',
  array['Head Spa', 'Deep Restore'],
  'Active',
  current_date - 365,
  4.90
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  full_name = excluded.full_name,
  role_title = excluded.role_title,
  specialties = excluded.specialties,
  status = excluded.status,
  joined_on = excluded.joined_on,
  rating = excluded.rating;

-- Services used by completed and pending appointments.
insert into public.services (
  id,
  organization_id,
  branch_id,
  name,
  category,
  duration_minutes,
  price_minor,
  active
)
values
  (
    '49210000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Validation Head Spa',
    'Head Spa',
    90,
    28000,
    true
  ),
  (
    '49210000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Validation Deep Restore',
    'Massage',
    60,
    22000,
    true
  )
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  name = excluded.name,
  category = excluded.category,
  duration_minutes = excluded.duration_minutes,
  price_minor = excluded.price_minor,
  active = excluded.active;

-- Customers:
-- 001: inactive over 21 days
-- 002: VIP + Diamond, inactive over 30 days
-- 003: package balance of one
-- 004: appointment awaiting confirmation
insert into public.customers (
  id,
  organization_id,
  branch_id,
  full_name,
  phone,
  email,
  source,
  retention_status,
  last_visit_at,
  lifetime_value_minor,
  notes
)
values
  (
    '49220000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Validation Inactive Guest',
    '+601149200001',
    'phase492.inactive@sabaihaus.test',
    'WhatsApp',
    'Follow Up Soon',
    now() - interval '28 days',
    84000,
    'Phase 4.9.2 inactive customer test.'
  ),
  (
    '49220000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Validation Diamond VIP',
    '+601149200002',
    'phase492.vip@sabaihaus.test',
    'Referral',
    'VIP',
    now() - interval '45 days',
    360000,
    'Phase 4.9.2 VIP rescue and Diamond membership test.'
  ),
  (
    '49220000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Validation Package Guest',
    '+601149200003',
    'phase492.package@sabaihaus.test',
    'Online',
    'Active',
    now() - interval '8 days',
    120000,
    'Phase 4.9.2 one remaining session test.'
  ),
  (
    '49220000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Validation Pending Guest',
    '+601149200004',
    'phase492.pending@sabaihaus.test',
    'Online',
    'Active',
    null,
    0,
    'Phase 4.9.2 unconfirmed appointment test.'
  )
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  full_name = excluded.full_name,
  phone = excluded.phone,
  email = excluded.email,
  source = excluded.source,
  retention_status = excluded.retention_status,
  last_visit_at = excluded.last_visit_at,
  lifetime_value_minor = excluded.lifetime_value_minor,
  notes = excluded.notes;

-- Package definition and one-session balance.
insert into public.package_definitions (
  id,
  organization_id,
  branch_id,
  name,
  category,
  total_sessions,
  validity_days,
  price_minor,
  active
)
values (
  '49230000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Validation Deep Restore 6',
  'Massage',
  6,
  180,
  118000,
  true
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  name = excluded.name,
  category = excluded.category,
  total_sessions = excluded.total_sessions,
  validity_days = excluded.validity_days,
  price_minor = excluded.price_minor,
  active = excluded.active;

insert into public.customer_packages (
  id,
  organization_id,
  branch_id,
  customer_id,
  package_definition_id,
  purchased_at,
  expires_at,
  total_sessions,
  remaining_sessions,
  status
)
values (
  '49240000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '49220000-0000-0000-0000-000000000003',
  '49230000-0000-0000-0000-000000000001',
  now() - interval '120 days',
  now() + interval '20 days',
  6,
  1,
  'Low Balance'
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  customer_id = excluded.customer_id,
  package_definition_id = excluded.package_definition_id,
  purchased_at = excluded.purchased_at,
  expires_at = excluded.expires_at,
  total_sessions = excluded.total_sessions,
  remaining_sessions = excluded.remaining_sessions,
  status = excluded.status;

-- Diamond plan and membership renewing within seven days.
insert into public.membership_plans (
  id,
  organization_id,
  branch_id,
  name,
  tier,
  price_minor,
  billing_interval,
  benefits,
  active
)
values (
  '49250000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Validation Diamond Membership',
  'Diamond',
  98000,
  'Monthly',
  '["Priority booking", "Premium wellness add-on"]'::jsonb,
  true
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  name = excluded.name,
  tier = excluded.tier,
  price_minor = excluded.price_minor,
  billing_interval = excluded.billing_interval,
  benefits = excluded.benefits,
  active = excluded.active;

insert into public.customer_memberships (
  id,
  organization_id,
  branch_id,
  customer_id,
  membership_plan_id,
  status,
  started_at,
  renews_at
)
values (
  '49260000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  '49220000-0000-0000-0000-000000000002',
  '49250000-0000-0000-0000-000000000001',
  'Renewal Due',
  now() - interval '360 days',
  now() + interval '5 days'
)
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  customer_id = excluded.customer_id,
  membership_plan_id = excluded.membership_plan_id,
  status = excluded.status,
  started_at = excluded.started_at,
  renews_at = excluded.renews_at,
  ended_at = null;

-- Two completed visits qualify for rebooking; one booked visit still needs confirmation.
insert into public.appointments (
  id,
  organization_id,
  branch_id,
  customer_id,
  therapist_id,
  service_id,
  starts_at,
  ends_at,
  room_name,
  status,
  source,
  price_minor,
  completed_at,
  notes
)
values
  (
    '49270000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '49220000-0000-0000-0000-000000000001',
    '49200000-0000-0000-0000-000000000001',
    '49210000-0000-0000-0000-000000000001',
    now() - interval '28 days',
    now() - interval '28 days' + interval '90 minutes',
    'Validation Room 1',
    'Completed',
    'WhatsApp',
    28000,
    now() - interval '28 days' + interval '90 minutes',
    'Phase 4.9.2 inactive rebooking source.'
  ),
  (
    '49270000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '49220000-0000-0000-0000-000000000002',
    '49200000-0000-0000-0000-000000000001',
    '49210000-0000-0000-0000-000000000002',
    now() - interval '45 days',
    now() - interval '45 days' + interval '60 minutes',
    'Validation Room 2',
    'Completed',
    'Referral',
    22000,
    now() - interval '45 days' + interval '60 minutes',
    'Phase 4.9.2 VIP rebooking source.'
  ),
  (
    '49270000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '49220000-0000-0000-0000-000000000004',
    '49200000-0000-0000-0000-000000000001',
    '49210000-0000-0000-0000-000000000001',
    now() + interval '24 hours',
    now() + interval '25 hours 30 minutes',
    'Validation Room 1',
    'Booked',
    'Online',
    28000,
    null,
    'Phase 4.9.2 appointment confirmation test.'
  )
on conflict (id) do update set
  organization_id = excluded.organization_id,
  branch_id = excluded.branch_id,
  customer_id = excluded.customer_id,
  therapist_id = excluded.therapist_id,
  service_id = excluded.service_id,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  room_name = excluded.room_name,
  status = excluded.status,
  source = excluded.source,
  price_minor = excluded.price_minor,
  customer_package_id = null,
  completed_at = excluded.completed_at,
  notes = excluded.notes;

commit;

-- Expected source cases after this seed:
-- 2 completed appointments older than 21 days, one belonging to a VIP/Diamond customer
-- 1 customer package with one remaining session
-- 1 Diamond membership renewing in five days
-- 1 booked, unconfirmed appointment starting in 24 hours
