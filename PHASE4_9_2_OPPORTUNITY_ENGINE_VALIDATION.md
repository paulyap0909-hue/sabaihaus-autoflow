# Phase 4.9.2 Opportunity Engine Validation

This seed creates isolated operational records for:

- A customer inactive for more than 21 days
- A VIP Diamond customer inactive for more than 30 days
- A customer package with one remaining session
- A Diamond membership renewing within seven days
- A booked, unconfirmed appointment within the next 48 hours

All records use:

- Organization: `00000000-0000-0000-0000-000000000001`
- Branch: `00000000-0000-0000-0000-000000000001`
- Deterministic UUIDs beginning with `492`

## Validation steps

1. Apply the latest migration, including:
   `supabase/migrations/006_phase4_9_2_booked_confirmation_compatibility.sql`
2. Open the Supabase SQL Editor.
3. Run the complete contents of:
   `supabase/seeds/phase4_9_2_opportunity_test_seed.sql`
4. Run the Opportunity Generation Engine:

```sql
select public.generate_all_daily_opportunities(now());
```

The returned JSON should report generated rebooking, renewal, message and
timeline records.

5. Check the generated totals:

```sql
select count(*) from public.rebooking_opportunities;
select count(*) from public.renewal_opportunities;
select count(*) from public.message_queue;
select count(*) from public.customer_timeline;
```

6. Check only Phase 4.9.2 validation output:

```sql
select id, customer_id, priority_score, reason, generation_key
from public.rebooking_opportunities
where generation_key like 'phase4.9.1:%492%';

select id, customer_id, opportunity_type, priority_score, generation_key
from public.renewal_opportunities
where generation_key like 'phase4.9.1:%492%';

select id, customer_id, purpose, status, idempotency_key
from public.message_queue
where idempotency_key like 'phase4.9.1:%492%';

select id, customer_id, event_type, title, metadata
from public.customer_timeline
where metadata ->> 'generation_key' like 'phase4.9.1:%492%';
```

Expected minimum validation output:

- 2 rebooking opportunities
- 2 renewal opportunities
- 5 queued messages
- 5 customer timeline events

7. Run the generator a second time:

```sql
select public.generate_all_daily_opportunities(now());
```

The second run should create zero additional records for these unchanged test
cases. This confirms idempotency.

8. Open the Sabai Haus Dashboard and `/action-center`.

The Action Center refreshes every 60 seconds. Rebooking, renewals, pending
messages and estimated revenue should no longer display zero. A page refresh
can be used for immediate verification.

## Cleanup

Run the complete contents of:

`supabase/seeds/phase4_9_2_cleanup.sql`

The cleanup removes the deterministic validation data and related generated
records only. It does not alter RLS policies, production functions, cron jobs,
or external communication settings.
