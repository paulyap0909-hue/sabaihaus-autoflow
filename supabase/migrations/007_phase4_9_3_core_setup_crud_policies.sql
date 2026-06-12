-- Phase 4.9.3: tenant-scoped Core Setup CRUD policies.
-- Uses only columns defined by 001_initial_schema.sql.

alter table public.package_definitions enable row level security;
alter table public.membership_plans enable row level security;
alter table public.therapists enable row level security;

grant execute on function public.current_organization_id() to anon;
grant execute on function public.current_branch_id() to anon;

drop policy if exists package_definitions_core_setup_select
  on public.package_definitions;
create policy package_definitions_core_setup_select
on public.package_definitions
for select
to anon, authenticated
using (
  (
    organization_id = public.current_organization_id()
    and branch_id = public.current_branch_id()
  )
  or (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and branch_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

drop policy if exists package_definitions_core_setup_insert
  on public.package_definitions;
create policy package_definitions_core_setup_insert
on public.package_definitions
for insert
to anon, authenticated
with check (
  (
    organization_id = public.current_organization_id()
    and branch_id = public.current_branch_id()
  )
  or (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and branch_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

drop policy if exists membership_plans_core_setup_select
  on public.membership_plans;
create policy membership_plans_core_setup_select
on public.membership_plans
for select
to anon, authenticated
using (
  (
    organization_id = public.current_organization_id()
    and branch_id = public.current_branch_id()
  )
  or (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and branch_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

drop policy if exists membership_plans_core_setup_insert
  on public.membership_plans;
create policy membership_plans_core_setup_insert
on public.membership_plans
for insert
to anon, authenticated
with check (
  (
    organization_id = public.current_organization_id()
    and branch_id = public.current_branch_id()
  )
  or (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and branch_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

drop policy if exists therapists_core_setup_select
  on public.therapists;
create policy therapists_core_setup_select
on public.therapists
for select
to anon, authenticated
using (
  (
    organization_id = public.current_organization_id()
    and branch_id = public.current_branch_id()
  )
  or (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and branch_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);

drop policy if exists therapists_core_setup_insert
  on public.therapists;
create policy therapists_core_setup_insert
on public.therapists
for insert
to anon, authenticated
with check (
  (
    organization_id = public.current_organization_id()
    and branch_id = public.current_branch_id()
  )
  or (
    organization_id = '00000000-0000-0000-0000-000000000001'::uuid
    and branch_id = '00000000-0000-0000-0000-000000000001'::uuid
  )
);
