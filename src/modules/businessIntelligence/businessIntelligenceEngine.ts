import { businessIntelligenceSnapshot } from '../../services/mockBusinessIntelligence'
import type {
  AiBusinessInsight,
  AiManagementBrainInput,
  AtRiskCustomer,
  BusinessHealthComponent,
  BusinessIntelligenceSnapshot,
  CustomerSegment,
  PackageLiability,
  RevenueBreakdownItem,
  RevenueForecastPoint,
  RevenueMixItem,
  TherapistIntelligence,
  TrendPoint,
} from '../../types/businessIntelligence'

export interface IntelligenceCustomerRow {
  id: string
  full_name: string
  birthday: string | null
  retention_status: string
  last_visit_at: string | null
  lifetime_value_minor: number
  total_spent_minor?: number
  total_visits?: number
}

export interface IntelligenceTherapistRow {
  id: string
  full_name: string
  rating: number | null
  status: string
}

export interface IntelligenceAppointmentRow {
  id: string
  customer_id: string
  therapist_id: string | null
  service_id: string
  starts_at: string
  ends_at: string
  status: string
  price_minor: number
  completed_at: string | null
}

export interface IntelligencePackageDefinitionRow {
  id: string
  name: string
  total_sessions: number
  price_minor: number
}

export interface IntelligenceCustomerPackageRow {
  id: string
  customer_id: string
  package_definition_id: string
  total_sessions: number
  remaining_sessions: number
  expires_at: string
  status: string
}

export interface IntelligencePackageRedemptionRow {
  id: string
  customer_package_id: string
  sessions_redeemed: number
  redeemed_at: string
}

export interface IntelligenceCommissionRow {
  therapist_id: string
  appointment_id: string | null
  commission_amount_minor: number
  earned_at: string
  status: string
}

export interface IntelligenceInventoryUsageRow {
  appointment_id: string
  cost_minor: number
  used_at: string
}

export interface IntelligenceNotificationRow {
  status: string
  scheduled_at: string
  sent_at: string | null
}

export interface IntelligenceFollowUpRow {
  customer_id: string
  task_type: string
  due_at: string
  status: string
}

export interface IntelligenceAppointmentEventRow {
  appointment_id: string
  event_type: string
  occurred_at: string
}

export interface BusinessIntelligenceRawData {
  customers: IntelligenceCustomerRow[]
  therapists: IntelligenceTherapistRow[]
  appointments: IntelligenceAppointmentRow[]
  packageDefinitions: IntelligencePackageDefinitionRow[]
  customerPackages: IntelligenceCustomerPackageRow[]
  packageRedemptions: IntelligencePackageRedemptionRow[]
  commissionEntries: IntelligenceCommissionRow[]
  inventoryUsageLogs: IntelligenceInventoryUsageRow[]
  notificationQueue: IntelligenceNotificationRow[]
  followUpTasks: IntelligenceFollowUpRow[]
  appointmentEvents: IntelligenceAppointmentEventRow[]
}

export interface BusinessIntelligenceEngineQuery {
  periodStart: string
  periodEnd: string
  comparisonPeriodStart: string
  comparisonPeriodEnd: string
}

const DAY_MS = 86_400_000

function clamp(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, value))
}

function percentage(numerator: number, denominator: number) {
  return denominator > 0 ? (numerator / denominator) * 100 : 0
}

function money(minor: number) {
  return minor / 100
}

function isWithin(value: string | null, start: Date, end: Date) {
  if (!value) return false
  const time = new Date(value).getTime()
  return time >= start.getTime() && time <= end.getTime()
}

function startOfDay(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function daysBetween(earlier: string | null, later: Date) {
  if (!earlier) return 999
  return Math.max(
    0,
    Math.floor(
      (startOfDay(later).getTime() -
        startOfDay(new Date(earlier)).getTime()) /
        DAY_MS,
    ),
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function monthKey(value: string) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function shortMonth(value: string) {
  return new Intl.DateTimeFormat('en-MY', { month: 'short' }).format(
    new Date(value),
  )
}

function buildMonthlyTrend(
  appointments: IntelligenceAppointmentRow[],
  periodEnd: Date,
): TrendPoint[] {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(periodEnd.getFullYear(), periodEnd.getMonth() - (5 - index), 1)
    return {
      key: monthKey(date.toISOString()),
      label: shortMonth(date.toISOString()),
      previousKey: monthKey(
        new Date(date.getFullYear() - 1, date.getMonth(), 1).toISOString(),
      ),
    }
  })

  const revenueByMonth = new Map<string, number>()
  appointments
    .filter((item) => item.status === 'Completed' && item.completed_at)
    .forEach((item) => {
      const key = monthKey(item.completed_at as string)
      revenueByMonth.set(
        key,
        (revenueByMonth.get(key) ?? 0) + money(item.price_minor),
      )
    })

  return months.map((month) => ({
    label: month.label,
    value: revenueByMonth.get(month.key) ?? 0,
    comparison: revenueByMonth.get(month.previousKey) ?? 0,
  }))
}

function getBirthdayThisWeek(customer: IntelligenceCustomerRow, now: Date) {
  if (!customer.birthday) return false
  const birthday = new Date(customer.birthday)
  const thisYear = new Date(
    now.getFullYear(),
    birthday.getUTCMonth(),
    birthday.getUTCDate(),
  )
  const days = Math.floor(
    (startOfDay(thisYear).getTime() - startOfDay(now).getTime()) / DAY_MS,
  )
  return days >= 0 && days <= 7
}

function buildCustomerRisk(
  customer: IntelligenceCustomerRow,
  now: Date,
): AtRiskCustomer {
  const daysInactive = daysBetween(customer.last_visit_at, now)
  const lifetimeValue = money(
    customer.total_spent_minor ?? customer.lifetime_value_minor,
  )
  const statusWeight =
    customer.retention_status === 'Lost'
      ? 35
      : customer.retention_status === 'At Risk'
        ? 25
        : customer.retention_status === 'Follow Up Soon'
          ? 12
          : 0
  const riskScore = Math.round(
    clamp(Math.min(daysInactive, 120) * 0.5 + statusWeight),
  )
  const reason =
    daysInactive >= 60
      ? `No completed visit for ${daysInactive} days.`
      : daysInactive >= 45
        ? 'Visit frequency has moved beyond the expected return window.'
        : 'Approaching the recommended recovery outreach window.'

  return {
    id: customer.id,
    name: customer.full_name,
    membershipTier: customer.retention_status === 'VIP' ? 'VIP' : 'Guest',
    daysInactive,
    lifetimeValue,
    riskScore,
    reason,
    recommendedAction:
      customer.retention_status === 'Lost'
        ? 'Use therapist-led personal outreach with a relevant recovery offer.'
        : daysInactive >= 60
          ? 'Send a personalized recovery message and priority booking option.'
          : 'Create a follow-up task before the customer reaches 60 inactive days.',
  }
}

function buildRuleBasedInsights(
  monthlyRevenue: number,
  revenueGrowth: number,
  atRiskCustomers: AtRiskCustomer[],
  packageLiabilities: PackageLiability[],
  therapists: TherapistIntelligence[],
): AiBusinessInsight[] {
  const highestLiability = packageLiabilities[0]
  const underusedTherapist = [...therapists].sort(
    (first, second) => first.utilization - second.utilization,
  )[0]
  const highValueRisk = atRiskCustomers.filter(
    (customer) => customer.lifetimeValue >= 1000,
  )

  return [
    {
      id: 'RULE-REVENUE',
      category: 'Growth',
      title: revenueGrowth >= 0 ? 'Protect current revenue momentum' : 'Recover declining revenue momentum',
      narrative: `Current-period revenue is RM ${monthlyRevenue.toLocaleString()} with ${revenueGrowth.toFixed(1)}% growth versus the comparison period.`,
      impact: `${Math.abs(revenueGrowth).toFixed(1)}% period movement`,
      confidence: 100,
      priority: revenueGrowth < 0 ? 'High' : 'Medium',
      recommendedAction:
        revenueGrowth < 0
          ? 'Review lost appointments, inactive customers and therapist capacity this week.'
          : 'Preserve high-performing services and monitor capacity constraints.',
    },
    {
      id: 'RULE-RETENTION',
      category: 'Retention',
      title: 'Prioritize high-value recovery outreach',
      narrative: `${highValueRisk.length} customers with at least RM 1,000 lifetime value are currently at risk.`,
      impact: `RM ${highValueRisk.reduce((sum, item) => sum + item.lifetimeValue, 0).toLocaleString()} historical value`,
      confidence: 100,
      priority: highValueRisk.length > 3 ? 'High' : 'Medium',
      recommendedAction: 'Create therapist-personalized recovery tasks for the highest-risk customers.',
    },
    {
      id: 'RULE-PACKAGE',
      category: 'Risk',
      title: highestLiability
        ? `Plan capacity for ${highestLiability.name}`
        : 'Monitor package delivery exposure',
      narrative: highestLiability
        ? `${highestLiability.outstandingSessions} sessions remain outstanding across ${highestLiability.activePackages} active packages.`
        : 'No active package liability was found for the selected period.',
      impact: highestLiability
        ? `RM ${highestLiability.liabilityValue.toLocaleString()} liability`
        : 'No current liability',
      confidence: 100,
      priority: highestLiability?.expiringWithin30Days ? 'High' : 'Watch',
      recommendedAction: 'Reserve suitable off-peak appointment capacity before package expiry dates.',
    },
    {
      id: 'RULE-CAPACITY',
      category: 'Capacity',
      title: underusedTherapist
        ? `${underusedTherapist.name} has available growth capacity`
        : 'Monitor therapist capacity',
      narrative: underusedTherapist
        ? `${underusedTherapist.name} is operating at ${underusedTherapist.utilization}% utilization with a ${underusedTherapist.rating.toFixed(1)} rating.`
        : 'No active therapist capacity data was available.',
      impact: underusedTherapist
        ? `${100 - underusedTherapist.utilization}% capacity available`
        : 'Capacity unavailable',
      confidence: 100,
      priority: 'Medium',
      recommendedAction: 'Route matching customer campaigns into available therapist hours.',
    },
  ]
}

export function buildBusinessIntelligenceSnapshot(
  raw: BusinessIntelligenceRawData,
  query: BusinessIntelligenceEngineQuery,
): BusinessIntelligenceSnapshot {
  const periodStart = new Date(query.periodStart)
  const periodEnd = new Date(query.periodEnd)
  const comparisonStart = new Date(query.comparisonPeriodStart)
  const comparisonEnd = new Date(query.comparisonPeriodEnd)
  const now = periodEnd

  const periodAppointments = raw.appointments.filter((item) =>
    isWithin(item.starts_at, periodStart, periodEnd),
  )
  const completed = periodAppointments.filter(
    (item) => item.status === 'Completed',
  )
  const comparisonCompleted = raw.appointments.filter(
    (item) =>
      item.status === 'Completed' &&
      isWithin(item.starts_at, comparisonStart, comparisonEnd),
  )
  const monthlyRevenue = completed.reduce(
    (sum, item) => sum + money(item.price_minor),
    0,
  )
  const comparisonRevenue = comparisonCompleted.reduce(
    (sum, item) => sum + money(item.price_minor),
    0,
  )
  const revenueGrowth = percentage(
    monthlyRevenue - comparisonRevenue,
    comparisonRevenue,
  )
  const inventoryCost = raw.inventoryUsageLogs
    .filter((item) => isWithin(item.used_at, periodStart, periodEnd))
    .reduce((sum, item) => sum + money(item.cost_minor), 0)
  const commissionCost = raw.commissionEntries
    .filter(
      (item) =>
        item.status !== 'Reversed' &&
        isWithin(item.earned_at, periodStart, periodEnd),
    )
    .reduce((sum, item) => sum + money(item.commission_amount_minor), 0)
  const grossMargin = monthlyRevenue
    ? percentage(
        monthlyRevenue - inventoryCost - commissionCost,
        monthlyRevenue,
      )
    : 0

  const comparisonCustomers = new Set(
    comparisonCompleted.map((item) => item.customer_id),
  )
  const retainedCustomers = new Set(
    completed
      .filter((item) => comparisonCustomers.has(item.customer_id))
      .map((item) => item.customer_id),
  )
  const retention = percentage(retainedCustomers.size, comparisonCustomers.size)

  const activeTherapists = raw.therapists.filter(
    (therapist) => therapist.status === 'Active',
  )
  const operatingDays = Math.max(
    1,
    Math.ceil((periodEnd.getTime() - periodStart.getTime()) / DAY_MS),
  )
  const availableMinutes = activeTherapists.length * operatingDays * 8 * 60
  const bookedMinutes = periodAppointments
    .filter((item) => !['Cancelled', 'No Show'].includes(item.status))
    .reduce(
      (sum, item) =>
        sum +
        Math.max(
          0,
          (new Date(item.ends_at).getTime() -
            new Date(item.starts_at).getTime()) /
            60_000,
        ),
      0,
    )
  const teamUtilization = percentage(bookedMinutes, availableMinutes)

  const appointmentsByCustomer = new Map<string, IntelligenceAppointmentRow[]>()
  raw.appointments
    .filter((item) => item.status === 'Completed')
    .forEach((appointment) => {
      const customerAppointments =
        appointmentsByCustomer.get(appointment.customer_id) ?? []
      customerAppointments.push(appointment)
      appointmentsByCustomer.set(appointment.customer_id, customerAppointments)
    })

  const therapists: TherapistIntelligence[] = activeTherapists
    .map((therapist) => {
      const therapistAppointments = periodAppointments.filter(
        (item) => item.therapist_id === therapist.id,
      )
      const completedAppointments = therapistAppointments.filter(
        (item) => item.status === 'Completed',
      )
      const comparisonRevenueForTherapist = comparisonCompleted
        .filter((item) => item.therapist_id === therapist.id)
        .reduce((sum, item) => sum + money(item.price_minor), 0)
      const revenue = completedAppointments.reduce(
        (sum, item) => sum + money(item.price_minor),
        0,
      )
      const therapistMinutes = therapistAppointments
        .filter((item) => !['Cancelled', 'No Show'].includes(item.status))
        .reduce(
          (sum, item) =>
            sum +
            Math.max(
              0,
              (new Date(item.ends_at).getTime() -
                new Date(item.starts_at).getTime()) /
                60_000,
            ),
          0,
        )
      const completedCustomerIds = new Set(
        completedAppointments.map((item) => item.customer_id),
      )
      const rebookedCustomers = [...completedCustomerIds].filter((customerId) => {
        const customerAppointments = appointmentsByCustomer.get(customerId) ?? []
        return customerAppointments.some(
          (item) =>
            item.therapist_id === therapist.id &&
            new Date(item.starts_at).getTime() > periodEnd.getTime() &&
            new Date(item.starts_at).getTime() <=
              periodEnd.getTime() + 60 * DAY_MS,
        )
      }).length
      const utilization = percentage(
        therapistMinutes,
        operatingDays * 8 * 60,
      )
      const completionRate = percentage(
        completedAppointments.length,
        therapistAppointments.filter(
          (item) => !['Cancelled', 'No Show'].includes(item.status),
        ).length,
      )
      const rebookingRate = percentage(
        rebookedCustomers,
        completedCustomerIds.size,
      )
      const upsellRate = 0
      const performanceScore = Math.round(
        clamp(
          utilization * 0.25 +
            completionRate * 0.3 +
            rebookingRate * 0.2 +
            ((therapist.rating ?? 0) / 5) * 100 * 0.15 +
            clamp(percentage(revenue, Math.max(monthlyRevenue, 1)) * 4) * 0.1,
        ),
      )

      return {
        id: therapist.id,
        name: therapist.full_name,
        initials: initials(therapist.full_name),
        revenue,
        appointments: therapistAppointments.length,
        utilization: Math.round(utilization),
        completionRate: Math.round(completionRate),
        rebookingRate: Math.round(rebookingRate),
        upsellRate,
        rating: therapist.rating ?? 0,
        revenueChange: Math.round(
          percentage(
            revenue - comparisonRevenueForTherapist,
            comparisonRevenueForTherapist,
          ),
        ),
        performanceScore,
      }
    })
    .sort((first, second) => second.performanceScore - first.performanceScore)

  const customerRisks = raw.customers
    .map((customer) => buildCustomerRisk(customer, now))
    .filter((customer) => customer.daysInactive >= 30)
    .sort((first, second) => second.riskScore - first.riskScore)
  const vipCustomers = raw.customers.filter(
    (customer) => customer.retention_status === 'VIP',
  )
  const activeCustomers = raw.customers.filter(
    (customer) => customer.retention_status === 'Active',
  )
  const atRiskCount = raw.customers.filter(
    (customer) =>
      customer.retention_status === 'At Risk' ||
      customer.retention_status === 'Follow Up Soon',
  ).length
  const lostCustomers = raw.customers.filter(
    (customer) => customer.retention_status === 'Lost',
  )
  const totalCustomerValue = raw.customers.reduce(
    (sum, customer) =>
      sum +
      money(customer.total_spent_minor ?? customer.lifetime_value_minor),
    0,
  )
  const segmentValue = (customers: IntelligenceCustomerRow[]) =>
    customers.reduce(
      (sum, customer) =>
        sum +
        money(customer.total_spent_minor ?? customer.lifetime_value_minor),
      0,
    )
  const packageCustomerIds = new Set(
    raw.customerPackages
      .filter((item) => item.status !== 'Expired')
      .map((item) => item.customer_id),
  )
  const packageCustomers = raw.customers.filter((customer) =>
    packageCustomerIds.has(customer.id),
  )
  const riskCustomers = raw.customers.filter(
    (customer) =>
      customer.retention_status === 'At Risk' ||
      customer.retention_status === 'Lost',
  )
  const customerSegments: CustomerSegment[] = [
    {
      label: 'VIP Customers',
      customers: vipCustomers.length,
      revenueShare: Math.round(
        percentage(segmentValue(vipCustomers), totalCustomerValue),
      ),
      color: 'gold',
    },
    {
      label: 'Active Customers',
      customers: activeCustomers.length,
      revenueShare: Math.round(
        percentage(segmentValue(activeCustomers), totalCustomerValue),
      ),
      color: 'teal',
    },
    {
      label: 'Package Guests',
      customers: packageCustomers.length,
      revenueShare: Math.round(
        percentage(segmentValue(packageCustomers), totalCustomerValue),
      ),
      color: 'mint',
    },
    {
      label: 'At Risk / Lost',
      customers: riskCustomers.length,
      revenueShare: Math.round(
        percentage(segmentValue(riskCustomers), totalCustomerValue),
      ),
      color: 'sand',
    },
  ]

  const definitionMap = new Map(
    raw.packageDefinitions.map((definition) => [definition.id, definition]),
  )
  const redemptionsByPackage = new Map<string, number>()
  raw.packageRedemptions.forEach((redemption) => {
    redemptionsByPackage.set(
      redemption.customer_package_id,
      (redemptionsByPackage.get(redemption.customer_package_id) ?? 0) +
        redemption.sessions_redeemed,
    )
  })
  const liabilityByDefinition = new Map<
    string,
    {
      activePackages: number
      outstandingSessions: number
      liabilityValue: number
      expiringWithin30Days: number
      totalSessions: number
      redeemedSessions: number
    }
  >()
  raw.customerPackages
    .filter((item) => !['Expired', 'Fully Used'].includes(item.status))
    .forEach((customerPackage) => {
      const definition = definitionMap.get(
        customerPackage.package_definition_id,
      )
      if (!definition) return
      const current = liabilityByDefinition.get(definition.id) ?? {
        activePackages: 0,
        outstandingSessions: 0,
        liabilityValue: 0,
        expiringWithin30Days: 0,
        totalSessions: 0,
        redeemedSessions: 0,
      }
      current.activePackages += 1
      current.outstandingSessions += customerPackage.remaining_sessions
      current.liabilityValue +=
        (money(definition.price_minor) / definition.total_sessions) *
        customerPackage.remaining_sessions
      current.expiringWithin30Days +=
        daysBetween(periodEnd.toISOString(), new Date(customerPackage.expires_at)) <=
          30 && new Date(customerPackage.expires_at) >= periodEnd
          ? 1
          : 0
      current.totalSessions += customerPackage.total_sessions
      current.redeemedSessions +=
        redemptionsByPackage.get(customerPackage.id) ?? 0
      liabilityByDefinition.set(definition.id, current)
    })
  const packageLiabilities: PackageLiability[] = [...liabilityByDefinition]
    .map(([definitionId, values]) => ({
      id: definitionId,
      name: definitionMap.get(definitionId)?.name ?? `Package ${definitionId.slice(0, 8)}`,
      activePackages: values.activePackages,
      outstandingSessions: values.outstandingSessions,
      liabilityValue: Math.round(values.liabilityValue),
      expiringWithin30Days: values.expiringWithin30Days,
      redemptionRate: Math.round(
        percentage(values.redeemedSessions, values.totalSessions),
      ),
    }))
    .sort((first, second) => second.liabilityValue - first.liabilityValue)
  const outstandingSessions = packageLiabilities.reduce(
    (sum, item) => sum + item.outstandingSessions,
    0,
  )
  const packageLiability = packageLiabilities.reduce(
    (sum, item) => sum + item.liabilityValue,
    0,
  )
  const activePackages = raw.customerPackages.filter(
    (item) => !['Expired', 'Fully Used'].includes(item.status),
  )
  const expiresWithin = (days: number) =>
    activePackages.filter((item) => {
      const expiry = new Date(item.expires_at)
      const difference = Math.ceil(
        (expiry.getTime() - periodEnd.getTime()) / DAY_MS,
      )
      return difference >= 0 && difference <= days
    }).length
  const totalPurchasedSessions = activePackages.reduce(
    (sum, item) => sum + item.total_sessions,
    0,
  )
  const redeemedSessions = raw.packageRedemptions.reduce(
    (sum, item) => sum + item.sessions_redeemed,
    0,
  )
  const redemptionRate = percentage(
    redeemedSessions,
    totalPurchasedSessions,
  )

  const revenueBy = (
    key: 'service_id' | 'therapist_id',
    label: (id: string) => string,
  ): RevenueBreakdownItem[] => {
    const values = new Map<string, RevenueBreakdownItem>()
    completed.forEach((appointment) => {
      const id = appointment[key]
      if (!id) return
      const current = values.get(id) ?? {
        id,
        label: label(id),
        amount: 0,
        appointments: 0,
      }
      current.amount += money(appointment.price_minor)
      current.appointments += 1
      values.set(id, current)
    })
    return [...values.values()].sort(
      (first, second) => second.amount - first.amount,
    )
  }
  const therapistNameMap = new Map(
    raw.therapists.map((therapist) => [therapist.id, therapist.full_name]),
  )
  const revenueByService = revenueBy(
    'service_id',
    (id) => `Service ${id.slice(0, 8)}`,
  )
  const revenueByTherapist = revenueBy(
    'therapist_id',
    (id) => therapistNameMap.get(id) ?? `Therapist ${id.slice(0, 8)}`,
  )
  const dailyRevenueMap = new Map<
    string,
    { amount: number; visits: number }
  >()
  completed.forEach((appointment) => {
    const date = appointment.completed_at?.slice(0, 10) ?? appointment.starts_at.slice(0, 10)
    const current = dailyRevenueMap.get(date) ?? { amount: 0, visits: 0 }
    current.amount += money(appointment.price_minor)
    current.visits += 1
    dailyRevenueMap.set(date, current)
  })
  const dailyRevenue = [...dailyRevenueMap]
    .map(([date, values]) => ({ date, ...values }))
    .sort((first, second) => first.date.localeCompare(second.date))

  const sentNotifications = raw.notificationQueue.filter(
    (item) => item.status === 'Sent',
  ).length
  const completedNotifications = raw.notificationQueue.filter((item) =>
    ['Sent', 'Failed'].includes(item.status),
  ).length
  const notificationDeliveryRate = percentage(
    sentNotifications,
    completedNotifications,
  )
  const openFollowUps = raw.followUpTasks.filter((item) =>
    ['Open', 'In Progress'].includes(item.status),
  ).length
  const completionEvents = raw.appointmentEvents.filter(
    (item) =>
      item.event_type === 'Completed' &&
      isWithin(item.occurred_at, periodStart, periodEnd),
  ).length

  const revenueScore = clamp(50 + revenueGrowth * 2)
  const customerScore = clamp(retention)
  const capacityScore = clamp(teamUtilization)
  const packageScore = clamp(100 - percentage(packageLiability, monthlyRevenue))
  const cashScore = clamp(grossMargin)
  const components: BusinessHealthComponent[] = [
    { label: 'Revenue momentum', score: Math.round(revenueScore), change: Math.round(revenueGrowth) },
    { label: 'Customer health', score: Math.round(customerScore), change: Math.round(retention - 70) },
    { label: 'Team capacity', score: Math.round(capacityScore), change: 0 },
    { label: 'Package exposure', score: Math.round(packageScore), change: 0 },
    { label: 'Cash efficiency', score: Math.round(cashScore), change: 0 },
  ]
  const businessHealthScore = Math.round(
    components.reduce((sum, component) => sum + component.score, 0) /
      components.length,
  )
  const forecastPlaceholder = Math.round(
    monthlyRevenue * (1 + Math.max(-20, Math.min(20, revenueGrowth)) / 100),
  )
  const trend = buildMonthlyTrend(raw.appointments, periodEnd)
  const revenueForecast: RevenueForecastPoint[] = trend.map((item, index) => ({
    month: item.label,
    actual: item.value,
    forecast:
      index === trend.length - 1 ? forecastPlaceholder : Math.round(item.value),
    target: Math.round(item.value * 1.05),
  }))
  const nextMonths = Array.from({ length: 3 }, (_, index) => {
    const date = new Date(
      periodEnd.getFullYear(),
      periodEnd.getMonth() + index + 1,
      1,
    )
    return {
      month: shortMonth(date.toISOString()),
      forecast: Math.round(forecastPlaceholder * (1 + index * 0.035)),
      target: Math.round(monthlyRevenue * (1.05 + index * 0.04)),
    }
  })
  revenueForecast.push(...nextMonths)

  const revenueMix: RevenueMixItem[] = [
    {
      label: 'Services',
      amount: monthlyRevenue,
      share: monthlyRevenue ? 100 : 0,
      change: revenueGrowth,
    },
    {
      label: 'Packages',
      amount: 0,
      share: 0,
      change: 0,
    },
    {
      label: 'Memberships',
      amount: 0,
      share: 0,
      change: 0,
    },
    {
      label: 'Retail',
      amount: 0,
      share: 0,
      change: 0,
    },
  ]
  const packageWarning = packageLiabilities[0]
    ? `${packageLiabilities[0].name} represents the largest liability at RM ${packageLiabilities[0].liabilityValue.toLocaleString()}.`
    : 'No active package liability was found.'

  const aiInsights = buildRuleBasedInsights(
    monthlyRevenue,
    revenueGrowth,
    customerRisks,
    packageLiabilities,
    therapists,
  )

  return {
    period: new Intl.DateTimeFormat('en-MY', {
      month: 'long',
      year: 'numeric',
    }).format(periodStart),
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        label: 'Monthly Revenue',
        value: `RM ${Math.round(monthlyRevenue).toLocaleString()}`,
        change: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%`,
        direction: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'steady',
        context: `RM ${Math.abs(Math.round(monthlyRevenue - comparisonRevenue)).toLocaleString()} ${monthlyRevenue >= comparisonRevenue ? 'ahead of' : 'behind'} comparison period`,
      },
      {
        label: 'Gross Margin',
        value: `${grossMargin.toFixed(1)}%`,
        change: 'Calculated',
        direction: 'steady',
        context: 'Revenue less inventory and commission costs',
      },
      {
        label: 'Customer Retention',
        value: `${retention.toFixed(0)}%`,
        change: `${retainedCustomers.size} returned`,
        direction: retention >= 70 ? 'up' : 'down',
        context: `${comparisonCustomers.size} comparison-period customers`,
      },
      {
        label: 'Package Liability',
        value: `RM ${Math.round(packageLiability).toLocaleString()}`,
        change: `${Math.round(redemptionRate)}% redeemed`,
        direction: 'steady',
        context: `${outstandingSessions} sessions outstanding`,
      },
      {
        label: 'Team Utilization',
        value: `${teamUtilization.toFixed(0)}%`,
        change: `${completed.length} completed`,
        direction: teamUtilization >= 70 ? 'up' : 'steady',
        context: `${activeTherapists.length} active therapists`,
      },
    ],
    health: {
      score: businessHealthScore,
      status:
        businessHealthScore >= 80
          ? 'Strong'
          : businessHealthScore >= 60
            ? 'Stable'
            : 'Attention',
      change: Math.round(revenueGrowth / 3),
      components,
    },
    revenueTrend: trend,
    therapists,
    atRiskCustomers: customerRisks.slice(0, 12),
    customerSegments,
    packageLiabilities,
    revenueForecast,
    revenueMix,
    aiInsights,
    calculations: {
      customerMetrics: {
        vipCustomers: vipCustomers.length,
        activeCustomers: activeCustomers.length,
        atRiskCustomers: atRiskCount,
        lostCustomers: lostCustomers.length,
        birthdaysThisWeek: raw.customers.filter((customer) =>
          getBirthdayThisWeek(customer, now),
        ).length,
        inactiveOver30Days: raw.customers.filter(
          (customer) => daysBetween(customer.last_visit_at, now) >= 30,
        ).length,
        inactiveOver45Days: raw.customers.filter(
          (customer) => daysBetween(customer.last_visit_at, now) >= 45,
        ).length,
        inactiveOver60Days: raw.customers.filter(
          (customer) => daysBetween(customer.last_visit_at, now) >= 60,
        ).length,
      },
      packageMetrics: {
        activePackages: activePackages.length,
        outstandingSessions,
        unusedPackageValue: Math.round(packageLiability),
        expiringIn7Days: expiresWithin(7),
        expiringIn14Days: expiresWithin(14),
        expiringIn30Days: expiresWithin(30),
        redemptionRate: Math.round(redemptionRate),
        liabilityWarning: packageWarning,
      },
      revenueByService,
      revenueByTherapist,
      dailyRevenue,
      monthlyRevenue: Math.round(monthlyRevenue),
      averageRevenuePerVisit: completed.length
        ? Math.round(monthlyRevenue / completed.length)
        : 0,
      grossMarginPlaceholder: Number(grossMargin.toFixed(1)),
      notificationDeliveryRate: Math.round(notificationDeliveryRate),
      openFollowUps,
      completionEvents,
    },
  }
}

export function buildAiManagementBrainInput(
  snapshot: BusinessIntelligenceSnapshot,
  period: { start: string; end: string },
): AiManagementBrainInput {
  const revenueGrowth = Number.parseFloat(
    snapshot.kpis[0]?.change.replace('%', '') ?? '0',
  )
  const retention = Number.parseFloat(
    snapshot.kpis[2]?.value.replace('%', '') ?? '0',
  )
  const teamUtilization = Number.parseFloat(
    snapshot.kpis[4]?.value.replace('%', '') ?? '0',
  )

  return {
    generatedAt: snapshot.generatedAt,
    period,
    executive: {
      monthlyRevenue: snapshot.calculations.monthlyRevenue,
      revenueGrowth,
      grossMargin: snapshot.calculations.grossMarginPlaceholder,
      customerRetention: retention,
      packageLiability: snapshot.calculations.packageMetrics.unusedPackageValue,
      teamUtilization,
      businessHealthScore: snapshot.health.score,
    },
    therapists: snapshot.therapists.map((therapist) => ({
      id: therapist.id,
      name: therapist.name,
      revenue: therapist.revenue,
      utilization: therapist.utilization,
      completionRate: therapist.completionRate,
      rebookingRate: therapist.rebookingRate,
      performanceScore: therapist.performanceScore,
    })),
    customers: {
      ...snapshot.calculations.customerMetrics,
      highestRiskCustomers: snapshot.atRiskCustomers.slice(0, 10).map(
        (customer) => ({
          id: customer.id,
          name: customer.name,
          riskScore: customer.riskScore,
          recommendedAction: customer.recommendedAction,
        }),
      ),
    },
    packages: snapshot.calculations.packageMetrics,
    revenue: {
      monthlyRevenue: snapshot.calculations.monthlyRevenue,
      averageRevenuePerVisit:
        snapshot.calculations.averageRevenuePerVisit,
      byService: snapshot.calculations.revenueByService,
      byTherapist: snapshot.calculations.revenueByTherapist,
      daily: snapshot.calculations.dailyRevenue,
      forecastPlaceholder:
        snapshot.revenueForecast.find((item) => item.actual === undefined)
          ?.forecast ?? snapshot.calculations.monthlyRevenue,
    },
    operations: {
      notificationDeliveryRate:
        snapshot.calculations.notificationDeliveryRate,
      openFollowUps: snapshot.calculations.openFollowUps,
      completionEvents: snapshot.calculations.completionEvents,
    },
  }
}

export function buildMockAiManagementBrainInput(
  period: { start: string; end: string },
): AiManagementBrainInput {
  return buildAiManagementBrainInput(businessIntelligenceSnapshot, period)
}
