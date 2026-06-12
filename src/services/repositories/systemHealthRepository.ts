import type {
  SystemHealthCheck,
  SystemHealthReport,
} from '../../types/systemHealth'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../supabase/client'
import type { RepositoryContext } from './types'

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

function configuredContext(): RepositoryContext | null {
  const organizationId = import.meta.env.VITE_SUPABASE_ORGANIZATION_ID
  const branchId = import.meta.env.VITE_SUPABASE_BRANCH_ID
  return organizationId && branchId ? { organizationId, branchId } : null
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

async function queryTableHealth(
  definition: HealthTableDefinition,
  context: RepositoryContext,
): Promise<SystemHealthCheck> {
  const startedAt = performance.now()
  const { data, error, count } = await getSupabaseClient()
    .from(definition.tableName)
    .select('created_at', { count: 'exact' })
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

async function queryGoogleConnections(): Promise<SystemHealthCheck> {
  const definition: HealthTableDefinition = {
    id: 'google-connections',
    label: 'Google Connections',
    tableName: 'google_calendar_connections',
  }
  const startedAt = performance.now()
  const { data, error } = await getSupabaseClient().functions.invoke(
    'google-calendar-connections',
    { body: { operation: 'list' } },
  )
  const latencyMs = elapsed(startedAt)

  if (error) {
    return failureCheck(definition, latencyMs, error.message)
  }
  if (!Array.isArray(data)) {
    return failureCheck(
      definition,
      latencyMs,
      'Connection function returned an invalid response.',
    )
  }

  const latestSync = data
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const record = item as {
        createdAt?: string
        created_at?: string
        connectedAt?: string
        connected_at?: string
      }
      return (
        record.createdAt ??
        record.created_at ??
        record.connectedAt ??
        record.connected_at ??
        null
      )
    })
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null

  return successCheck(definition, data.length, latestSync, latencyMs)
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
    const checks = [
      {
        id: 'google-connections',
        label: 'Google Connections',
        tableName: 'google_calendar_connections',
      },
      ...healthTables,
    ].map((definition) =>
      configurationCheck(
        definition,
        'Supabase URL or anon key is not configured.',
      ),
    )
    return {
      checkedAt: new Date().toISOString(),
      source: 'Configuration',
      overallStatus: 'Warning',
      checks,
    }
  }

  const context = configuredContext()
  if (!context) {
    const checks = [
      {
        id: 'google-connections',
        label: 'Google Connections',
        tableName: 'google_calendar_connections',
      },
      ...healthTables,
    ].map((definition) =>
      configurationCheck(
        definition,
        'Organization or branch scope is not configured.',
      ),
    )
    return {
      checkedAt: new Date().toISOString(),
      source: 'Configuration',
      overallStatus: 'Warning',
      checks,
    }
  }

  const checks = await Promise.all([
    queryGoogleConnections(),
    ...healthTables.map((definition) =>
      queryTableHealth(definition, context),
    ),
  ])

  return {
    checkedAt: new Date().toISOString(),
    source: 'Supabase',
    overallStatus: overallStatus(checks),
    checks,
  }
}
