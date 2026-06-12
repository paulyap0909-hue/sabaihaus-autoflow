import type {
  SystemHealthCheck,
  SystemHealthReport,
} from '../../types/systemHealth'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../supabase/client'
import type { RepositoryContext } from './types'
import {
  resolveTenantContext,
  type TenantContextResolution,
} from '../tenant/tenantContext'

interface HealthTableDefinition {
  id: string
  label: string
  tableName: string
}

const healthTables: HealthTableDefinition[] = [
  {
    id: 'message-templates',
    label: 'Message Templates',
    tableName: 'message_templates',
  },
  {
    id: 'message-queue',
    label: 'Message Queue',
    tableName: 'message_queue',
  },
  {
    id: 'communication-logs',
    label: 'Communication Logs',
    tableName: 'communication_logs',
  },
  {
    id: 'rebooking-opportunities',
    label: 'Rebooking Opportunities',
    tableName: 'rebooking_opportunities',
  },
  {
    id: 'renewal-opportunities',
    label: 'Renewal Opportunities',
    tableName: 'renewal_opportunities',
  },
  {
    id: 'customer-timeline',
    label: 'Customer Timeline Events',
    tableName: 'customer_timeline',
  },
]

const googleConnectionsDefinition: HealthTableDefinition = {
  id: 'google-connections',
  label: 'Google Connections',
  tableName: 'google_calendar_connections',
}

function elapsed(startedAt: number) {
  return Math.max(0, Math.round(performance.now() - startedAt))
}

function successCheck(
  definition: HealthTableDefinition,
  count: number,
  lastCreatedAt: string | null,
  latencyMs: number,
): SystemHealthCheck {
  const isSlow = latencyMs >= 1000
  return {
    ...definition,
    status: isSlow ? 'Warning' : 'Healthy',
    indicator: isSlow ? 'yellow' : 'green',
    recordCount: count,
    lastCreatedAt,
    latencyMs,
    message: isSlow
      ? 'Query succeeded but exceeded the 1 second latency threshold.'
      : count === 0
        ? 'Table is available and currently empty.'
        : 'Table query completed successfully.',
  }
}

function failureCheck(
  definition: HealthTableDefinition,
  latencyMs: number,
  message: string,
): SystemHealthCheck {
  return {
    ...definition,
    status: 'Error',
    indicator: 'red',
    recordCount: null,
    lastCreatedAt: null,
    latencyMs,
    message,
  }
}

function configurationCheck(
  definition: HealthTableDefinition,
  message: string,
): SystemHealthCheck {
  return {
    ...definition,
    status: 'Warning',
    indicator: 'yellow',
    recordCount: null,
    lastCreatedAt: null,
    latencyMs: 0,
    message,
  }
}

function protectedGoogleConnectionsCheck(): SystemHealthCheck {
  return {
    ...googleConnectionsDefinition,
    status: 'Warning',
    indicator: 'yellow',
    recordCount: null,
    lastCreatedAt: null,
    latencyMs: 0,
    message:
      'Google Calendar Connections table is protected by server-only RLS.',
  }
}

async function queryTableHealth(
  definition: HealthTableDefinition,
  context: RepositoryContext,
): Promise<SystemHealthCheck> {
  const startedAt = performance.now()
  const { data, error, count } = await getSupabaseClient()
    .from(definition.tableName)
    .select('id, created_at', { count: 'exact' })
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('created_at', { ascending: false })
    .limit(1)
  const latencyMs = elapsed(startedAt)

  if (error) {
    return failureCheck(definition, latencyMs, error.message)
  }

  const latest = data?.[0] as { created_at?: string } | undefined
  return successCheck(
    definition,
    count ?? 0,
    latest?.created_at ?? null,
    latencyMs,
  )
}

function tenantDetails(resolution: TenantContextResolution) {
  return {
    organizationId: resolution.organizationId,
    branchId: resolution.branchId,
    verificationMode: resolution.sourceTable
      ? `${resolution.mode} · ${resolution.sourceTable}`
      : resolution.mode,
    liveVerificationActive: Boolean(resolution.context),
    missingFields: resolution.missingFields,
  }
}

function missingTenantMessage(resolution: TenantContextResolution) {
  return resolution.missingFields
    .map((field) =>
      field === 'organization' ? 'Missing organization' : 'Missing branch',
    )
    .join(' · ')
}

function overallStatus(
  checks: SystemHealthCheck[],
): SystemHealthReport['overallStatus'] {
  if (checks.some((check) => check.indicator === 'red')) return 'Error'
  if (checks.some((check) => check.indicator === 'yellow')) return 'Warning'
  return 'Healthy'
}

export async function getSystemHealthReport(): Promise<SystemHealthReport> {
  if (!isSupabaseConfigured()) {
    const tenantResolution: TenantContextResolution = {
      context: null,
      organizationId: null,
      branchId: null,
      mode: 'Unavailable',
      missingFields: ['organization', 'branch'],
    }
    const checks = [
      protectedGoogleConnectionsCheck(),
      ...healthTables.map((definition) =>
        configurationCheck(
          definition,
          'Supabase URL or anon key is not configured.',
        ),
      ),
    ]
    return {
      checkedAt: new Date().toISOString(),
      source: 'Configuration',
      overallStatus: 'Warning',
      tenant: tenantDetails(tenantResolution),
      checks,
    }
  }

  const tenantResolution = await resolveTenantContext()
  if (!tenantResolution.context) {
    const message = missingTenantMessage(tenantResolution)
    const checks = [
      protectedGoogleConnectionsCheck(),
      ...healthTables.map((definition) =>
        configurationCheck(definition, message),
      ),
    ]
    return {
      checkedAt: new Date().toISOString(),
      source: 'Configuration',
      overallStatus: 'Warning',
      tenant: tenantDetails(tenantResolution),
      checks,
    }
  }

  const context = tenantResolution.context
  const liveChecks = await Promise.all(
    healthTables.map((definition) =>
      queryTableHealth(definition, context),
    ),
  )
  const checks = [protectedGoogleConnectionsCheck(), ...liveChecks]

  return {
    checkedAt: new Date().toISOString(),
    source: 'Supabase',
    overallStatus: overallStatus(checks),
    tenant: tenantDetails(tenantResolution),
    checks,
  }
}
