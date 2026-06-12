-- Phase 4.9.2 validation cleanup.
-- Removes only deterministic seed rows and engine output related to those rows.

begin;

-- Remove generated customer timeline records before their referenced source rows.
delete from public.customer_timeline
where customer_id in (
  '49220000-0000-0000-0000-000000000001',
  '49220000-0000-0000-0000-000000000002',
  '49220000-0000-0000-0000-000000000003',
  '49220000-0000-0000-0000-000000000004'
)
or metadata ->> 'generation_key' like 'phase4.9.1:%492%';

delete from public.communication_logs
where customer_id in (
  '49220000-0000-0000-0000-000000000001',
  '49220000-0000-0000-0000-000000000002',
  '49220000-0000-0000-0000-000000000003',
  '49220000-0000-0000-0000-000000000004'
);

delete from public.message_queue
where customer_id in (
  '49220000-0000-0000-0000-000000000001',
  '49220000-0000-0000-0000-000000000002',
  '49220000-0000-0000-0000-000000000003',
  '49220000-0000-0000-0000-000000000004'
)
or idempotency_key like 'phase4.9.1:%492%';

delete from public.rebooking_opportunities
where source_appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
)
or generation_key like 'phase4.9.1:%492%';

delete from public.renewal_opportunities
where customer_package_id = '49240000-0000-0000-0000-000000000001'
   or customer_membership_id = '49260000-0000-0000-0000-000000000001'
   or generation_key like 'phase4.9.1:%492%';

-- Defensive cleanup if the validation appointments were processed manually.
delete from public.package_redemptions
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.inventory_usage_logs
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.inventory_movements
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.commission_entries
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.revenue_records
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.follow_up_tasks
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.notification_queue
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.appointment_events
where appointment_id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.appointments
where id in (
  '49270000-0000-0000-0000-000000000001',
  '49270000-0000-0000-0000-000000000002',
  '49270000-0000-0000-0000-000000000003'
);

delete from public.customer_memberships
where id = '49260000-0000-0000-0000-000000000001';

delete from public.membership_plans
where id = '49250000-0000-0000-0000-000000000001';

delete from public.customer_packages
where id = '49240000-0000-0000-0000-000000000001';

delete from public.package_definitions
where id = '49230000-0000-0000-0000-000000000001';

delete from public.customers
where id in (
  '49220000-0000-0000-0000-000000000001',
  '49220000-0000-0000-0000-000000000002',
  '49220000-0000-0000-0000-000000000003',
  '49220000-0000-0000-0000-000000000004'
);

delete from public.services
where id in (
  '49210000-0000-0000-0000-000000000001',
  '49210000-0000-0000-0000-000000000002'
);

delete from public.therapists
where id = '49200000-0000-0000-0000-000000000001';

commit;
