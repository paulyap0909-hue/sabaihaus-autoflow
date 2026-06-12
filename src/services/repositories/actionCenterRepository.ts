import { buildMockActionCenterSnapshot } from '../mockActionCenter'
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client'
import { resolveTenantContext } from '../tenant/tenantContext'
import type {
  ActionCenterSnapshot,
  FrontDeskMessageAction,
  FrontDeskRebookingAction,
  FrontDeskRenewalAction,
  OpportunityCompletionStatus,
  OpportunityKind,
  VipRescueAction,
} from '../../types/actionCenter'
import type { RepositoryContext } from './types'

type Row = Record<string, unknown>
const DAY_MS = 86_400_000

function value(row: Row | undefined, key: string) {
  const current = row?.[key]
  return typeof current === 'string' ? current : ''
}

function numberValue(row: Row | undefined, key: string) {
  const parsed = Number(row?.[key])
  return Number.isFinite(parsed) ? parsed : 0
}

function daysSince(date: string) {
  return date
    ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS))
    : 999
}

async function rows(
  table: string,
  context: RepositoryContext,
  columns = '*',
) {
  const { data, error } = await getSupabaseClient()
    .from(table)
    .select(columns)
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
  if (error) throw new Error(`${table}: ${error.message}`)
  return (data ?? []) as unknown as Row[]
}

function customerName(customer: Row | undefined) {
  return value(customer, 'full_name') || 'Customer'
}

function calculateSummary(
  rebooking: FrontDeskRebookingAction[],
  renewals: FrontDeskRenewalAction[],
  vipRescue: VipRescueAction[],
  messages: FrontDeskMessageAction[],
  followUps: Row[],
) {
  const openRebooking = rebooking.filter((item) => item.status !== 'Completed')
  const openRenewals = renewals.filter((item) => item.status !== 'Completed')
  const openVip = vipRescue.filter((item) => item.status !== 'Completed')
  return {
    rebooking: openRebooking.length,
    packageRenewals: openRenewals.filter((item) => item.renewalType === 'Package').length,
    membershipRenewals: openRenewals.filter((item) => item.renewalType === 'Membership').length,
    vipAtRisk: openVip.length,
    pendingFollowUps: followUps.filter((item) =>
      ['Open', 'In Progress'].includes(value(item, 'status')),
    ).length,
    pendingMessages: messages.filter((item) =>
      ['Scheduled', 'Pending'].includes(item.status),
    ).length,
    estimatedRevenue:
      openRebooking.reduce((sum, item) => sum + item.estimatedRevenue, 0) +
      openRenewals.reduce((sum, item) => sum + item.expectedRevenue, 0),
    urgentActions: [...openRebooking, ...openRenewals, ...openVip].filter(
      (item) => ('riskScore' in item ? item.riskScore : item.priorityScore) >= 80,
    ).length,
    totalActions: openRebooking.length + openRenewals.length + openVip.length,
  }
}

async function loadLiveSnapshot(
  context: RepositoryContext,
): Promise<ActionCenterSnapshot> {
  const [
    customers,
    appointments,
    therapists,
    rebookingRows,
    renewalRows,
    packageDefinitions,
    membershipPlans,
    customerPackages,
    customerMemberships,
    messageRows,
    followUps,
  ] = await Promise.all([
    rows('customers', context),
    rows('appointments', context),
    rows('therapists', context),
    rows('rebooking_opportunities', context),
    rows('renewal_opportunities', context),
    rows('package_definitions', context),
    rows('membership_plans', context),
    rows('customer_packages', context),
    rows('customer_memberships', context),
    rows('message_queue', context),
    rows('follow_up_tasks', context),
  ])

  const customerMap = new Map(customers.map((item) => [value(item, 'id'), item]))
  const therapistMap = new Map(therapists.map((item) => [value(item, 'id'), item]))
  const appointmentMap = new Map(appointments.map((item) => [value(item, 'id'), item]))
  const packageMap = new Map(packageDefinitions.map((item) => [value(item, 'id'), item]))
  const planMap = new Map(membershipPlans.map((item) => [value(item, 'id'), item]))
  const customerPackageMap = new Map(customerPackages.map((item) => [value(item, 'id'), item]))
  const customerMembershipMap = new Map(customerMemberships.map((item) => [value(item, 'id'), item]))
  const futureCustomers = new Set(
    appointments
      .filter((item) =>
        new Date(value(item, 'starts_at')).getTime() > Date.now() &&
        !['Cancelled', 'No Show'].includes(value(item, 'status')),
      )
      .map((item) => value(item, 'customer_id')),
  )

  const rebooking: FrontDeskRebookingAction[] = rebookingRows.map((item) => {
    const customer = customerMap.get(value(item, 'customer_id'))
    const appointment = appointmentMap.get(value(item, 'source_appointment_id'))
    const therapist = therapistMap.get(value(item, 'therapist_id'))
    const lastVisit = value(appointment, 'completed_at') || value(appointment, 'starts_at')
    const status = value(item, 'status')
    return {
      id: value(item, 'id'),
      customerId: value(item, 'customer_id'),
      customerName: customerName(customer),
      phone: value(customer, 'phone'),
      lastVisitDate: lastVisit,
      lastService: value(appointment, 'service_id') || 'Wellness treatment',
      preferredTherapist: value(therapist, 'full_name') || 'Preferred therapist',
      daysInactive: daysSince(lastVisit),
      suggestedDate: value(item, 'suggested_date'),
      estimatedRevenue: numberValue(item, 'expected_revenue_minor') / 100,
      priorityScore: numberValue(item, 'priority_score'),
      suggestedMessage: `Hi ${customerName(customer)}, it may be time for your next wellness visit. May we reserve a suitable appointment for you?`,
      status: status === 'Contacted' ? 'Contacted' : ['Booked', 'Dismissed', 'Expired'].includes(status) ? 'Completed' : 'Open',
    }
  })

  const renewals: FrontDeskRenewalAction[] = renewalRows.map((item) => {
    const customer = customerMap.get(value(item, 'customer_id'))
    const type = value(item, 'opportunity_type') as 'Package' | 'Membership'
    const customerPackage = customerPackageMap.get(value(item, 'customer_package_id'))
    const customerMembership = customerMembershipMap.get(value(item, 'customer_membership_id'))
    const definition = packageMap.get(value(item, 'package_definition_id'))
    const plan = planMap.get(value(item, 'membership_plan_id'))
    const itemName =
      value(definition, 'name') ||
      value(plan, 'name') ||
      `${type} renewal`
    const status = value(item, 'status')
    const remaining = item.remaining_sessions === null
      ? null
      : numberValue(item, 'remaining_sessions')
    return {
      id: value(item, 'id'),
      customerId: value(item, 'customer_id'),
      customerName: customerName(customer),
      phone: value(customer, 'phone'),
      renewalType: type,
      itemName,
      remainingSessions: remaining,
      expiryDate:
        value(item, 'due_date') ||
        value(customerPackage, 'expires_at') ||
        value(customerMembership, 'renews_at'),
      expectedRevenue: numberValue(item, 'expected_revenue_minor') / 100,
      suggestedMessage:
        type === 'Package'
          ? `Hi ${customerName(customer)}, your ${itemName} has ${remaining ?? 0} sessions remaining. May we help with your renewal?`
          : `Hi ${customerName(customer)}, your ${itemName} is approaching renewal. May we reserve your member benefits?`,
      priorityScore: numberValue(item, 'priority_score'),
      status: status === 'Contacted' ? 'Contacted' : ['Renewed', 'Dismissed', 'Expired'].includes(status) ? 'Completed' : 'Open',
    }
  })

  const vipRescue: VipRescueAction[] = customers
    .filter((customer) => {
      const inactive = daysSince(value(customer, 'last_visit_at'))
      const retention = value(customer, 'retention_status')
      const lifetime = numberValue(customer, 'total_spent_minor') || numberValue(customer, 'lifetime_value_minor')
      const premiumMembership = customerMemberships.find(
        (item) =>
          value(item, 'customer_id') === value(customer, 'id') &&
          ['Active', 'Renewal Due'].includes(value(item, 'status')),
      )
      const plan = planMap.get(value(premiumMembership, 'membership_plan_id'))
      return inactive > 30 && !futureCustomers.has(value(customer, 'id')) &&
        (retention === 'VIP' ||
          ['Gold', 'Platinum', 'Diamond'].includes(value(plan, 'tier')) ||
          lifetime >= 300000)
    })
    .map((customer) => {
      const preferredAppointment = appointments
        .filter((item) => value(item, 'customer_id') === value(customer, 'id'))
        .sort((a, b) => value(b, 'starts_at').localeCompare(value(a, 'starts_at')))[0]
      const therapist = therapistMap.get(value(preferredAppointment, 'therapist_id'))
      const inactive = daysSince(value(customer, 'last_visit_at'))
      const lifetimeMinor = numberValue(customer, 'total_spent_minor') ||
        numberValue(customer, 'lifetime_value_minor')
      return {
        id: `VIP-${value(customer, 'id')}`,
        customerId: value(customer, 'id'),
        customerName: customerName(customer),
        phone: value(customer, 'phone'),
        segment: value(customer, 'retention_status') === 'VIP' ? 'VIP' : 'Premium',
        daysInactive: inactive,
        lifetimeValue: lifetimeMinor / 100,
        riskScore: Math.min(100, Math.round(45 + inactive / 2 + lifetimeMinor / 50000)),
        recoveryOffer: 'Priority booking with a complimentary wellness add-on.',
        recommendedTherapist: value(therapist, 'full_name') || 'Preferred therapist',
        hasFutureBooking: false,
        status: 'Open',
      }
    })

  const messages: FrontDeskMessageAction[] = messageRows.map((item) => {
    const customer = customerMap.get(value(item, 'customer_id'))
    return {
      id: value(item, 'id'),
      customerId: value(item, 'customer_id'),
      customerName: customerName(customer),
      recipient: value(item, 'recipient'),
      purpose: value(item, 'purpose'),
      channel: value(item, 'channel'),
      message: value(item, 'rendered_content'),
      scheduledAt: value(item, 'scheduled_at'),
      status: value(item, 'status') as FrontDeskMessageAction['status'],
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    source: 'live',
    sourceLabel: 'Live Supabase data',
    rebooking,
    renewals,
    vipRescue,
    messages,
    summary: calculateSummary(rebooking, renewals, vipRescue, messages, followUps),
  }
}

export async function loadActionCenter(): Promise<ActionCenterSnapshot> {
  if (!isSupabaseConfigured()) {
    return buildMockActionCenterSnapshot('Supabase is not configured.')
  }
  try {
    const resolution = await resolveTenantContext()
    if (!resolution.context) {
      return buildMockActionCenterSnapshot(
        resolution.missingFields.map((item) => `Missing ${item}`).join(' · '),
      )
    }
    return await loadLiveSnapshot(resolution.context)
  } catch (error) {
    return buildMockActionCenterSnapshot(
      error instanceof Error ? error.message : 'Action Center query failed.',
    )
  }
}

async function tenantContext() {
  const resolution = await resolveTenantContext()
  if (!resolution.context) throw new Error('Tenant context is unavailable.')
  return resolution.context
}

export async function completeAction(
  kind: OpportunityKind,
  action: {
    id: string
    customerId: string
    message: string
    phone: string
  },
  nextStatus: OpportunityCompletionStatus,
) {
  if (!isSupabaseConfigured()) return
  const context = await tenantContext()
  const client = getSupabaseClient()
  const occurredAt = new Date().toISOString()
  const table =
    kind === 'Rebooking'
      ? 'rebooking_opportunities'
      : kind === 'Renewal'
        ? 'renewal_opportunities'
        : null
  const databaseStatus =
    nextStatus === 'Contacted'
      ? 'Contacted'
      : kind === 'Renewal'
        ? 'Renewed'
        : 'Booked'

  if (table) {
    const { error } = await client
      .from(table)
      .update({ status: databaseStatus })
      .eq('id', action.id)
      .eq('organization_id', context.organizationId)
      .eq('branch_id', context.branchId)
    if (error) throw new Error(error.message)
  }

  const { data: log, error: logError } = await client
    .from('communication_logs')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      customer_id: action.customerId,
      channel: 'WhatsApp',
      direction: 'Outbound',
      event_type: nextStatus === 'Contacted' ? 'Dispatch Attempted' : 'Sent',
      recipient: action.phone,
      content_snapshot: action.message,
      occurred_at: occurredAt,
    })
    .select('id')
    .single()
  if (logError) throw new Error(logError.message)

  const { error: timelineError } = await client.from('customer_timeline').insert({
    organization_id: context.organizationId,
    branch_id: context.branchId,
    customer_id: action.customerId,
    event_type: nextStatus === 'Contacted' ? 'Follow Up' : 'Message',
    title: `${kind} action ${nextStatus.toLowerCase()}`,
    detail: action.message,
    status: nextStatus,
    occurred_at: occurredAt,
    communication_log_id: log?.id ?? null,
  })
  if (timelineError) throw new Error(timelineError.message)
}

export async function updateActionMessageStatus(
  action: FrontDeskMessageAction,
  status: 'Sent' | 'Failed',
) {
  if (!isSupabaseConfigured()) return
  const context = await tenantContext()
  const client = getSupabaseClient()
  const occurredAt = new Date().toISOString()
  const { error } = await client
    .from('message_queue')
    .update({
      status,
      sent_at: status === 'Sent' ? occurredAt : null,
      error_message: status === 'Failed' ? 'Marked failed by front desk.' : null,
    })
    .eq('id', action.id)
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
  if (error) throw new Error(error.message)

  const { data: log, error: logError } = await client
    .from('communication_logs')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      message_queue_id: action.id,
      customer_id: action.customerId,
      channel: action.channel,
      direction: 'Outbound',
      event_type: status,
      recipient: action.recipient,
      content_snapshot: action.message,
      occurred_at: occurredAt,
    })
    .select('id')
    .single()
  if (logError) throw new Error(logError.message)

  const { error: timelineError } = await client.from('customer_timeline').insert({
    organization_id: context.organizationId,
    branch_id: context.branchId,
    customer_id: action.customerId,
    event_type: 'Message',
    title: `${action.purpose} ${status.toLowerCase()}`,
    detail: action.message,
    status,
    occurred_at: occurredAt,
    message_queue_id: action.id,
    communication_log_id: log?.id ?? null,
  })
  if (timelineError) throw new Error(timelineError.message)
}
