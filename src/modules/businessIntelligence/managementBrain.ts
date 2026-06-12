import type {
  BusinessIntelligenceSnapshot,
  CapacityAlert,
  GrowthOpportunity,
  ManagementBrainResult,
  ManagementHealthScore,
  ManagementRecommendation,
  PackageRiskAlert,
  RetentionAlert,
  RevenueAlert,
  TherapistOpportunity,
} from '../../types/businessIntelligence'

const clamp = (value: number) => Math.min(100, Math.max(0, Math.round(value)))

function numberFromKpi(snapshot: BusinessIntelligenceSnapshot, label: string) {
  const value = snapshot.kpis.find((item) => item.label === label)?.value ?? '0'
  return Number.parseFloat(value.replace(/[^\d.-]/g, '')) || 0
}

function changeFromKpi(snapshot: BusinessIntelligenceSnapshot, label: string) {
  const value = snapshot.kpis.find((item) => item.label === label)?.change ?? '0'
  return Number.parseFloat(value.replace(/[^\d.-]/g, '')) || 0
}

function money(value: number) {
  return `RM ${Math.round(value).toLocaleString()}`
}

function priority(
  score: number,
): ManagementRecommendation['priority'] {
  if (score >= 85) return 'Critical'
  if (score >= 65) return 'High'
  return 'Medium'
}

export function generateGrowthOpportunities(
  snapshot: BusinessIntelligenceSnapshot,
): GrowthOpportunity[] {
  const topService = snapshot.calculations.revenueByService[0]
  const underutilized = [...snapshot.therapists]
    .filter((therapist) => therapist.utilization < 80)
    .sort((first, second) => first.utilization - second.utilization)[0]
  const averageVisit = snapshot.calculations.averageRevenuePerVisit
  const serviceUpside = topService
    ? Math.round(topService.amount * Math.max(0.06, changeFromKpi(snapshot, 'Monthly Revenue') / 100))
    : 0
  const capacityUpside = underutilized
    ? Math.round(
        ((80 - underutilized.utilization) / 100) *
          Math.max(underutilized.appointments, 20) *
          averageVisit,
      )
    : 0

  return [
    ...(topService
      ? [{
          id: `growth-service-${topService.id}`,
          title: `${topService.label} is the highest-demand service`,
          signal: `${topService.appointments} visits generated ${money(topService.amount)} in the selected period.`,
          potentialMonthlyUpside: serviceUpside,
          confidence: clamp(76 + Math.min(18, topService.appointments / 5)),
          recommendedAction: 'Protect peak availability and add bookable capacity around the strongest demand periods.',
        }]
      : []),
    ...(underutilized
      ? [{
          id: `growth-capacity-${underutilized.id}`,
          title: `${underutilized.name} has unused revenue capacity`,
          signal: `${underutilized.utilization}% utilization with a ${underutilized.rating.toFixed(1)} customer rating.`,
          potentialMonthlyUpside: capacityUpside,
          confidence: clamp(70 + underutilized.rating * 4),
          recommendedAction: 'Route matching recovery and rebooking campaigns into this therapist’s available hours.',
        }]
      : []),
    {
      id: 'growth-upsell',
      title: 'Raise value per completed visit',
      signal: `Average revenue per visit is ${money(averageVisit)} and therapist upsell performance remains uneven.`,
      potentialMonthlyUpside: Math.round(
        snapshot.calculations.monthlyRevenue * 0.05,
      ),
      confidence: 78,
      recommendedAction: 'Coach therapists to recommend one relevant treatment add-on after wellness assessment.',
    },
  ]
}

export function generateRetentionAlerts(
  snapshot: BusinessIntelligenceSnapshot,
): RetentionAlert[] {
  return snapshot.atRiskCustomers
    .filter(
      (customer) =>
        customer.daysInactive >= 45 ||
        customer.membershipTier === 'VIP' ||
        ['Gold', 'Diamond'].includes(customer.membershipTier),
    )
    .map((customer) => ({
      id: customer.id,
      customer: customer.name,
      segment: customer.membershipTier,
      daysInactive: customer.daysInactive,
      lifetimeValue: customer.lifetimeValue,
      riskScore: customer.riskScore,
      suggestedAction: customer.recommendedAction,
    }))
    .sort((first, second) => second.riskScore - first.riskScore)
}

export function generateCapacityAlerts(
  snapshot: BusinessIntelligenceSnapshot,
): CapacityAlert[] {
  const averageVisit = snapshot.calculations.averageRevenuePerVisit
  const daily = [...snapshot.calculations.dailyRevenue].sort(
    (first, second) => second.amount - first.amount,
  )
  const peakDay = daily[0]
  const averageDailyRevenue = daily.length
    ? daily.reduce((sum, day) => sum + day.amount, 0) / daily.length
    : 0
  const teamUtilization = numberFromKpi(snapshot, 'Team Utilization')
  const alerts: CapacityAlert[] = []

  if (peakDay) {
    const date = new Date(`${peakDay.date}T12:00:00`)
    const dayName = new Intl.DateTimeFormat('en-MY', {
      weekday: 'long',
    }).format(date)
    const demandIndex = averageDailyRevenue
      ? (peakDay.amount / averageDailyRevenue) * 100
      : 100
    alerts.push({
      id: 'capacity-peak-day',
      title: `${dayName} is the strongest observed demand day`,
      utilization: clamp(demandIndex),
      availableCapacity: clamp(100 - teamUtilization),
      estimatedUpside: Math.round(Math.max(averageVisit * 4, peakDay.amount * 0.08)),
      confidence: clamp(72 + daily.length * 2),
      recommendedAction: 'Review room and therapist availability, then open controlled overflow slots.',
    })
  }

  snapshot.therapists
    .filter((therapist) => therapist.utilization < 75)
    .forEach((therapist) => {
      alerts.push({
        id: `capacity-${therapist.id}`,
        title: `${therapist.name} can absorb additional appointments`,
        utilization: therapist.utilization,
        availableCapacity: 100 - therapist.utilization,
        estimatedUpside: Math.round(
          ((80 - therapist.utilization) / 100) *
            Math.max(therapist.appointments, 20) *
            averageVisit,
        ),
        confidence: clamp(68 + therapist.rating * 5),
        recommendedAction: 'Route overflow demand and suitable customer recovery offers to available hours.',
      })
    })

  return alerts
}

export function generatePackageRiskAlerts(
  snapshot: BusinessIntelligenceSnapshot,
): PackageRiskAlert[] {
  const totalLiability = Math.max(
    1,
    snapshot.calculations.packageMetrics.unusedPackageValue,
  )

  return snapshot.packageLiabilities.map((item) => {
    const concentration = (item.liabilityValue / totalLiability) * 100
    const riskScore =
      concentration * 0.65 +
      item.expiringWithin30Days * 4 +
      Math.max(0, 75 - item.redemptionRate)

    return {
      id: item.id,
      packageName: item.name,
      riskLevel:
        riskScore >= 70
          ? 'Critical'
          : riskScore >= 48
            ? 'High'
            : riskScore >= 25
              ? 'Moderate'
              : 'Low',
      estimatedExposure: item.liabilityValue,
      outstandingSessions: item.outstandingSessions,
      expiringWithin30Days: item.expiringWithin30Days,
      recommendedMitigation:
        item.expiringWithin30Days > 0
          ? 'Reserve redemption capacity and contact expiring package holders this week.'
          : 'Maintain scheduled redemption reminders and monitor session velocity.',
    }
  })
}

export function generateRevenueAlerts(
  snapshot: BusinessIntelligenceSnapshot,
): RevenueAlert[] {
  const monthlyRevenue = snapshot.calculations.monthlyRevenue
  const forecast =
    snapshot.revenueForecast.find((item) => item.actual === undefined)?.forecast ??
    monthlyRevenue
  const growth = changeFromKpi(snapshot, 'Monthly Revenue')
  const capacityMissedRevenue = snapshot.therapists.reduce(
    (sum, therapist) =>
      sum +
      Math.max(0, 75 - therapist.utilization) *
        snapshot.calculations.averageRevenuePerVisit *
        0.25,
    0,
  )
  const potentialRevenue =
    capacityMissedRevenue + monthlyRevenue * (growth >= 0 ? 0.05 : 0.08)

  return [
    {
      id: 'revenue-forecast',
      title: 'Next-period revenue forecast',
      value: forecast,
      displayValue: money(forecast),
      direction: forecast >= monthlyRevenue ? 'positive' : 'negative',
      explanation: 'Deterministic projection based on current revenue momentum.',
    },
    {
      id: 'revenue-missed',
      title: 'Estimated missed capacity revenue',
      value: Math.round(capacityMissedRevenue),
      displayValue: money(capacityMissedRevenue),
      direction: capacityMissedRevenue > 0 ? 'negative' : 'neutral',
      explanation: 'Estimated from therapist utilization below the 75% operating threshold.',
    },
    {
      id: 'revenue-potential',
      title: 'Potential monthly revenue',
      value: Math.round(potentialRevenue),
      displayValue: money(potentialRevenue),
      direction: 'positive',
      explanation: 'Combined capacity recovery and conservative visit-value improvement.',
    },
    {
      id: 'revenue-average-visit',
      title: 'Average revenue per visit',
      value: snapshot.calculations.averageRevenuePerVisit,
      displayValue: money(snapshot.calculations.averageRevenuePerVisit),
      direction: 'neutral',
      explanation: 'Completed appointment revenue divided by completed visits.',
    },
  ]
}

function generateTherapistOpportunities(
  snapshot: BusinessIntelligenceSnapshot,
): TherapistOpportunity[] {
  return snapshot.therapists.flatMap((therapist, index) => {
    const opportunities: TherapistOpportunity[] = []
    if (index === 0 || therapist.performanceScore >= 85) {
      opportunities.push({
        id: `${therapist.id}-top`,
        therapist: therapist.name,
        type: 'Top performer',
        metric: `${therapist.performanceScore}/100 performance score`,
        coachingAction: 'Document the therapist’s consultation and rebooking approach for team coaching.',
        marketingAction: 'Feature this therapist in premium service and loyalty campaigns.',
      })
    }
    if (therapist.utilization < 75) {
      opportunities.push({
        id: `${therapist.id}-capacity`,
        therapist: therapist.name,
        type: 'Underutilized',
        metric: `${therapist.utilization}% utilization`,
        coachingAction: 'Review schedule preferences, service mix and available peak-hour coverage.',
        marketingAction: 'Route recovery and overflow demand into the therapist’s open periods.',
      })
    }
    if (therapist.rebookingRate < 65) {
      opportunities.push({
        id: `${therapist.id}-rebooking`,
        therapist: therapist.name,
        type: 'Rebooking',
        metric: `${therapist.rebookingRate}% rebooking rate`,
        coachingAction: 'Coach a consistent post-treatment recommendation and next-visit conversation.',
        marketingAction: 'Send therapist-personalized follow-ups within 24 hours of treatment.',
      })
    }
    if (therapist.completionRate < 90) {
      opportunities.push({
        id: `${therapist.id}-cancellation`,
        therapist: therapist.name,
        type: 'Cancellation risk',
        metric: `${therapist.completionRate}% completion rate`,
        coachingAction: 'Audit schedule handoffs and recurring cancellation reasons.',
        marketingAction: 'Use confirmations and waitlist backfill for this therapist’s appointments.',
      })
    }
    return opportunities
  })
}

function buildHealthScore(
  snapshot: BusinessIntelligenceSnapshot,
): ManagementHealthScore {
  const revenueGrowth = changeFromKpi(snapshot, 'Monthly Revenue')
  const retention = numberFromKpi(snapshot, 'Customer Retention')
  const utilization = numberFromKpi(snapshot, 'Team Utilization')
  const liability = snapshot.calculations.packageMetrics.unusedPackageValue
  const revenue = Math.max(1, snapshot.calculations.monthlyRevenue)
  const active = snapshot.calculations.customerMetrics.activeCustomers
  const inactive = snapshot.calculations.customerMetrics.inactiveOver45Days
  const components: ManagementHealthScore['components'] = [
    { label: 'Revenue Growth', score: clamp(55 + revenueGrowth * 2.2), weight: 22 },
    { label: 'Customer Retention', score: clamp(retention), weight: 20 },
    { label: 'Therapist Utilization', score: clamp(utilization), weight: 18 },
    { label: 'Package Liability', score: clamp(100 - (liability / revenue) * 100), weight: 14 },
    { label: 'Capacity Efficiency', score: clamp(100 - Math.abs(82 - utilization) * 2.2), weight: 14 },
    { label: 'Customer Activity', score: clamp((active / Math.max(1, active + inactive)) * 100), weight: 12 },
  ]
  const score = Math.round(
    components.reduce(
      (sum, component) => sum + component.score * component.weight,
      0,
    ) / 100,
  )
  return {
    score,
    status: score >= 80 ? 'Strong' : score >= 60 ? 'Stable' : 'Attention',
    components,
  }
}

export function generateManagementInsights(
  snapshot: BusinessIntelligenceSnapshot,
): ManagementRecommendation[] {
  const growth = generateGrowthOpportunities(snapshot)
  const retention = generateRetentionAlerts(snapshot)
  const capacity = generateCapacityAlerts(snapshot)
  const packages = generatePackageRiskAlerts(snapshot)
  const revenue = generateRevenueAlerts(snapshot)
  const highestPackageRisk = packages[0]
  const actions: ManagementRecommendation[] = []

  growth.slice(0, 2).forEach((item) => {
    actions.push({
      id: item.id,
      category: 'Growth',
      title: item.title,
      summary: item.recommendedAction,
      priority: priority(item.confidence),
      impact: 'Revenue',
      estimatedImpact: money(item.potentialMonthlyUpside),
      confidence: item.confidence,
      actionLabel: 'Review opportunity',
    })
  })
  if (retention.length) {
    const valueAtRisk = retention.reduce(
      (sum, customer) => sum + customer.lifetimeValue,
      0,
    )
    actions.push({
      id: 'retention-recovery',
      category: 'Retention',
      title: `Recover ${retention.length} high-priority customers`,
      summary: 'Launch therapist-led outreach, starting with the highest lifetime-value customers.',
      priority: retention.some((customer) => customer.riskScore >= 85)
        ? 'Critical'
        : 'High',
      impact: 'Retention',
      estimatedImpact: `${money(valueAtRisk)} protected value`,
      confidence: 94,
      actionLabel: 'Open recovery list',
    })
  }
  if (highestPackageRisk) {
    actions.push({
      id: `package-${highestPackageRisk.id}`,
      category: 'Package',
      title: `Reduce ${highestPackageRisk.packageName} exposure`,
      summary: highestPackageRisk.recommendedMitigation,
      priority:
        highestPackageRisk.riskLevel === 'Critical' ? 'Critical' : 'High',
      impact: 'Utilization',
      estimatedImpact: `${money(highestPackageRisk.estimatedExposure)} exposure`,
      confidence: 96,
      actionLabel: 'Plan redemptions',
    })
  }
  if (capacity.length) {
    const item = capacity[0]
    actions.push({
      id: item.id,
      category: 'Capacity',
      title: item.title,
      summary: item.recommendedAction,
      priority: item.utilization >= 90 ? 'Critical' : 'High',
      impact: 'Utilization',
      estimatedImpact: money(item.estimatedUpside),
      confidence: item.confidence,
      actionLabel: 'Review capacity',
    })
  }
  const forecast = revenue.find((item) => item.id === 'revenue-forecast')
  if (forecast && forecast.direction === 'negative') {
    actions.push({
      id: 'revenue-protection',
      category: 'Revenue',
      title: 'Protect the next-period revenue forecast',
      summary: 'Prioritize customer recovery and fill underused therapist capacity before adding cost.',
      priority: 'High',
      impact: 'Revenue',
      estimatedImpact: forecast.displayValue,
      confidence: 82,
      actionLabel: 'Review revenue plan',
    })
  }

  return actions
    .sort((first, second) => {
      const rank = { Critical: 3, High: 2, Medium: 1 }
      return rank[second.priority] - rank[first.priority]
    })
    .slice(0, 6)
}

export function buildManagementBrain(
  snapshot: BusinessIntelligenceSnapshot,
  ownerName = 'Amelia',
): ManagementBrainResult {
  const growthOpportunities = generateGrowthOpportunities(snapshot)
  const retentionAlerts = generateRetentionAlerts(snapshot)
  const capacityAlerts = generateCapacityAlerts(snapshot)
  const packageRiskAlerts = generatePackageRiskAlerts(snapshot)
  const revenueAlerts = generateRevenueAlerts(snapshot)
  const managementInsights = generateManagementInsights(snapshot)
  const revenueGrowth = changeFromKpi(snapshot, 'Monthly Revenue')
  const retention = numberFromKpi(snapshot, 'Customer Retention')
  const packageLiability = snapshot.calculations.packageMetrics.unusedPackageValue
  const peakCapacity = capacityAlerts[0]
  const premiumInactive = retentionAlerts.filter((item) =>
    ['VIP', 'Gold', 'Diamond'].includes(item.segment),
  ).length

  return {
    generatedAt: snapshot.generatedAt,
    executiveBrief: {
      greeting: `Good Morning ${ownerName},`,
      headline:
        revenueGrowth >= 0
          ? `Revenue increased ${revenueGrowth.toFixed(1)}% this period.`
          : `Revenue declined ${Math.abs(revenueGrowth).toFixed(1)}% this period.`,
      observations: [
        `Customer retention is currently ${retention.toFixed(0)}%.`,
        `Package liability is ${money(packageLiability)} across ${snapshot.calculations.packageMetrics.outstandingSessions} outstanding sessions.`,
        peakCapacity
          ? `${peakCapacity.title} with a ${peakCapacity.utilization}% demand index.`
          : 'No material capacity bottleneck was detected.',
        `${premiumInactive} premium customers have exceeded the 45-day return window.`,
      ],
      recommendedActions: managementInsights
        .slice(0, 4)
        .map((item) => item.summary),
    },
    managementInsights,
    growthOpportunities,
    retentionAlerts,
    capacityAlerts,
    packageRiskAlerts,
    revenueAlerts,
    therapistOpportunities: generateTherapistOpportunities(snapshot),
    recommendedActions: managementInsights,
    health: buildHealthScore(snapshot),
  }
}
