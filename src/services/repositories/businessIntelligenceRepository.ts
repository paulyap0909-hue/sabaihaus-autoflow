import {
  buildBusinessIntelligenceSnapshot,
  type BusinessIntelligenceRawData,
  type IntelligenceAppointmentEventRow,
  type IntelligenceAppointmentRow,
  type IntelligenceCommissionRow,
  type IntelligenceCustomerPackageRow,
  type IntelligenceCustomerRow,
  type IntelligenceFollowUpRow,
  type IntelligenceInventoryUsageRow,
  type IntelligenceNotificationRow,
  type IntelligencePackageDefinitionRow,
  type IntelligencePackageRedemptionRow,
  type IntelligenceTherapistRow,
} from '../../modules/businessIntelligence/businessIntelligenceEngine'
import { businessIntelligenceSnapshot } from '../mockBusinessIntelligence'
import {
  type BusinessIntelligenceResult,
  type BusinessIntelligenceSnapshot,
} from '../../types/businessIntelligence'
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '../supabase/client'
import type { RepositoryContext } from './types'
import { resolveTenantContext } from '../tenant/tenantContext'

export interface BusinessIntelligenceQuery {
  periodStart: string
  periodEnd: string
  comparisonPeriodStart?: string
  comparisonPeriodEnd?: string
}

interface SupabaseQueryResult<T> {
  data: T[] | null
  error: { message: string } | null
}

function normalizeQuery(
  query: BusinessIntelligenceQuery,
): Required<BusinessIntelligenceQuery> {
  const periodStart = new Date(query.periodStart)
  const periodEnd = new Date(query.periodEnd)
  const duration = periodEnd.getTime() - periodStart.getTime()
  const comparisonEnd = query.comparisonPeriodEnd
    ? new Date(query.comparisonPeriodEnd)
    : new Date(periodStart.getTime() - 1)
  const comparisonStart = query.comparisonPeriodStart
    ? new Date(query.comparisonPeriodStart)
    : new Date(comparisonEnd.getTime() - duration)

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    comparisonPeriodStart: comparisonStart.toISOString(),
    comparisonPeriodEnd: comparisonEnd.toISOString(),
  }
}

function assertRows<T>(
  result: SupabaseQueryResult<T>,
  table: string,
): T[] {
  if (result.error) {
    throw new Error(`${table} query failed: ${result.error.message}`)
  }

  return result.data ?? []
}

function numberValue(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeRawData(raw: BusinessIntelligenceRawData) {
  return {
    ...raw,
    customers: raw.customers.map((row) => ({
      ...row,
      lifetime_value_minor: numberValue(row.lifetime_value_minor),
      total_spent_minor: numberValue(row.total_spent_minor),
      total_visits: numberValue(row.total_visits),
    })),
    therapists: raw.therapists.map((row) => ({
      ...row,
      rating: row.rating === null ? null : numberValue(row.rating),
    })),
    appointments: raw.appointments.map((row) => ({
      ...row,
      price_minor: numberValue(row.price_minor),
    })),
    packageDefinitions: raw.packageDefinitions.map((row) => ({
      ...row,
      total_sessions: numberValue(row.total_sessions),
      price_minor: numberValue(row.price_minor),
    })),
    customerPackages: raw.customerPackages.map((row) => ({
      ...row,
      total_sessions: numberValue(row.total_sessions),
      remaining_sessions: numberValue(row.remaining_sessions),
    })),
    packageRedemptions: raw.packageRedemptions.map((row) => ({
      ...row,
      sessions_redeemed: numberValue(row.sessions_redeemed),
    })),
    commissionEntries: raw.commissionEntries.map((row) => ({
      ...row,
      commission_amount_minor: numberValue(row.commission_amount_minor),
    })),
    inventoryUsageLogs: raw.inventoryUsageLogs.map((row) => ({
      ...row,
      cost_minor: numberValue(row.cost_minor),
    })),
  } satisfies BusinessIntelligenceRawData
}

async function fetchBusinessIntelligenceRows(
  context: RepositoryContext,
  query: Required<BusinessIntelligenceQuery>,
): Promise<BusinessIntelligenceRawData> {
  const client = getSupabaseClient()
  const historyStart = new Date(query.periodStart)
  historyStart.setFullYear(historyStart.getFullYear() - 1)
  const futureEnd = new Date(query.periodEnd)
  futureEnd.setDate(futureEnd.getDate() + 60)

  const scoped = (table: string, columns: string) =>
    client
      .from(table)
      .select(columns)
      .eq('organization_id', context.organizationId)
      .eq('branch_id', context.branchId)

  const [
    customersResult,
    therapistsResult,
    appointmentsResult,
    packageDefinitionsResult,
    customerPackagesResult,
    packageRedemptionsResult,
    commissionEntriesResult,
    inventoryUsageLogsResult,
    notificationQueueResult,
    followUpTasksResult,
    appointmentEventsResult,
  ] = await Promise.all([
    scoped(
      'customers',
      'id,full_name,birthday,retention_status,last_visit_at,lifetime_value_minor,total_spent_minor,total_visits',
    ),
    scoped('therapists', 'id,full_name,rating,status'),
    scoped(
      'appointments',
      'id,customer_id,therapist_id,service_id,starts_at,ends_at,status,price_minor,completed_at',
    )
      .gte('starts_at', historyStart.toISOString())
      .lte('starts_at', futureEnd.toISOString()),
    scoped(
      'package_definitions',
      'id,name,total_sessions,price_minor',
    ),
    scoped(
      'customer_packages',
      'id,customer_id,package_definition_id,total_sessions,remaining_sessions,expires_at,status',
    ),
    scoped(
      'package_redemptions',
      'id,customer_package_id,sessions_redeemed,redeemed_at',
    ),
    scoped(
      'commission_entries',
      'therapist_id,appointment_id,commission_amount_minor,earned_at,status',
    )
      .gte('earned_at', historyStart.toISOString())
      .lte('earned_at', query.periodEnd),
    scoped(
      'inventory_usage_logs',
      'appointment_id,cost_minor,used_at',
    )
      .gte('used_at', query.comparisonPeriodStart)
      .lte('used_at', query.periodEnd),
    scoped(
      'notification_queue',
      'status,scheduled_at,sent_at',
    )
      .gte('scheduled_at', query.comparisonPeriodStart)
      .lte('scheduled_at', query.periodEnd),
    scoped('follow_up_tasks', 'customer_id,task_type,due_at,status').lte(
      'due_at',
      futureEnd.toISOString(),
    ),
    scoped(
      'appointment_events',
      'appointment_id,event_type,occurred_at',
    )
      .gte('occurred_at', query.comparisonPeriodStart)
      .lte('occurred_at', query.periodEnd),
  ])

  return normalizeRawData({
    customers: assertRows(
      customersResult as SupabaseQueryResult<IntelligenceCustomerRow>,
      'customers',
    ),
    therapists: assertRows(
      therapistsResult as SupabaseQueryResult<IntelligenceTherapistRow>,
      'therapists',
    ),
    appointments: assertRows(
      appointmentsResult as SupabaseQueryResult<IntelligenceAppointmentRow>,
      'appointments',
    ),
    packageDefinitions: assertRows(
      packageDefinitionsResult as SupabaseQueryResult<IntelligencePackageDefinitionRow>,
      'package_definitions',
    ),
    customerPackages: assertRows(
      customerPackagesResult as SupabaseQueryResult<IntelligenceCustomerPackageRow>,
      'customer_packages',
    ),
    packageRedemptions: assertRows(
      packageRedemptionsResult as SupabaseQueryResult<IntelligencePackageRedemptionRow>,
      'package_redemptions',
    ),
    commissionEntries: assertRows(
      commissionEntriesResult as SupabaseQueryResult<IntelligenceCommissionRow>,
      'commission_entries',
    ),
    inventoryUsageLogs: assertRows(
      inventoryUsageLogsResult as SupabaseQueryResult<IntelligenceInventoryUsageRow>,
      'inventory_usage_logs',
    ),
    notificationQueue: assertRows(
      notificationQueueResult as SupabaseQueryResult<IntelligenceNotificationRow>,
      'notification_queue',
    ),
    followUpTasks: assertRows(
      followUpTasksResult as SupabaseQueryResult<IntelligenceFollowUpRow>,
      'follow_up_tasks',
    ),
    appointmentEvents: assertRows(
      appointmentEventsResult as SupabaseQueryResult<IntelligenceAppointmentEventRow>,
      'appointment_events',
    ),
  })
}

export async function getBusinessIntelligenceSnapshot(
  context: RepositoryContext,
  query: BusinessIntelligenceQuery,
): Promise<BusinessIntelligenceSnapshot> {
  const normalizedQuery = normalizeQuery(query)
  const raw = await fetchBusinessIntelligenceRows(context, normalizedQuery)

  return buildBusinessIntelligenceSnapshot(raw, normalizedQuery)
}

export async function getBusinessIntelligenceTenantContext():
  Promise<RepositoryContext | null> {
  return (await resolveTenantContext()).context
}

export async function loadBusinessIntelligence(
  query: BusinessIntelligenceQuery,
): Promise<BusinessIntelligenceResult> {
  if (!isSupabaseConfigured()) {
    return {
      snapshot: businessIntelligenceSnapshot,
      source: 'mock',
      sourceLabel: 'Mock intelligence fallback',
      statusLabel: 'Mock Fallback Active',
      fallbackReason: 'Supabase URL or anon key is not configured.',
    }
  }

  const context = await getBusinessIntelligenceTenantContext()

  if (!context) {
    return {
      snapshot: businessIntelligenceSnapshot,
      source: 'mock',
      sourceLabel: 'Mock intelligence fallback',
      statusLabel: 'Mock Fallback Active',
      fallbackReason:
        'Supabase organization or branch scope is not configured.',
    }
  }

  try {
    const snapshot = await getBusinessIntelligenceSnapshot(context, query)
    return {
      snapshot,
      source: 'live',
      sourceLabel: 'Live Supabase data',
      statusLabel: 'Live Data Active',
    }
  } catch (error) {
    return {
      snapshot: businessIntelligenceSnapshot,
      source: 'mock',
      sourceLabel: 'Mock intelligence fallback',
      statusLabel: 'Mock Fallback Active',
      fallbackReason:
        error instanceof Error
          ? error.message
          : 'Supabase intelligence query failed.',
    }
  }
}
