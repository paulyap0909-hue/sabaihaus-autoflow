-- Phase 4.5: transactional appointment completion and business event ledgers.

alter table public.appointments
  drop constraint if exists appointments_status_check;

update public.appointments
set status = case
  when status = 'Booked' then 'Pending'
  when status = 'In Treatment' then 'In Progress'
  else status
end;

alter table public.appointments
  alter column status set default 'Pending',
  add constraint appointments_status_check
    check (status in (
      'Pending',
      'Confirmed',
      'Checked In',
      'In Progress',
      'Completed',
      'Cancelled',
      'No Show'
    ));

alter table public.customers
  add column if not exists total_visits integer not null default 0
    check (total_visits >= 0),
  add column if not exists total_spent_minor bigint not null default 0
    check (total_spent_minor >= 0);

update public.customers
set total_spent_minor = greatest(total_spent_minor, lifetime_value_minor);

alter table public.membership_plans
  add column if not exists minimum_lifetime_spend_minor bigint not null default 0
    check (minimum_lifetime_spend_minor >= 0);

update public.membership_plans
set minimum_lifetime_spend_minor = case tier
  when 'Silver' then 0
  when 'Gold' then 500000
  when 'Platinum' then 1000000
  when 'Diamond' then 2000000
end;

alter table public.appointment_events
  drop constraint if exists appointment_events_event_type_check;

alter table public.appointment_events
  add column if not exists event_result jsonb not null default '{}'::jsonb,
  add constraint appointment_events_event_type_check
    check (event_type in (
      'Created',
      'Pending',
      'Confirmed',
      'Checked In',
      'In Progress',
      'Completed',
      'Cancelled',
      'No Show',
      'Corrected'
    ));

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  inventory_item_id uuid not null references public.inventory_items(id),
  appointment_id uuid references public.appointments(id),
  movement_type text not null
    check (movement_type in ('Appointment Usage', 'Purchase', 'Adjustment', 'Waste', 'Return')),
  quantity_delta numeric(12, 3) not null check (quantity_delta <> 0),
  balance_after numeric(12, 3) not null check (balance_after >= 0),
  unit text not null,
  cost_minor bigint not null default 0 check (cost_minor >= 0),
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.revenue_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  branch_id uuid not null,
  appointment_id uuid references public.appointments(id),
  customer_id uuid references public.customers(id),
  revenue_type text not null
    check (revenue_type in ('Appointment', 'Package Sale', 'Product Sale', 'Membership Sale', 'Adjustment')),
  amount_minor bigint not null check (amount_minor >= 0),
  recognized_at timestamptz not null default now(),
  status text not null default 'Recognized'
    check (status in ('Pending', 'Recognized', 'Reversed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index inventory_movements_item_occurred_idx
  on public.inventory_movements (inventory_item_id, occurred_at);
create index inventory_movements_appointment_idx
  on public.inventory_movements (appointment_id);
create index revenue_records_org_branch_recognized_idx
  on public.revenue_records (organization_id, branch_id, recognized_at);

create unique index if not exists inventory_usage_logs_appointment_item_uidx
  on public.inventory_usage_logs (appointment_id, inventory_item_id);
create unique index if not exists commission_entries_appointment_uidx
  on public.commission_entries (appointment_id)
  where appointment_id is not null and source_type = 'Appointment';
create unique index if not exists revenue_records_appointment_uidx
  on public.revenue_records (appointment_id)
  where appointment_id is not null and revenue_type = 'Appointment';
create unique index if not exists follow_up_tasks_appointment_type_uidx
  on public.follow_up_tasks (appointment_id, task_type)
  where appointment_id is not null;

create trigger inventory_movements_set_updated_at
before update on public.inventory_movements
for each row execute function public.set_updated_at();

create trigger revenue_records_set_updated_at
before update on public.revenue_records
for each row execute function public.set_updated_at();

create or replace function public.validate_appointment_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'Completed'
    and coalesce(
      current_setting('sabaihaus.appointment_completion', true),
      'false'
    ) <> 'true'
  then
    raise exception 'Completed status must be applied through process_appointment_completion'
      using errcode = 'check_violation';
  end if;

  if not (
    (old.status = 'Pending' and new.status in ('Confirmed', 'Cancelled'))
    or (old.status = 'Confirmed' and new.status in ('Checked In', 'Cancelled', 'No Show'))
    or (old.status = 'Checked In' and new.status in ('In Progress', 'Cancelled', 'No Show'))
    or (old.status = 'In Progress' and new.status in ('Completed', 'Cancelled'))
  ) then
    raise exception 'Invalid appointment status transition from % to %', old.status, new.status
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_validate_status_transition on public.appointments;
create trigger appointments_validate_status_transition
before update of status on public.appointments
for each row execute function public.validate_appointment_status_transition();

create or replace function public.audit_appointment_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status = old.status or new.status = 'Completed' then
    return new;
  end if;

  insert into public.appointment_events (
    organization_id,
    branch_id,
    appointment_id,
    event_type,
    occurred_at,
    payload,
    event_result
  )
  values (
    new.organization_id,
    new.branch_id,
    new.id,
    new.status,
    now(),
    jsonb_build_object(
      'previousStatus', old.status,
      'nextStatus', new.status
    ),
    jsonb_build_object(
      'status', 'completed',
      'message', 'Appointment status transition recorded.'
    )
  );

  return new;
end;
$$;

drop trigger if exists appointments_audit_status_transition on public.appointments;
create trigger appointments_audit_status_transition
after update of status on public.appointments
for each row execute function public.audit_appointment_status_transition();

create or replace function public.process_appointment_completion(
  p_organization_id uuid,
  p_branch_id uuid,
  p_appointment_id uuid,
  p_idempotency_key text,
  p_actor_id uuid default null,
  p_completed_at timestamptz default now()
)
returns jsonb
language plpgsql
as $$
declare
  v_appointment public.appointments%rowtype;
  v_customer public.customers%rowtype;
  v_customer_package public.customer_packages%rowtype;
  v_usage_rule record;
  v_inventory_item public.inventory_items%rowtype;
  v_commission_rule public.commission_rules%rowtype;
  v_membership_plan public.membership_plans%rowtype;
  v_existing_result jsonb;
  v_event_result jsonb;
  v_event_id uuid := gen_random_uuid();
  v_revenue_id uuid;
  v_follow_up_id uuid;
  v_commission_id uuid;
  v_package_redemptions integer := 0;
  v_remaining_sessions integer;
  v_inventory_movements integer := 0;
  v_inventory_quantity numeric(12, 3) := 0;
  v_commission_entries integer := 0;
  v_commission_amount_minor bigint := 0;
  v_memberships_updated integer := 0;
  v_revenue_records integer := 0;
  v_follow_up_tasks integer := 0;
  v_follow_up_due_at timestamptz := p_completed_at + interval '30 days';
  v_new_stock numeric(12, 3);
  v_usage_cost_minor bigint;
begin
  if nullif(trim(p_idempotency_key), '') is null then
    raise exception 'Appointment completion requires an idempotency key'
      using errcode = 'not_null_violation';
  end if;

  select event_result
  into v_existing_result
  from public.appointment_events
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key
  limit 1;

  if v_existing_result is not null then
    return v_existing_result || jsonb_build_object('idempotentReplay', true);
  end if;

  select *
  into v_appointment
  from public.appointments
  where id = p_appointment_id
    and organization_id = p_organization_id
    and branch_id = p_branch_id
  for update;

  if not found then
    raise exception 'Appointment % was not found in this organization and branch', p_appointment_id
      using errcode = 'no_data_found';
  end if;

  if v_appointment.status = 'Completed' then
    select event_result
    into v_existing_result
    from public.appointment_events
    where organization_id = p_organization_id
      and idempotency_key = p_idempotency_key
    limit 1;

    if v_existing_result is not null then
      return v_existing_result || jsonb_build_object('idempotentReplay', true);
    end if;

    raise exception 'Appointment % has already been completed', p_appointment_id
      using errcode = 'check_violation';
  end if;

  if v_appointment.status <> 'In Progress' then
    raise exception 'Appointment must be In Progress before completion; current status is %', v_appointment.status
      using errcode = 'check_violation';
  end if;

  if v_appointment.therapist_id is null then
    raise exception 'Appointment completion requires an assigned therapist'
      using errcode = 'not_null_violation';
  end if;

  perform set_config('sabaihaus.appointment_completion', 'true', true);

  update public.appointments
  set status = 'Completed',
      completed_at = p_completed_at
  where id = v_appointment.id;

  update public.customers
  set total_visits = total_visits + 1,
      total_spent_minor = total_spent_minor + v_appointment.price_minor,
      lifetime_value_minor = lifetime_value_minor + v_appointment.price_minor,
      last_visit_at = p_completed_at
  where id = v_appointment.customer_id
    and organization_id = p_organization_id
    and branch_id = p_branch_id
  returning * into v_customer;

  if not found then
    raise exception 'Customer % was not found for appointment completion', v_appointment.customer_id
      using errcode = 'no_data_found';
  end if;

  if v_appointment.customer_package_id is not null then
    select *
    into v_customer_package
    from public.customer_packages
    where id = v_appointment.customer_package_id
      and customer_id = v_appointment.customer_id
      and organization_id = p_organization_id
      and branch_id = p_branch_id
    for update;

    if not found then
      raise exception 'Customer package % was not found', v_appointment.customer_package_id
        using errcode = 'no_data_found';
    end if;

    if v_customer_package.remaining_sessions < 1 then
      raise exception 'Customer package % has no remaining sessions', v_customer_package.id
        using errcode = 'check_violation';
    end if;

    update public.customer_packages
    set remaining_sessions = remaining_sessions - 1,
        status = case
          when remaining_sessions - 1 = 0 then 'Fully Used'
          when remaining_sessions - 1 <= 2 then 'Low Balance'
          when expires_at <= p_completed_at + interval '14 days' then 'Expiring Soon'
          else 'Active'
        end
    where id = v_customer_package.id
    returning remaining_sessions into v_remaining_sessions;

    insert into public.package_redemptions (
      organization_id,
      branch_id,
      customer_package_id,
      appointment_id,
      sessions_redeemed,
      redeemed_at
    )
    values (
      p_organization_id,
      p_branch_id,
      v_customer_package.id,
      v_appointment.id,
      1,
      p_completed_at
    );

    v_package_redemptions := 1;
  end if;

  for v_usage_rule in
    select *
    from public.inventory_usage_rules
    where organization_id = p_organization_id
      and branch_id = p_branch_id
      and service_id = v_appointment.service_id
      and active = true
    order by id
  loop
    select *
    into v_inventory_item
    from public.inventory_items
    where id = v_usage_rule.inventory_item_id
      and organization_id = p_organization_id
      and branch_id = p_branch_id
    for update;

    if not found then
      raise exception 'Inventory item % was not found', v_usage_rule.inventory_item_id
        using errcode = 'no_data_found';
    end if;

    if v_inventory_item.current_stock < v_usage_rule.quantity_used then
      raise exception 'Insufficient stock for inventory item %', v_inventory_item.name
        using errcode = 'check_violation';
    end if;

    v_new_stock := v_inventory_item.current_stock - v_usage_rule.quantity_used;
    v_usage_cost_minor := round(
      v_usage_rule.quantity_used * v_inventory_item.cost_per_unit_minor
    )::bigint;

    update public.inventory_items
    set current_stock = v_new_stock,
        status = case
          when v_new_stock = 0 then 'Out of Stock'
          when v_new_stock <= reorder_level then 'Low Stock'
          when expiry_date is not null and expiry_date <= p_completed_at::date + 14 then 'Expiring Soon'
          else 'In Stock'
        end
    where id = v_inventory_item.id;

    insert into public.inventory_usage_logs (
      organization_id,
      branch_id,
      appointment_id,
      inventory_item_id,
      usage_rule_id,
      quantity_used,
      unit,
      cost_minor,
      used_at
    )
    values (
      p_organization_id,
      p_branch_id,
      v_appointment.id,
      v_inventory_item.id,
      v_usage_rule.id,
      v_usage_rule.quantity_used,
      v_usage_rule.unit,
      v_usage_cost_minor,
      p_completed_at
    );

    insert into public.inventory_movements (
      organization_id,
      branch_id,
      inventory_item_id,
      appointment_id,
      movement_type,
      quantity_delta,
      balance_after,
      unit,
      cost_minor,
      occurred_at,
      notes
    )
    values (
      p_organization_id,
      p_branch_id,
      v_inventory_item.id,
      v_appointment.id,
      'Appointment Usage',
      -v_usage_rule.quantity_used,
      v_new_stock,
      v_usage_rule.unit,
      v_usage_cost_minor,
      p_completed_at,
      'Automatic deduction from completed appointment'
    );

    v_inventory_movements := v_inventory_movements + 1;
    v_inventory_quantity := v_inventory_quantity + v_usage_rule.quantity_used;
  end loop;

  select *
  into v_commission_rule
  from public.commission_rules
  where organization_id = p_organization_id
    and branch_id = p_branch_id
    and applies_to = 'Service'
    and active = true
    and (service_id = v_appointment.service_id or service_id is null)
    and effective_from <= p_completed_at::date
    and (effective_to is null or effective_to >= p_completed_at::date)
  order by
    case when service_id = v_appointment.service_id then 0 else 1 end,
    effective_from desc
  limit 1;

  if v_commission_rule.id is not null then
    v_commission_amount_minor := case v_commission_rule.calculation_type
      when 'Fixed' then round(v_commission_rule.rate)::bigint
      when 'Percentage' then round(v_appointment.price_minor * v_commission_rule.rate / 100)::bigint
      when 'Tiered' then round(v_appointment.price_minor * v_commission_rule.rate / 100)::bigint
      else 0
    end;
  end if;

  insert into public.commission_entries (
    organization_id,
    branch_id,
    therapist_id,
    appointment_id,
    commission_rule_id,
    source_type,
    source_amount_minor,
    commission_amount_minor,
    rule_snapshot,
    status,
    earned_at
  )
  values (
    p_organization_id,
    p_branch_id,
    v_appointment.therapist_id,
    v_appointment.id,
    v_commission_rule.id,
    'Appointment',
    v_appointment.price_minor,
    v_commission_amount_minor,
    case
      when v_commission_rule.id is null then
        jsonb_build_object('message', 'No active service commission rule; zero commission recorded.')
      else
        jsonb_build_object(
          'ruleName', v_commission_rule.name,
          'calculationType', v_commission_rule.calculation_type,
          'rate', v_commission_rule.rate,
          'effectiveFrom', v_commission_rule.effective_from
        )
    end,
    'Pending',
    p_completed_at
  )
  returning id into v_commission_id;

  if v_commission_id is not null then
    v_commission_entries := 1;
  end if;

  select *
  into v_membership_plan
  from public.membership_plans
  where organization_id = p_organization_id
    and branch_id = p_branch_id
    and active = true
    and minimum_lifetime_spend_minor <= v_customer.total_spent_minor
  order by minimum_lifetime_spend_minor desc
  limit 1;

  if v_membership_plan.id is not null then
    update public.customer_memberships
    set membership_plan_id = v_membership_plan.id
    where customer_id = v_customer.id
      and organization_id = p_organization_id
      and branch_id = p_branch_id
      and status in ('Active', 'Renewal Due')
      and membership_plan_id <> v_membership_plan.id;

    get diagnostics v_memberships_updated = row_count;
  end if;

  insert into public.revenue_records (
    organization_id,
    branch_id,
    appointment_id,
    customer_id,
    revenue_type,
    amount_minor,
    recognized_at,
    status,
    metadata
  )
  values (
    p_organization_id,
    p_branch_id,
    v_appointment.id,
    v_appointment.customer_id,
    'Appointment',
    v_appointment.price_minor,
    p_completed_at,
    'Recognized',
    jsonb_build_object(
      'serviceId', v_appointment.service_id,
      'therapistId', v_appointment.therapist_id,
      'packageFunded', v_appointment.customer_package_id is not null
    )
  )
  returning id into v_revenue_id;

  if v_revenue_id is not null then
    v_revenue_records := 1;
  end if;

  insert into public.follow_up_tasks (
    organization_id,
    branch_id,
    customer_id,
    appointment_id,
    task_type,
    due_at,
    status,
    notes
  )
  values (
    p_organization_id,
    p_branch_id,
    v_appointment.customer_id,
    v_appointment.id,
    'Rebooking',
    v_follow_up_due_at,
    'Open',
    'Automatically created when the appointment was completed.'
  )
  returning id into v_follow_up_id;

  if v_follow_up_id is not null then
    v_follow_up_tasks := 1;
  end if;

  v_event_result := jsonb_build_object(
    'eventId', v_event_id,
    'appointmentId', v_appointment.id,
    'completedAt', p_completed_at,
    'idempotencyKey', p_idempotency_key,
    'idempotentReplay', false,
    'customer', jsonb_build_object(
      'totalVisits', v_customer.total_visits,
      'totalSpentMinor', v_customer.total_spent_minor,
      'lastVisitAt', v_customer.last_visit_at
    ),
    'package', jsonb_build_object(
      'redemptionsCreated', v_package_redemptions,
      'remainingSessions', v_remaining_sessions
    ),
    'inventory', jsonb_build_object(
      'movementsCreated', v_inventory_movements,
      'quantityConsumed', v_inventory_quantity
    ),
    'commission', jsonb_build_object(
      'entriesCreated', v_commission_entries,
      'amountMinor', v_commission_amount_minor
    ),
    'membership', jsonb_build_object(
      'membershipsUpdated', v_memberships_updated,
      'tier', case
        when v_membership_plan.id is null then null
        else v_membership_plan.tier
      end
    ),
    'revenue', jsonb_build_object(
      'recordsCreated', v_revenue_records,
      'amountMinor', v_appointment.price_minor
    ),
    'followUp', jsonb_build_object(
      'tasksCreated', v_follow_up_tasks,
      'dueAt', v_follow_up_due_at
    ),
    'steps', jsonb_build_array(
      jsonb_build_object(
        'type', 'appointment.status.completed',
        'status', 'completed',
        'recordsCreated', 0,
        'message', 'Appointment marked Completed.'
      ),
      jsonb_build_object(
        'type', 'customer.statistics.updated',
        'status', 'completed',
        'recordsCreated', 0,
        'amountMinor', v_appointment.price_minor,
        'message', 'Customer visit and spending totals updated.'
      ),
      jsonb_build_object(
        'type', 'package.redemption.created',
        'status', case when v_package_redemptions = 1 then 'completed' else 'skipped' end,
        'recordsCreated', v_package_redemptions,
        'message', case
          when v_package_redemptions = 1 then 'One package session redeemed.'
          else 'Appointment was not funded by a package.'
        end
      ),
      jsonb_build_object(
        'type', 'inventory.usage.deducted',
        'status', 'completed',
        'recordsCreated', v_inventory_movements,
        'quantity', v_inventory_quantity,
        'message', 'Linked inventory usage rules applied.'
      ),
      jsonb_build_object(
        'type', 'commission.entry.created',
        'status', 'completed',
        'recordsCreated', v_commission_entries,
        'amountMinor', v_commission_amount_minor,
        'message', 'Therapist commission entry created.'
      ),
      jsonb_build_object(
        'type', 'membership.tier.recalculated',
        'status', 'completed',
        'recordsCreated', v_memberships_updated,
        'message', 'Membership tier evaluated from lifetime spend.'
      ),
      jsonb_build_object(
        'type', 'revenue.record.created',
        'status', 'completed',
        'recordsCreated', v_revenue_records,
        'amountMinor', v_appointment.price_minor,
        'message', 'Appointment revenue recognized.'
      ),
      jsonb_build_object(
        'type', 'follow_up.task.created',
        'status', 'completed',
        'recordsCreated', v_follow_up_tasks,
        'message', 'Rebooking follow-up scheduled for 30 days later.'
      ),
      jsonb_build_object(
        'type', 'appointment.event.created',
        'status', 'completed',
        'recordsCreated', 1,
        'message', 'Completion audit event recorded.'
      )
    )
  );

  insert into public.appointment_events (
    id,
    organization_id,
    branch_id,
    appointment_id,
    event_type,
    actor_id,
    occurred_at,
    payload,
    event_result,
    idempotency_key
  )
  values (
    v_event_id,
    p_organization_id,
    p_branch_id,
    v_appointment.id,
    'Completed',
    p_actor_id,
    p_completed_at,
    jsonb_build_object(
      'previousStatus', v_appointment.status,
      'nextStatus', 'Completed'
    ),
    v_event_result,
    p_idempotency_key
  );

  return v_event_result;
end;
$$;

revoke all on function public.process_appointment_completion(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  timestamptz
) from public;

grant execute on function public.process_appointment_completion(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  timestamptz
) to authenticated;

comment on function public.process_appointment_completion(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  timestamptz
) is 'Atomically completes an appointment and records customer, package, inventory, commission, membership, revenue, follow-up, and audit effects.';
