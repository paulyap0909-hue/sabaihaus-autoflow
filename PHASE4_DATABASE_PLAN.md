# Phase 4 Database Foundation

Phase 4 prepares Sabai Haus AutoFlow for Supabase without connecting the existing
mock frontend to live data. The UI continues to use the current mock services.

## Environment

Copy `.env.example` to a local `.env` file and provide:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`src/services/supabase/client.ts` creates the browser client lazily. It throws a
clear configuration error only when database code requests the client, so the
mock frontend remains usable without environment variables.

## Initial Schema

`supabase/migrations/001_initial_schema.sql` creates:

- `customers`
- `therapists`
- `services`
- `appointments`
- `wellness_profiles`
- `package_definitions`
- `customer_packages`
- `package_redemptions`
- `membership_plans`
- `customer_memberships`
- `inventory_items`
- `inventory_usage_rules`
- `inventory_usage_logs`
- `commission_rules`
- `commission_entries`
- `follow_up_tasks`
- `notification_templates`
- `notification_queue`
- `appointment_events`
- `inventory_movements` (Phase 4.5)
- `revenue_records` (Phase 4.5)

All business tables use UUID primary keys and include `organization_id`,
`branch_id`, `created_at`, and `updated_at`. The migration also adds:

- Foreign keys for operational traceability.
- Check constraints for controlled statuses.
- Indexes for schedules, customer history, stock alerts, commissions, tasks,
  notifications, and appointment events.
- A shared trigger that maintains `updated_at`.

Organization and branch tables are intentionally deferred until authentication,
user membership, and Row Level Security are designed together.

## Appointment Completion Flow

Phase 4.5 implements appointment completion as one transactional Supabase RPC:
`process_appointment_completion`.

1. Validate the tenant, branch, idempotency key, and `In Progress` status.
2. Lock the appointment row to prevent concurrent completion.
3. Change the appointment status to `Completed`.
4. Increment customer visits and spending, then update the last visit date.
5. Redeem one package session when the appointment used a package.
6. Apply service inventory rules and create usage and movement records.
7. Calculate therapist commission from the active service rule.
8. Recalculate the customer's membership tier from lifetime spending.
9. Recognize appointment revenue in the revenue ledger.
10. Create a rebooking follow-up task due 30 days later.
11. Store the complete result in `appointment_events`.

The database rejects direct transitions to `Completed`; callers must use the RPC
so no completion can bypass its business effects. The RPC is atomic: insufficient
package balance, insufficient inventory, an invalid status, or another error
rolls back every effect.

The command includes an `idempotencyKey`. Retrying the same command returns the
stored event result without creating duplicate package, inventory, commission,
revenue, or follow-up records.

The frontend keeps working without Supabase through a demo executor with the
same TypeScript result contract. Completing a mock appointment updates the
Appointment Event Pulse dashboard widget in memory.

## Repository Boundary

`src/services/repositories/` contains typed contracts for:

- Appointments
- Customers
- Packages
- Commissions
- Inventory
- Notifications

Most functions still throw a clear `not implemented` error. Appointment
completion is the first implemented repository operation and calls the
transactional RPC. The mock UI uses the demo executor until Supabase Auth and
tenant policies are connected.

## Future Integration Steps

1. Create organization, branch, user membership, role, and permission tables.
2. Enable Row Level Security and tenant-scoped policies before production use.
3. Generate TypeScript database types from the Supabase schema.
4. Type the Supabase client with the generated `Database` contract.
5. Implement repository queries and mapping between database rows and domain
   models.
6. Add reversal and correction workflows for completed appointments.
7. Add integration tests for package redemption, commission calculation,
   inventory usage, follow-up creation, and notification scheduling.
8. Migrate one UI module at a time from mock repositories to Supabase-backed
   repositories behind feature flags.

No production database should use this schema until authentication and RLS
policies are added.
