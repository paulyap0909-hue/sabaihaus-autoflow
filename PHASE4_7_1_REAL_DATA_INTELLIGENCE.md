# Phase 4.7.1 - Real Data Business Intelligence

## Purpose

Phase 4.7.1 adds a Supabase-ready aggregation layer behind the existing
Business Intelligence Center. The visual dashboard remains intact and the
existing mock intelligence remains available as a safe fallback.

No AI API is called. The AI Management Brain input builder only prepares a
typed, structured data payload for a future integration.

## Data Source Selection

The Business Intelligence Center selects its source at runtime:

- `Live Data Active` / `Live Supabase data` when Supabase is configured and
  all intelligence queries succeed.
- `Mock Fallback Active` / `Mock intelligence fallback` when Supabase
  environment values are missing, tenant scope is missing, or a query fails.

Live reads require:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_ORGANIZATION_ID=
VITE_SUPABASE_BRANCH_ID=
```

Organization and branch IDs are mandatory for live intelligence so data is
never aggregated across tenants accidentally.

## Tables Read

- `customers`
- `therapists`
- `appointments`
- `package_definitions`
- `customer_packages`
- `package_redemptions`
- `commission_entries`
- `inventory_usage_logs`
- `notification_queue`
- `follow_up_tasks`
- `appointment_events`

All queries are read-only and scoped by `organization_id` and `branch_id`.

## Calculated Intelligence

### Executive Dashboard

- Monthly revenue and comparison-period revenue growth
- Gross margin estimate using commission and inventory costs
- Customer retention rate
- Outstanding package liability
- Team utilization
- Composite business health score

### Therapist Intelligence

- Revenue
- Appointment count
- Utilization rate
- Completion rate
- Rebooking rate
- Upsell placeholder
- Composite performance score

### Customer Intelligence

- VIP, active, at-risk, and lost customer counts
- Birthdays in the next seven days
- Customers inactive for over 30, 45, and 60 days
- Recommended rule-based recovery action

### Package Intelligence

- Active packages
- Outstanding sessions
- Unused package value
- Expirations within 7, 14, and 30 days
- Redemption rate
- Package liability warning

### Revenue Intelligence

- Revenue by service reference
- Revenue by therapist
- Daily and monthly revenue
- Deterministic forecast placeholder
- Average revenue per completed visit

Service breakdown labels use the appointment `service_id` reference because
Phase 4.7.1 is limited to the requested table set. Service display-name joins
can be added when the service catalog becomes part of the live BI contract.

## AI Management Brain Input

`buildAiManagementBrainInput` converts a calculated intelligence snapshot into
a typed payload containing:

- Executive health and revenue signals
- Therapist performance
- Customer risk and recovery segments
- Package liability and expiry risk
- Revenue composition and forecast inputs
- Operational delivery signals

This function performs no network request and sends no customer data to an AI
provider.

## Fallback Behavior

The repository catches configuration and query failures before they reach the
UI. It returns the existing mock snapshot with a visible fallback status and a
diagnostic reason available on hover. This keeps the dashboard usable during
local development, incomplete migrations, and temporary Supabase outages.

## Future Integration

1. Apply and validate the Supabase schema for each requested table.
2. Configure tenant IDs through deployment environment variables.
3. Add Row Level Security policies that match organization and branch scope.
4. Add service catalog display-name joins.
5. Replace forecast and upsell placeholders with approved production logic.
6. Connect the typed AI input only after data governance and privacy review.

## Verification

- `npm run lint`
- `npm run build`

Both commands pass for this phase.
