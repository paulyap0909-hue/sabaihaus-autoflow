# Phase 4.9.1 Opportunity Generation Engine

## Daily scan

The database job runs every day at `00:15 UTC`, which is `08:15` in
Asia/Kuala_Lumpur.

It detects:

- Customers with no completed return visit for more than 21 days and no future booking
- Customer packages with exactly one session remaining
- Active memberships renewing within seven days
- VIP customers inactive for more than 30 days and without a future booking
- Booked appointments occurring within 48 hours that still require confirmation

## Records generated

The engine writes tenant-scoped records into:

- `rebooking_opportunities`
- `renewal_opportunities`
- `message_queue`
- `customer_timeline`

No message is sent to an external provider. Queue records remain available for
the existing Communication and Action Center workflows.

## Duplicate protection

Every generated workflow receives a stable `generation_key`.

- Rebooking keys use the latest completed appointment
- Package keys use the customer package
- Membership keys use the membership and renewal date, allowing future cycles
- Confirmation keys use the appointment

Unique indexes on opportunity generation keys, message idempotency keys and
timeline metadata make repeated scans safe.

## Security

The generation functions are `security definer` functions restricted to the
Supabase `service_role`. They are not callable by `anon` or `authenticated`
browser clients. Existing RLS policies are unchanged.

## Dashboard synchronization

The Dashboard and `/action-center` already load KPI values from
`rebooking_opportunities`, `renewal_opportunities`, and `message_queue`.
New records therefore appear automatically on the next repository refresh or
page load without a separate KPI table.

## Manual backend verification

Run from a trusted Supabase SQL session:

```sql
select public.generate_all_daily_opportunities(now());
```

Running the statement twice should report zero new records on the second run
for unchanged source data.
