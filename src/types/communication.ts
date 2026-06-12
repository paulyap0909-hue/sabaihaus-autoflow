export type CommunicationChannel = 'WhatsApp' | 'Email' | 'SMS'
export type MessageQueueStatus =
  | 'Scheduled'
  | 'Pending'
  | 'Sent'
  | 'Failed'
  | 'Cancelled'

export type CommunicationTemplatePurpose =
  | 'Appointment Reminder'
  | 'Check-In Reminder'
  | 'Arrival Reminder'
  | 'Aftercare Message'
  | 'Birthday Message'
  | 'Package Expiry'
  | 'Membership Renewal'
  | 'Win-Back Campaign'

export interface CommunicationTemplate {
  id: string
  name: string
  channel: CommunicationChannel
  purpose: CommunicationTemplatePurpose
  trigger: string
  content: string
  active: boolean
}

export interface MessageQueueItem {
  id: string
  customer: string
  channel: CommunicationChannel
  messageType: CommunicationTemplatePurpose
  scheduledAt: string
  status: MessageQueueStatus
  recipient: string
  errorMessage?: string
}

export interface RebookingOpportunity {
  id: string
  customer: string
  appointmentId: string
  completedAt: string
  therapist: string
  service: string
  priorityScore: number
  suggestedDate: string
  reason: string
}

export interface RenewalOpportunity {
  id: string
  customer: string
  type: 'Package' | 'Membership'
  itemName: string
  dueDate: string
  remainingSessions?: number
  expectedRevenue: number
  priorityScore: number
}

export type CustomerTimelineEventType =
  | 'Appointment'
  | 'Message'
  | 'Package Redemption'
  | 'Membership Event'
  | 'Follow Up'
  | 'Note'

export interface CustomerTimelineEvent {
  id: string
  type: CustomerTimelineEventType
  occurredAt: string
  title: string
  detail: string
  status?: string
}

export type RebookingOpportunityStatus =
  | 'Open'
  | 'Contacted'
  | 'Booked'
  | 'Dismissed'
  | 'Expired'

export type RenewalOpportunityStatus =
  | 'Open'
  | 'Contacted'
  | 'Renewed'
  | 'Dismissed'
  | 'Expired'

export type CommunicationLogEventType =
  | 'Queued'
  | 'Dispatch Attempted'
  | 'Sent'
  | 'Delivered'
  | 'Read'
  | 'Failed'
  | 'Cancelled'
  | 'Reply Received'

export interface CommunicationPersistedRecord {
  id: string
  organizationId: string
  branchId: string
  createdAt: string
}

export interface MessageTemplateRecord extends CommunicationPersistedRecord {
  name: string
  channel: CommunicationChannel
  purpose: CommunicationTemplatePurpose
  triggerType: string
  content: string
  variables: string[]
  active: boolean
  updatedAt: string
}

export interface MessageQueueRecord extends CommunicationPersistedRecord {
  templateId: string | null
  customerId: string
  appointmentId: string | null
  channel: CommunicationChannel
  purpose: CommunicationTemplatePurpose
  recipient: string
  renderedContent: string
  variables: Record<string, string | number>
  scheduledAt: string
  status: MessageQueueStatus
  attemptCount: number
  lastAttemptAt: string | null
  sentAt: string | null
  cancelledAt: string | null
  providerMessageId: string | null
  idempotencyKey: string | null
  errorMessage: string | null
  updatedAt: string
}

export interface CommunicationLogRecord extends CommunicationPersistedRecord {
  messageQueueId: string | null
  templateId: string | null
  customerId: string
  appointmentId: string | null
  channel: CommunicationChannel
  direction: 'Outbound' | 'Inbound'
  eventType: CommunicationLogEventType
  providerMessageId: string | null
  recipient: string | null
  contentSnapshot: string | null
  providerPayload: Record<string, unknown>
  errorMessage: string | null
  occurredAt: string
}

export interface RebookingOpportunityRecord
  extends CommunicationPersistedRecord {
  customerId: string
  sourceAppointmentId: string
  therapistId: string | null
  serviceId: string | null
  priorityScore: number
  suggestedDate: string
  reason: string
  status: RebookingOpportunityStatus
  expectedRevenueMinor: number
  resolvedAppointmentId: string | null
  updatedAt: string
}

export interface RenewalOpportunityRecord extends CommunicationPersistedRecord {
  customerId: string
  opportunityType: 'Package' | 'Membership'
  customerPackageId: string | null
  customerMembershipId: string | null
  packageDefinitionId: string | null
  membershipPlanId: string | null
  dueDate: string
  remainingSessions: number | null
  expectedRevenueMinor: number
  priorityScore: number
  status: RenewalOpportunityStatus
  updatedAt: string
}

export interface CustomerTimelineRecord extends CommunicationPersistedRecord {
  customerId: string
  eventType: CustomerTimelineEventType
  title: string
  detail: string
  status: string | null
  occurredAt: string
  appointmentId: string | null
  messageQueueId: string | null
  communicationLogId: string | null
  packageRedemptionId: string | null
  customerMembershipId: string | null
  followUpTaskId: string | null
  metadata: Record<string, unknown>
}
