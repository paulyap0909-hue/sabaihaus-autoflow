import type {
  CommunicationChannel,
  CommunicationLogEventType,
  CommunicationLogRecord,
  CommunicationTemplatePurpose,
  CustomerTimelineEventType,
  CustomerTimelineRecord,
  MessageQueueRecord,
  MessageQueueStatus,
  MessageTemplateRecord,
  RebookingOpportunityRecord,
  RebookingOpportunityStatus,
  RenewalOpportunityRecord,
  RenewalOpportunityStatus,
} from '../../types/communication'
import { getSupabaseClient } from '../supabase/client'
import type { RepositoryContext } from './types'

interface ListOptions {
  limit?: number
  status?: string
  customerId?: string
}

export interface CreateMessageTemplateInput {
  name: string
  channel: CommunicationChannel
  purpose: CommunicationTemplatePurpose
  triggerType: string
  content: string
  variables?: string[]
  active?: boolean
}

export interface EnqueueMessageInput {
  templateId?: string
  customerId: string
  appointmentId?: string
  channel: CommunicationChannel
  purpose: CommunicationTemplatePurpose
  recipient: string
  renderedContent: string
  variables?: Record<string, string | number>
  scheduledAt: string
  idempotencyKey?: string
}

export interface AppendCommunicationLogInput {
  messageQueueId?: string
  templateId?: string
  customerId: string
  appointmentId?: string
  channel: CommunicationChannel
  direction: 'Outbound' | 'Inbound'
  eventType: CommunicationLogEventType
  providerMessageId?: string
  recipient?: string
  contentSnapshot?: string
  providerPayload?: Record<string, unknown>
  errorMessage?: string
  occurredAt?: string
}

export interface CreateRebookingOpportunityInput {
  customerId: string
  sourceAppointmentId: string
  therapistId?: string
  serviceId?: string
  priorityScore: number
  suggestedDate: string
  reason: string
  expectedRevenueMinor?: number
}

export interface CreateRenewalOpportunityInput {
  customerId: string
  opportunityType: 'Package' | 'Membership'
  customerPackageId?: string
  customerMembershipId?: string
  packageDefinitionId?: string
  membershipPlanId?: string
  dueDate: string
  remainingSessions?: number
  expectedRevenueMinor: number
  priorityScore: number
}

export interface AppendTimelineEventInput {
  customerId: string
  eventType: CustomerTimelineEventType
  title: string
  detail: string
  status?: string
  occurredAt: string
  appointmentId?: string
  messageQueueId?: string
  communicationLogId?: string
  packageRedemptionId?: string
  customerMembershipId?: string
  followUpTaskId?: string
  metadata?: Record<string, unknown>
}

type DatabaseRow = Record<string, unknown>

function required<T>(value: T | null, operation: string): T {
  if (value === null) {
    throw new Error(`${operation} returned no record.`)
  }
  return value
}

function fail(operation: string, error: { message: string } | null) {
  if (error) throw new Error(`${operation} failed: ${error.message}`)
}

function base(row: DatabaseRow) {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    branchId: String(row.branch_id),
    createdAt: String(row.created_at),
  }
}

function messageTemplate(row: DatabaseRow): MessageTemplateRecord {
  return {
    ...base(row),
    name: String(row.name),
    channel: row.channel as CommunicationChannel,
    purpose: row.purpose as CommunicationTemplatePurpose,
    triggerType: String(row.trigger_type),
    content: String(row.content),
    variables: (row.variables as string[]) ?? [],
    active: Boolean(row.active),
    updatedAt: String(row.updated_at),
  }
}

function queuedMessage(row: DatabaseRow): MessageQueueRecord {
  return {
    ...base(row),
    templateId: row.template_id ? String(row.template_id) : null,
    customerId: String(row.customer_id),
    appointmentId: row.appointment_id ? String(row.appointment_id) : null,
    channel: row.channel as CommunicationChannel,
    purpose: row.purpose as CommunicationTemplatePurpose,
    recipient: String(row.recipient),
    renderedContent: String(row.rendered_content),
    variables:
      (row.variables as Record<string, string | number> | null) ?? {},
    scheduledAt: String(row.scheduled_at),
    status: row.status as MessageQueueStatus,
    attemptCount: Number(row.attempt_count),
    lastAttemptAt: row.last_attempt_at ? String(row.last_attempt_at) : null,
    sentAt: row.sent_at ? String(row.sent_at) : null,
    cancelledAt: row.cancelled_at ? String(row.cancelled_at) : null,
    providerMessageId: row.provider_message_id
      ? String(row.provider_message_id)
      : null,
    idempotencyKey: row.idempotency_key
      ? String(row.idempotency_key)
      : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    updatedAt: String(row.updated_at),
  }
}

function communicationLog(row: DatabaseRow): CommunicationLogRecord {
  return {
    ...base(row),
    messageQueueId: row.message_queue_id
      ? String(row.message_queue_id)
      : null,
    templateId: row.template_id ? String(row.template_id) : null,
    customerId: String(row.customer_id),
    appointmentId: row.appointment_id ? String(row.appointment_id) : null,
    channel: row.channel as CommunicationChannel,
    direction: row.direction as 'Outbound' | 'Inbound',
    eventType: row.event_type as CommunicationLogEventType,
    providerMessageId: row.provider_message_id
      ? String(row.provider_message_id)
      : null,
    recipient: row.recipient ? String(row.recipient) : null,
    contentSnapshot: row.content_snapshot
      ? String(row.content_snapshot)
      : null,
    providerPayload:
      (row.provider_payload as Record<string, unknown> | null) ?? {},
    errorMessage: row.error_message ? String(row.error_message) : null,
    occurredAt: String(row.occurred_at),
  }
}

function rebookingOpportunity(
  row: DatabaseRow,
): RebookingOpportunityRecord {
  return {
    ...base(row),
    customerId: String(row.customer_id),
    sourceAppointmentId: String(row.source_appointment_id),
    therapistId: row.therapist_id ? String(row.therapist_id) : null,
    serviceId: row.service_id ? String(row.service_id) : null,
    priorityScore: Number(row.priority_score),
    suggestedDate: String(row.suggested_date),
    reason: String(row.reason),
    status: row.status as RebookingOpportunityStatus,
    expectedRevenueMinor: Number(row.expected_revenue_minor),
    resolvedAppointmentId: row.resolved_appointment_id
      ? String(row.resolved_appointment_id)
      : null,
    updatedAt: String(row.updated_at),
  }
}

function renewalOpportunity(row: DatabaseRow): RenewalOpportunityRecord {
  return {
    ...base(row),
    customerId: String(row.customer_id),
    opportunityType: row.opportunity_type as 'Package' | 'Membership',
    customerPackageId: row.customer_package_id
      ? String(row.customer_package_id)
      : null,
    customerMembershipId: row.customer_membership_id
      ? String(row.customer_membership_id)
      : null,
    packageDefinitionId: row.package_definition_id
      ? String(row.package_definition_id)
      : null,
    membershipPlanId: row.membership_plan_id
      ? String(row.membership_plan_id)
      : null,
    dueDate: String(row.due_date),
    remainingSessions:
      row.remaining_sessions === null ? null : Number(row.remaining_sessions),
    expectedRevenueMinor: Number(row.expected_revenue_minor),
    priorityScore: Number(row.priority_score),
    status: row.status as RenewalOpportunityStatus,
    updatedAt: String(row.updated_at),
  }
}

function timelineEvent(row: DatabaseRow): CustomerTimelineRecord {
  return {
    ...base(row),
    customerId: String(row.customer_id),
    eventType: row.event_type as CustomerTimelineEventType,
    title: String(row.title),
    detail: String(row.detail),
    status: row.status ? String(row.status) : null,
    occurredAt: String(row.occurred_at),
    appointmentId: row.appointment_id ? String(row.appointment_id) : null,
    messageQueueId: row.message_queue_id
      ? String(row.message_queue_id)
      : null,
    communicationLogId: row.communication_log_id
      ? String(row.communication_log_id)
      : null,
    packageRedemptionId: row.package_redemption_id
      ? String(row.package_redemption_id)
      : null,
    customerMembershipId: row.customer_membership_id
      ? String(row.customer_membership_id)
      : null,
    followUpTaskId: row.follow_up_task_id
      ? String(row.follow_up_task_id)
      : null,
    metadata: (row.metadata as Record<string, unknown> | null) ?? {},
  }
}

export async function listMessageTemplates(
  context: RepositoryContext,
): Promise<MessageTemplateRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('message_templates')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('name')
  fail('List message templates', error)
  return (data ?? []).map((row) => messageTemplate(row as DatabaseRow))
}

export async function createMessageTemplate(
  context: RepositoryContext,
  input: CreateMessageTemplateInput,
): Promise<MessageTemplateRecord> {
  const { data, error } = await getSupabaseClient()
    .from('message_templates')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      name: input.name,
      channel: input.channel,
      purpose: input.purpose,
      trigger_type: input.triggerType,
      content: input.content,
      variables: input.variables ?? [],
      active: input.active ?? true,
    })
    .select()
    .single()
  fail('Create message template', error)
  return messageTemplate(required(data, 'Create message template') as DatabaseRow)
}

export async function listMessageQueue(
  context: RepositoryContext,
  options: ListOptions = {},
): Promise<MessageQueueRecord[]> {
  let query = getSupabaseClient()
    .from('message_queue')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('scheduled_at')
    .limit(options.limit ?? 100)
  if (options.status) query = query.eq('status', options.status)
  if (options.customerId) query = query.eq('customer_id', options.customerId)
  const { data, error } = await query
  fail('List message queue', error)
  return (data ?? []).map((row) => queuedMessage(row as DatabaseRow))
}

export async function enqueueMessage(
  context: RepositoryContext,
  input: EnqueueMessageInput,
): Promise<MessageQueueRecord> {
  const { data, error } = await getSupabaseClient()
    .from('message_queue')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      template_id: input.templateId ?? null,
      customer_id: input.customerId,
      appointment_id: input.appointmentId ?? null,
      channel: input.channel,
      purpose: input.purpose,
      recipient: input.recipient,
      rendered_content: input.renderedContent,
      variables: input.variables ?? {},
      scheduled_at: input.scheduledAt,
      idempotency_key: input.idempotencyKey ?? null,
    })
    .select()
    .single()
  fail('Enqueue message', error)
  return queuedMessage(required(data, 'Enqueue message') as DatabaseRow)
}

export async function updateMessageStatus(
  context: RepositoryContext,
  messageId: string,
  status: MessageQueueStatus,
  errorMessage?: string,
): Promise<MessageQueueRecord> {
  const now = new Date().toISOString()
  const { data, error } = await getSupabaseClient()
    .from('message_queue')
    .update({
      status,
      error_message: errorMessage ?? null,
      sent_at: status === 'Sent' ? now : undefined,
      cancelled_at: status === 'Cancelled' ? now : undefined,
    })
    .eq('id', messageId)
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .select()
    .single()
  fail('Update message status', error)
  return queuedMessage(required(data, 'Update message status') as DatabaseRow)
}

export async function appendCommunicationLog(
  context: RepositoryContext,
  input: AppendCommunicationLogInput,
): Promise<CommunicationLogRecord> {
  const { data, error } = await getSupabaseClient()
    .from('communication_logs')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      message_queue_id: input.messageQueueId ?? null,
      template_id: input.templateId ?? null,
      customer_id: input.customerId,
      appointment_id: input.appointmentId ?? null,
      channel: input.channel,
      direction: input.direction,
      event_type: input.eventType,
      provider_message_id: input.providerMessageId ?? null,
      recipient: input.recipient ?? null,
      content_snapshot: input.contentSnapshot ?? null,
      provider_payload: input.providerPayload ?? {},
      error_message: input.errorMessage ?? null,
      occurred_at: input.occurredAt ?? new Date().toISOString(),
    })
    .select()
    .single()
  fail('Append communication log', error)
  return communicationLog(required(data, 'Append communication log') as DatabaseRow)
}

export async function listCommunicationLogs(
  context: RepositoryContext,
  options: ListOptions = {},
): Promise<CommunicationLogRecord[]> {
  let query = getSupabaseClient()
    .from('communication_logs')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('occurred_at', { ascending: false })
    .limit(options.limit ?? 100)
  if (options.customerId) query = query.eq('customer_id', options.customerId)
  const { data, error } = await query
  fail('List communication logs', error)
  return (data ?? []).map((row) => communicationLog(row as DatabaseRow))
}

export async function createRebookingOpportunity(
  context: RepositoryContext,
  input: CreateRebookingOpportunityInput,
): Promise<RebookingOpportunityRecord> {
  const { data, error } = await getSupabaseClient()
    .from('rebooking_opportunities')
    .upsert(
      {
        organization_id: context.organizationId,
        branch_id: context.branchId,
        customer_id: input.customerId,
        source_appointment_id: input.sourceAppointmentId,
        therapist_id: input.therapistId ?? null,
        service_id: input.serviceId ?? null,
        priority_score: input.priorityScore,
        suggested_date: input.suggestedDate,
        reason: input.reason,
        expected_revenue_minor: input.expectedRevenueMinor ?? 0,
      },
      {
        onConflict: 'organization_id,branch_id,source_appointment_id',
      },
    )
    .select()
    .single()
  fail('Create rebooking opportunity', error)
  return rebookingOpportunity(
    required(data, 'Create rebooking opportunity') as DatabaseRow,
  )
}

export async function listRebookingOpportunities(
  context: RepositoryContext,
  status: RebookingOpportunityStatus = 'Open',
): Promise<RebookingOpportunityRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('rebooking_opportunities')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .eq('status', status)
    .order('priority_score', { ascending: false })
    .order('suggested_date')
  fail('List rebooking opportunities', error)
  return (data ?? []).map((row) =>
    rebookingOpportunity(row as DatabaseRow),
  )
}

export async function createRenewalOpportunity(
  context: RepositoryContext,
  input: CreateRenewalOpportunityInput,
): Promise<RenewalOpportunityRecord> {
  const { data, error } = await getSupabaseClient()
    .from('renewal_opportunities')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      customer_id: input.customerId,
      opportunity_type: input.opportunityType,
      customer_package_id: input.customerPackageId ?? null,
      customer_membership_id: input.customerMembershipId ?? null,
      package_definition_id: input.packageDefinitionId ?? null,
      membership_plan_id: input.membershipPlanId ?? null,
      due_date: input.dueDate,
      remaining_sessions: input.remainingSessions ?? null,
      expected_revenue_minor: input.expectedRevenueMinor,
      priority_score: input.priorityScore,
    })
    .select()
    .single()
  fail('Create renewal opportunity', error)
  return renewalOpportunity(
    required(data, 'Create renewal opportunity') as DatabaseRow,
  )
}

export async function listRenewalOpportunities(
  context: RepositoryContext,
  status: RenewalOpportunityStatus = 'Open',
): Promise<RenewalOpportunityRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('renewal_opportunities')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .eq('status', status)
    .order('priority_score', { ascending: false })
    .order('due_date')
  fail('List renewal opportunities', error)
  return (data ?? []).map((row) => renewalOpportunity(row as DatabaseRow))
}

export async function appendCustomerTimelineEvent(
  context: RepositoryContext,
  input: AppendTimelineEventInput,
): Promise<CustomerTimelineRecord> {
  const { data, error } = await getSupabaseClient()
    .from('customer_timeline')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      customer_id: input.customerId,
      event_type: input.eventType,
      title: input.title,
      detail: input.detail,
      status: input.status ?? null,
      occurred_at: input.occurredAt,
      appointment_id: input.appointmentId ?? null,
      message_queue_id: input.messageQueueId ?? null,
      communication_log_id: input.communicationLogId ?? null,
      package_redemption_id: input.packageRedemptionId ?? null,
      customer_membership_id: input.customerMembershipId ?? null,
      follow_up_task_id: input.followUpTaskId ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single()
  fail('Append customer timeline event', error)
  return timelineEvent(
    required(data, 'Append customer timeline event') as DatabaseRow,
  )
}

export async function listCustomerTimeline(
  context: RepositoryContext,
  customerId: string,
  limit = 100,
): Promise<CustomerTimelineRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('customer_timeline')
    .select('*')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .eq('customer_id', customerId)
    .order('occurred_at', { ascending: false })
    .limit(limit)
  fail('List customer timeline', error)
  return (data ?? []).map((row) => timelineEvent(row as DatabaseRow))
}
