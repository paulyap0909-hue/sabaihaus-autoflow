# Phase 4.7 Business Intelligence Center

Phase 4.7 positions Sabai Haus as a Wellness Operating System by turning
operational data into executive decisions.

The Business Intelligence Center is available at `/reports` and contains:

1. Executive Dashboard
2. Therapist Intelligence
3. Customer Intelligence
4. Package Intelligence
5. Revenue Intelligence
6. AI Insights

## Intelligence Model

`src/types/businessIntelligence.ts` defines one typed snapshot containing:

- Executive KPIs and comparisons.
- Business Health Score and component scores.
- Revenue trends and forecasts.
- Therapist performance and utilization.
- Customer segments and retention risk.
- Package liability and redemption exposure.
- Revenue mix.
- AI business insights.

The UI currently reads `src/services/mockBusinessIntelligence.ts`.

## Supabase Integration Boundary

`src/services/repositories/businessIntelligenceRepository.ts` defines the query
contract that will replace mock data. The view components only depend on the
snapshot type, so switching data sources does not require rewriting the UI.

Recommended production implementation:

1. Create tenant-scoped reporting views or materialized views.
2. Aggregate revenue, utilization, retention, and liability server-side.
3. Add date-range and branch filters to a Supabase RPC.
4. Refresh expensive executive aggregates asynchronously.
5. Apply Row Level Security before exposing intelligence data.

## AI Insights

The current insights are deterministic demo content and are labeled as such in
the interface. A production AI service should receive only approved aggregated
metrics, not unrestricted customer records.

Future AI responses should use the `AiBusinessInsight` contract and include:

- Category
- Priority
- Confidence
- Supporting narrative
- Estimated impact
- Recommended action

## Visualizations

Charts are lightweight responsive SVG and CSS components. No additional chart
dependency is required. The same chart system supports actual, comparison,
forecast, and target series.
