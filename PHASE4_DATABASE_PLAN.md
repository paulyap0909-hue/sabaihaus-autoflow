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

`completeAppointment` currently creates a typed execution plan and performs no
database writes. The planned flow is:

1. Lock and validate the appointment.
2. Change appointment status to `Completed`.
3. Record an immutable `appointment_events` completion event.
4. Redeem a package session when the appointment used a customer package.
5. Calculate and create the therapist commission entry.
6. Apply service inventory usage rules and create usage logs.
7. Create an aftercare or rebooking follow-up task.
8. Queue the configured after-treatment notification.
9. Update the customer's last visit and lifetime value.

The command includes an `idempotencyKey`. A future server-side transaction must
use it to prevent duplicate package, commission, inventory, and notification
effects when completion is retried.

## Repository Boundary

`src/services/repositories/` contains typed contracts for:

- Appointments
- Customers
- Packages
- Commissions
- Inventory
- Notifications

These functions currently throw a clear `not implemented` error. They contain no
Supabase queries and are not used by the UI.

## Future Integration Steps

1. Create organization, branch, user membership, role, and permission tables.
2. Enable Row Level Security and tenant-scoped policies before production use.
3. Generate TypeScript database types from the Supabase schema.
4. Type the Supabase client with the generated `Database` contract.
5. Implement repository queries and mapping between database rows and domain
   models.
6. Move appointment completion into a server-side database function or Edge
   Function with a single transaction and row locking.
7. Add idempotency, retry handling, audit logs, and reversal workflows.
8. Add integration tests for package redemption, commission calculation,
   inventory usage, follow-up creation, and notification scheduling.
9. Migrate one UI module at a time from mock repositories to Supabase-backed
   repositories behind feature flags.

No production database should use this schema until authentication and RLS
policies are added.
