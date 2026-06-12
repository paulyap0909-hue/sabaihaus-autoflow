-- Phase 4.9.1: idempotent daily opportunity generation.
-- The scheduled job runs at 00:15 UTC (08:15 Asia/Kuala_Lumpur).

alter table public.rebooking_opportunities
  add column if not exists generation_key text;

alter table public.renewal_opportunities
  add column if not exists generation_key text;

create unique index if not exists rebooking_opportunities_generation_key_uidx
  on public.rebooking_opportunities (organization_id, branch_id, generation_key)
  where generation_key is not null;

create unique index if not exists renewal_opportunities_generation_key_uidx
  on public.renewal_opportunities (organization_id, branch_id, generation_key)
  where generation_key is not null;

create unique index if not exists customer_timeline_generation_key_uidx
  on public.customer_timeline (
    organization_id,
    branch_id,
    ((metadata ->> 'generation_key'))
  )
  where metadata ? 'generation_key';

create index if not exists customers_daily_opportunity_scan_idx
  on public.customers (organization_id, branch_id, retention_status, last_visit_at);

create index if not exists appointments_confirmation_scan_idx
  on public.appointments (organization_id, branch_id, status, starts_at)
  where status = 'Booked';

create index if not exists customer_packages_balance_scan_idx
  on public.customer_packages (
    organization_id,
    branch_id,
    remaining_sessions,
    expires_at
  )
  where remaining_sessions = 1
    and status in ('Active', 'Low Balance', 'Expiring Soon');

create index if not exists customer_memberships_renewal_scan_idx
  on public.customer_memberships (
    organization_id,
    branch_id,
    renews_at
  )
  where status in ('Active', 'Renewal Due')
    and renews_at is not null;

create or replace function public.generate_daily_opportunities_for_scope(
  p_organization_id uuid,
  p_branch_id uuid,
  p_scan_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate record;
  generation_key_value text;
  inserted_id uuid;
  rebooking_count integer := 0;
  renewal_count integer := 0;
  message_count integer := 0;
  timeline_count integer := 0;
begin
  if p_organization_id is null or p_branch_id is null then
    raise exception 'Organization and branch are required.';
  end if;

  -- Customers inactive for more than 21 days, including VIPs inactive over 30 days.
  for candidate in
    with latest_completed as (
      select distinct on (a.customer_id)
        a.id,
        a.customer_id,
        a.therapist_id,
        a.service_id,
        a.price_minor,
        coalesce(a.completed_at, a.starts_at) as visited_at
      from public.appointments a
      where a.organization_id = p_organization_id
        and a.branch_id = p_branch_id
        and a.status = 'Completed'
      order by a.customer_id, coalesce(a.completed_at, a.starts_at) desc
    )
    select
      c.id as customer_id,
      c.full_name,
      c.phone,
      c.retention_status,
      lc.id as appointment_id,
      lc.therapist_id,
      lc.service_id,
      lc.price_minor,
      lc.visited_at,
      greatest(
        0,
        floor(extract(epoch from (p_scan_at - lc.visited_at)) / 86400)
      )::integer as inactive_days
    from latest_completed lc
    join public.customers c on c.id = lc.customer_id
    where lc.visited_at < p_scan_at - interval '21 days'
      and not exists (
        select 1
        from public.appointments future
        where future.customer_id = c.id
          and future.organization_id = p_organization_id
          and future.branch_id = p_branch_id
          and future.starts_at > p_scan_at
          and future.status not in ('Cancelled', 'No Show')
      )
  loop
    generation_key_value := 'phase4.9.1:rebooking:' || candidate.appointment_id;
    inserted_id := null;

    insert into public.rebooking_opportunities (
      organization_id,
      branch_id,
      customer_id,
      source_appointment_id,
      therapist_id,
      service_id,
      priority_score,
      suggested_date,
      reason,
      expected_revenue_minor,
      generation_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      candidate.appointment_id,
      candidate.therapist_id,
      candidate.service_id,
      least(
        100,
        case
          when candidate.retention_status = 'VIP'
            and candidate.inactive_days > 30 then 90
          else 55
        end + floor(candidate.inactive_days / 7)::integer
      ),
      (p_scan_at + interval '7 days')::date,
      case
        when candidate.retention_status = 'VIP'
          and candidate.inactive_days > 30
          then 'VIP customer inactive for more than 30 days with no future booking.'
        else 'Customer inactive for more than 21 days with no future booking.'
      end,
      candidate.price_minor,
      generation_key_value
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      rebooking_count := rebooking_count + 1;
    end if;

    inserted_id := null;
    insert into public.message_queue (
      organization_id,
      branch_id,
      customer_id,
      channel,
      purpose,
      recipient,
      rendered_content,
      variables,
      scheduled_at,
      status,
      idempotency_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'WhatsApp',
      'Win-Back Campaign',
      candidate.phone,
      case
        when candidate.retention_status = 'VIP'
          then 'Hi ' || candidate.full_name || ', we would love to welcome you back to Sabai Haus. May we reserve a priority wellness visit for you?'
        else 'Hi ' || candidate.full_name || ', it may be time for your next wellness visit. May we help reserve a suitable appointment?'
      end,
      jsonb_build_object(
        'customer_name', candidate.full_name,
        'inactive_days', candidate.inactive_days
      ),
      p_scan_at,
      'Scheduled',
      generation_key_value
    )
    on conflict (organization_id, idempotency_key) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      message_count := message_count + 1;
    end if;

    inserted_id := null;
    insert into public.customer_timeline (
      organization_id,
      branch_id,
      customer_id,
      event_type,
      title,
      detail,
      status,
      occurred_at,
      appointment_id,
      metadata
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'Follow Up',
      case
        when candidate.retention_status = 'VIP'
          then 'VIP recovery opportunity generated'
        else 'Rebooking opportunity generated'
      end,
      candidate.inactive_days || ' days inactive with no future booking.',
      'Open',
      p_scan_at,
      candidate.appointment_id,
      jsonb_build_object(
        'generation_key', generation_key_value,
        'engine', 'Phase 4.9.1',
        'inactive_days', candidate.inactive_days
      )
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      timeline_count := timeline_count + 1;
    end if;
  end loop;

  -- Packages with exactly one session remaining.
  for candidate in
    select
      cp.id as customer_package_id,
      cp.customer_id,
      cp.package_definition_id,
      cp.remaining_sessions,
      cp.expires_at,
      c.full_name,
      c.phone,
      pd.name as item_name,
      pd.price_minor
    from public.customer_packages cp
    join public.customers c on c.id = cp.customer_id
    join public.package_definitions pd on pd.id = cp.package_definition_id
    where cp.organization_id = p_organization_id
      and cp.branch_id = p_branch_id
      and cp.remaining_sessions = 1
      and cp.status in ('Active', 'Low Balance', 'Expiring Soon')
  loop
    generation_key_value := 'phase4.9.1:package:' || candidate.customer_package_id;
    inserted_id := null;

    insert into public.renewal_opportunities (
      organization_id,
      branch_id,
      customer_id,
      opportunity_type,
      customer_package_id,
      package_definition_id,
      due_date,
      remaining_sessions,
      expected_revenue_minor,
      priority_score,
      generation_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'Package',
      candidate.customer_package_id,
      candidate.package_definition_id,
      candidate.expires_at::date,
      candidate.remaining_sessions,
      candidate.price_minor,
      88,
      generation_key_value
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      renewal_count := renewal_count + 1;
    end if;

    inserted_id := null;
    insert into public.message_queue (
      organization_id,
      branch_id,
      customer_id,
      channel,
      purpose,
      recipient,
      rendered_content,
      variables,
      scheduled_at,
      status,
      idempotency_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'WhatsApp',
      'Package Expiry',
      candidate.phone,
      'Hi ' || candidate.full_name || ', your ' || candidate.item_name || ' has 1 session remaining. May we help you renew and plan your next visit?',
      jsonb_build_object(
        'customer_name', candidate.full_name,
        'package_balance', 1,
        'package_name', candidate.item_name
      ),
      p_scan_at,
      'Scheduled',
      generation_key_value
    )
    on conflict (organization_id, idempotency_key) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      message_count := message_count + 1;
    end if;

    inserted_id := null;
    insert into public.customer_timeline (
      organization_id,
      branch_id,
      customer_id,
      event_type,
      title,
      detail,
      status,
      occurred_at,
      metadata
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'Follow Up',
      'Package renewal opportunity generated',
      candidate.item_name || ' has 1 session remaining.',
      'Open',
      p_scan_at,
      jsonb_build_object(
        'generation_key', generation_key_value,
        'engine', 'Phase 4.9.1',
        'customer_package_id', candidate.customer_package_id
      )
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      timeline_count := timeline_count + 1;
    end if;
  end loop;

  -- Active memberships expiring within seven days.
  for candidate in
    select
      cm.id as customer_membership_id,
      cm.customer_id,
      cm.membership_plan_id,
      cm.renews_at,
      c.full_name,
      c.phone,
      mp.name as item_name,
      mp.price_minor
    from public.customer_memberships cm
    join public.customers c on c.id = cm.customer_id
    join public.membership_plans mp on mp.id = cm.membership_plan_id
    where cm.organization_id = p_organization_id
      and cm.branch_id = p_branch_id
      and cm.status in ('Active', 'Renewal Due')
      and cm.renews_at is not null
      and cm.renews_at >= p_scan_at
      and cm.renews_at < p_scan_at + interval '8 days'
  loop
    generation_key_value :=
      'phase4.9.1:membership:' ||
      candidate.customer_membership_id || ':' ||
      candidate.renews_at::date;
    inserted_id := null;

    insert into public.renewal_opportunities (
      organization_id,
      branch_id,
      customer_id,
      opportunity_type,
      customer_membership_id,
      membership_plan_id,
      due_date,
      expected_revenue_minor,
      priority_score,
      generation_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'Membership',
      candidate.customer_membership_id,
      candidate.membership_plan_id,
      candidate.renews_at::date,
      candidate.price_minor,
      92,
      generation_key_value
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      renewal_count := renewal_count + 1;
    end if;

    inserted_id := null;
    insert into public.message_queue (
      organization_id,
      branch_id,
      customer_id,
      channel,
      purpose,
      recipient,
      rendered_content,
      variables,
      scheduled_at,
      status,
      idempotency_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'WhatsApp',
      'Membership Renewal',
      candidate.phone,
      'Hi ' || candidate.full_name || ', your ' || candidate.item_name || ' renews on ' || to_char(candidate.renews_at, 'DD Mon YYYY') || '. May we reserve your member benefits?',
      jsonb_build_object(
        'customer_name', candidate.full_name,
        'membership_name', candidate.item_name,
        'renewal_date', candidate.renews_at::date
      ),
      p_scan_at,
      'Scheduled',
      generation_key_value
    )
    on conflict (organization_id, idempotency_key) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      message_count := message_count + 1;
    end if;

    inserted_id := null;
    insert into public.customer_timeline (
      organization_id,
      branch_id,
      customer_id,
      event_type,
      title,
      detail,
      status,
      occurred_at,
      customer_membership_id,
      metadata
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'Membership Event',
      'Membership renewal opportunity generated',
      candidate.item_name || ' renews on ' || candidate.renews_at::date || '.',
      'Open',
      p_scan_at,
      candidate.customer_membership_id,
      jsonb_build_object(
        'generation_key', generation_key_value,
        'engine', 'Phase 4.9.1'
      )
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      timeline_count := timeline_count + 1;
    end if;
  end loop;

  -- Booked appointments that still need customer confirmation.
  for candidate in
    select
      a.id as appointment_id,
      a.customer_id,
      a.starts_at,
      c.full_name,
      c.phone,
      t.full_name as therapist_name
    from public.appointments a
    join public.customers c on c.id = a.customer_id
    left join public.therapists t on t.id = a.therapist_id
    where a.organization_id = p_organization_id
      and a.branch_id = p_branch_id
      and a.status = 'Booked'
      and a.starts_at > p_scan_at
      and a.starts_at < p_scan_at + interval '48 hours'
  loop
    generation_key_value := 'phase4.9.1:confirmation:' || candidate.appointment_id;
    inserted_id := null;

    insert into public.message_queue (
      organization_id,
      branch_id,
      customer_id,
      appointment_id,
      channel,
      purpose,
      recipient,
      rendered_content,
      variables,
      scheduled_at,
      status,
      idempotency_key
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      candidate.appointment_id,
      'WhatsApp',
      'Appointment Reminder',
      candidate.phone,
      'Hi ' || candidate.full_name || ', please confirm your Sabai Haus appointment on ' || to_char(candidate.starts_at, 'DD Mon YYYY at HH12:MI AM') || '.',
      jsonb_build_object(
        'customer_name', candidate.full_name,
        'appointment_time', candidate.starts_at,
        'therapist_name', coalesce(candidate.therapist_name, 'your therapist')
      ),
      p_scan_at,
      'Scheduled',
      generation_key_value
    )
    on conflict (organization_id, idempotency_key) do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      message_count := message_count + 1;
    end if;

    inserted_id := null;
    insert into public.customer_timeline (
      organization_id,
      branch_id,
      customer_id,
      event_type,
      title,
      detail,
      status,
      occurred_at,
      appointment_id,
      metadata
    )
    values (
      p_organization_id,
      p_branch_id,
      candidate.customer_id,
      'Follow Up',
      'Appointment confirmation requested',
      'Confirmation reminder queued for the upcoming appointment.',
      'Pending',
      p_scan_at,
      candidate.appointment_id,
      jsonb_build_object(
        'generation_key', generation_key_value,
        'engine', 'Phase 4.9.1'
      )
    )
    on conflict do nothing
    returning id into inserted_id;

    if inserted_id is not null then
      timeline_count := timeline_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'scanned_at', p_scan_at,
    'organization_id', p_organization_id,
    'branch_id', p_branch_id,
    'rebooking_created', rebooking_count,
    'renewals_created', renewal_count,
    'messages_queued', message_count,
    'timeline_events_created', timeline_count
  );
end;
$$;

create or replace function public.generate_all_daily_opportunities(
  p_scan_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  scope_record record;
  scope_result jsonb;
  organization_count integer := 0;
  rebooking_count integer := 0;
  renewal_count integer := 0;
  message_count integer := 0;
  timeline_count integer := 0;
begin
  for scope_record in
    select distinct organization_id, branch_id
    from public.customers
    where organization_id is not null
      and branch_id is not null
  loop
    scope_result := public.generate_daily_opportunities_for_scope(
      scope_record.organization_id,
      scope_record.branch_id,
      p_scan_at
    );
    organization_count := organization_count + 1;
    rebooking_count := rebooking_count + coalesce((scope_result ->> 'rebooking_created')::integer, 0);
    renewal_count := renewal_count + coalesce((scope_result ->> 'renewals_created')::integer, 0);
    message_count := message_count + coalesce((scope_result ->> 'messages_queued')::integer, 0);
    timeline_count := timeline_count + coalesce((scope_result ->> 'timeline_events_created')::integer, 0);
  end loop;

  return jsonb_build_object(
    'scanned_at', p_scan_at,
    'organizations_scanned', organization_count,
    'rebooking_created', rebooking_count,
    'renewals_created', renewal_count,
    'messages_queued', message_count,
    'timeline_events_created', timeline_count
  );
end;
$$;

revoke all on function public.generate_daily_opportunities_for_scope(uuid, uuid, timestamptz)
  from public, anon, authenticated;
revoke all on function public.generate_all_daily_opportunities(timestamptz)
  from public, anon, authenticated;
grant execute on function public.generate_daily_opportunities_for_scope(uuid, uuid, timestamptz)
  to service_role;
grant execute on function public.generate_all_daily_opportunities(timestamptz)
  to service_role;

create extension if not exists pg_cron with schema extensions;

do $$
declare
  existing_job bigint;
begin
  select jobid
  into existing_job
  from cron.job
  where jobname = 'sabaihaus-daily-opportunity-generation'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'sabaihaus-daily-opportunity-generation',
    '15 0 * * *',
    'select public.generate_all_daily_opportunities(now());'
  );
end;
$$;

comment on function public.generate_daily_opportunities_for_scope(uuid, uuid, timestamptz) is
  'Generates tenant-scoped rebooking, renewal, confirmation messages and customer timeline events without duplicates.';
comment on function public.generate_all_daily_opportunities(timestamptz) is
  'Service-role daily entry point for the Phase 4.9.1 Opportunity Generation Engine.';
