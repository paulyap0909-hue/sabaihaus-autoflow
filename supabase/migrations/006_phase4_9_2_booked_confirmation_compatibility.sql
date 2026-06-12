-- Phase 4.9.2 compatibility patch.
-- The base appointment schema uses Booked for an unconfirmed appointment.

drop index if exists public.appointments_confirmation_scan_idx;

create index appointments_confirmation_scan_idx
  on public.appointments (organization_id, branch_id, status, starts_at)
  where status = 'Booked';

do $$
declare
  function_definition text;
  updated_definition text;
begin
  select pg_get_functiondef(
    'public.generate_daily_opportunities_for_scope(uuid,uuid,timestamp with time zone)'::regprocedure
  )
  into function_definition;

  updated_definition := replace(
    function_definition,
    'and a.status = ''Pending''',
    'and a.status = ''Booked'''
  );

  if updated_definition <> function_definition then
    execute updated_definition;
  end if;
end;
$$;

comment on index public.appointments_confirmation_scan_idx is
  'Supports the 48-hour confirmation scan for Booked appointments in the base production schema.';
