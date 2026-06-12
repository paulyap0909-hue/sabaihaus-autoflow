export type BusinessIntelligenceSection =
  | 'Executive Dashboard'
  | 'Therapist Intelligence'
  | 'Customer Intelligence'
  | 'Package Intelligence'
  | 'Revenue Intelligence'
  | 'AI Insights'

export interface IntelligenceKpi {
  label: string
  value: string
  change: string
  direction: 'up' | 'down' | 'steady'
  context: string
}

export interface TrendPoint {
  label: string
  value: number
  comparison?: number
  forecast?: number
}

export interface BusinessHealthComponent {
  label: string
  score: number
  change: number
}

export interface BusinessHealthScore {
  score: number
  status: 'Strong' | 'Stable' | 'Attention'
  change: number
  components: BusinessHealthComponent[]
}

export interface TherapistIntelligence {
  id: string
  name: string
  initials: string
  revenue: number
  appointments: number
  utilization: number
  completionRate: number
  rebookingRate: number
  upsellRate: number
  rating: number
  revenueChange: number
  performanceScore: number
}

export interface AtRiskCustomer {
  id: string
  name: string
  membershipTier: string
  daysInactive: number
  lifetimeValue: number
  riskScore: number
  reason: string
  recommendedAction: string
}

export interface CustomerSegment {
  label: string
  customers: number
  revenueShare: number
  color: 'teal' | 'gold' | 'mint' | 'sand'
}

export interface PackageLiability {
  id: string
  name: string
  activePackages: number
  outstandingSessions: number
  liabilityValue: number
  expiringWithin30Days: number
  redemptionRate: number
}

export interface RevenueForecastPoint {
  month: string
  actual?: number
  forecast: number
  target: number
}

export interface RevenueMixItem {
  label: string
  amount: number
  share: number
  change: number
}

export interface CustomerIntelligenceMetrics {
  vipCustomers: number
  activeCustomers: number
  atRiskCustomers: number
  lostCustomers: number
  birthdaysThisWeek: number
  inactiveOver30Days: number
  inactiveOver45Days: number
  inactiveOver60Days: number
}

export interface PackageIntelligenceMetrics {
  activePackages: number
  outstandingSessions: number
  unusedPackageValue: number
  expiringIn7Days: number
  expiringIn14Days: number
  expiringIn30Days: number
  redemptionRate: number
  liabilityWarning: string
}

export interface RevenueBreakdownItem {
  id: string
  label: string
  amount: number
  appointments: number
}

export interface DailyRevenuePoint {
  date: string
  amount: number
  visits: number
}

export interface BusinessIntelligenceCalculations {
  customerMetrics: CustomerIntelligenceMetrics
  packageMetrics: PackageIntelligenceMetrics
  revenueByService: RevenueBreakdownItem[]
  revenueByTherapist: RevenueBreakdownItem[]
  dailyRevenue: DailyRevenuePoint[]
  monthlyRevenue: number
  averageRevenuePerVisit: number
  grossMarginPlaceholder: number
  notificationDeliveryRate: number
  openFollowUps: number
  completionEvents: number
}

export interface AiManagementBrainInput {
  generatedAt: string
  period: {
    start: string
    end: string
  }
  executive: {
    monthlyRevenue: number
    revenueGrowth: number
    grossMargin: number
    customerRetention: number
    packageLiability: number
    teamUtilization: number
    businessHealthScore: number
  }
  therapists: Array<{
    id: string
    name: string
    revenue: number
    utilization: number
    completionRate: number
    rebookingRate: number
    performanceScore: number
  }>
  customers: CustomerIntelligenceMetrics & {
    highestRiskCustomers: Array<{
      id: string
      name: string
      riskScore: number
      recommendedAction: string
    }>
  }
  packages: PackageIntelligenceMetrics
  revenue: {
    monthlyRevenue: number
    averageRevenuePerVisit: number
    byService: RevenueBreakdownItem[]
    byTherapist: RevenueBreakdownItem[]
    daily: DailyRevenuePoint[]
    forecastPlaceholder: number
  }
  operations: {
    notificationDeliveryRate: number
    openFollowUps: number
    completionEvents: number
  }
}

export interface AiBusinessInsight {
  id: string
  category: 'Growth' | 'Retention' | 'Capacity' | 'Risk'
  title: string
  narrative: string
  impact: string
  confidence: number
  priority: 'High' | 'Medium' | 'Watch'
  recommendedAction: string
}

export interface BusinessIntelligenceSnapshot {
  period: string
  generatedAt: string
  kpis: IntelligenceKpi[]
  health: BusinessHealthScore
  revenueTrend: TrendPoint[]
  therapists: TherapistIntelligence[]
  atRiskCustomers: AtRiskCustomer[]
  customerSegments: CustomerSegment[]
  packageLiabilities: PackageLiability[]
  revenueForecast: RevenueForecastPoint[]
  revenueMix: RevenueMixItem[]
  aiInsights: AiBusinessInsight[]
  calculations: BusinessIntelligenceCalculations
}

export type BusinessIntelligenceDataSource = 'live' | 'mock'

export interface BusinessIntelligenceResult {
  snapshot: BusinessIntelligenceSnapshot
  source: BusinessIntelligenceDataSource
  sourceLabel: 'Live Supabase data' | 'Mock intelligence fallback'
  statusLabel: 'Live Data Active' | 'Mock Fallback Active'
  fallbackReason?: string
}
