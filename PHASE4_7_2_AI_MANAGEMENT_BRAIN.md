# Phase 4.7.2 - Deterministic AI Management Brain

## Objective

Phase 4.7.2 turns the Business Intelligence snapshot into an operational
decision engine. It uses deterministic rules and scoring models only.

No OpenAI API, external AI API, or external service is called.

## Management Brain

The management brain reads the existing live-or-fallback Business Intelligence
snapshot and generates:

- Management insights
- Growth opportunities
- Retention alerts
- Capacity alerts
- Package risk alerts
- Revenue alerts
- Therapist coaching and marketing opportunities
- Ranked owner actions
- A six-component Business Health Score

Primary engine:

`src/modules/businessIntelligence/managementBrain.ts`

## Exported Rules

- `generateManagementInsights`
- `generateGrowthOpportunities`
- `generateRetentionAlerts`
- `generateCapacityAlerts`
- `generatePackageRiskAlerts`
- `generateRevenueAlerts`
- `buildManagementBrain`

Every result includes traceable source metrics, confidence, impact, or a
recommended action. Confidence values describe rule certainty, not machine
learning probability.

## Executive Brief

The new `Executive Brief` tab displays:

- Owner greeting and period revenue movement
- Retention, package liability, capacity, and premium inactivity observations
- Ranked Recommended Actions
- Growth opportunities and potential monthly upside
- Premium customer retention alerts
- Therapist coaching and marketing actions
- Package exposure and mitigation
- Revenue forecast, missed revenue, potential revenue, and revenue per visit

The view uses the same data-source status as the existing Business Intelligence
Center, so it automatically follows live Supabase data or the mock fallback.

## Scoring Model

The Business Health Score is a weighted 0-100 score:

| Component | Weight |
| --- | ---: |
| Revenue Growth | 22% |
| Customer Retention | 20% |
| Therapist Utilization | 18% |
| Package Liability | 14% |
| Capacity Efficiency | 14% |
| Customer Activity | 12% |

Rules clamp every component to 0-100. Health status is:

- Strong: 80-100
- Stable: 60-79
- Attention: below 60

## Key Business Rules

### Growth

- Highest-revenue service is treated as the strongest observed service demand.
- Therapists below 80% utilization generate capacity opportunities.
- A conservative 5% revenue-per-visit improvement creates an upsell estimate.

### Retention

- Customers inactive for at least 45 days are prioritized.
- VIP, Gold, and Diamond customers receive premium retention priority.
- Risk and lifetime value determine action ordering.

### Capacity

- The highest daily revenue point becomes the observed peak-demand day.
- Therapists below 75% utilization are identified as overflow capacity.
- Estimated upside uses current average revenue per visit.

### Package Risk

- Liability concentration, upcoming expiries, and low redemption rates combine
  into package risk.
- Critical and high-risk packages receive immediate redemption-capacity
  recommendations.

### Revenue

- Forecasts use the existing deterministic Business Intelligence projection.
- Missed revenue estimates therapist utilization below 75%.
- Potential revenue combines recoverable capacity and conservative value growth.

### Therapist Opportunities

- Performance scores of 85 or higher identify top performers.
- Utilization below 75% generates marketing actions.
- Rebooking below 65% generates coaching actions.
- Completion below 90% generates cancellation-risk actions.

## Current Data Boundaries

Room-level capacity, service capacity by weekday, and structured membership
expiry records are not yet part of the Phase 4.7.1 intelligence snapshot.
Phase 4.7.2 therefore uses observed daily revenue, therapist utilization,
customer membership labels, customer risk reasons, and package expiry data.
The rules can consume richer capacity and membership fields later without
changing the UI contract.

## Verification

- `npm run lint`
- `npm run build`

Both commands pass for this phase.
