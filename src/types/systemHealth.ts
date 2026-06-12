export type SystemHealthIndicator = 'green' | 'yellow' | 'red'

export interface SystemHealthCheck {
  id: string
  label: string
  tableName: string
  status: 'Healthy' | 'Warning' | 'Error'
  indicator: SystemHealthIndicator
  recordCount: number | null
  lastCreatedAt: string | null
  latencyMs: number
  message: string
}

export interface SystemHealthReport {
  checkedAt: string
  source: 'Supabase' | 'Configuration'
  overallStatus: 'Healthy' | 'Warning' | 'Error'
  tenant: {
    organizationId: string | null
    branchId: string | null
    verificationMode: string
    liveVerificationActive: boolean
    missingFields: Array<'organization' | 'branch'>
  }
  checks: SystemHealthCheck[]
}
