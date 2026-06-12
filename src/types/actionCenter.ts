import type { MessageQueueStatus } from './communication'

export type ActionCenterTab =
  | 'Today'
  | 'Rebooking'
  | 'Renewals'
  | 'VIP Rescue'
  | 'Messages'
  | 'Completed'

export type ActionStatus = 'Open' | 'Contacted' | 'Completed'

export interface FrontDeskRebookingAction {
  id: string
  customerId: string
  customerName: string
  phone: string
  lastVisitDate: string
  lastService: string
  preferredTherapist: string
  daysInactive: number
  suggestedDate: string
  estimatedRevenue: number
  priorityScore: number
  suggestedMessage: string
  status: ActionStatus
}

export interface FrontDeskRenewalAction {
  id: string
  customerId: string
  customerName: string
  phone: string
  renewalType: 'Package' | 'Membership'
  itemName: string
  remainingSessions: number | null
  expiryDate: string
  expectedRevenue: number
  suggestedMessage: string
  priorityScore: number
  status: ActionStatus
}

export interface VipRescueAction {
  id: string
  customerId: string
  customerName: string
  phone: string
  segment: string
  daysInactive: number
  lifetimeValue: number
  riskScore: number
  recoveryOffer: string
  recommendedTherapist: string
  hasFutureBooking: boolean
  status: ActionStatus
}

export interface FrontDeskMessageAction {
  id: string
  customerId: string
  customerName: string
  recipient: string
  purpose: string
  channel: string
  message: string
  scheduledAt: string
  status: MessageQueueStatus
}

export interface ActionCenterSummary {
  rebooking: number
  packageRenewals: number
  membershipRenewals: number
  vipAtRisk: number
  pendingFollowUps: number
  pendingMessages: number
  estimatedRevenue: number
  urgentActions: number
  totalActions: number
}

export interface ActionCenterSnapshot {
  generatedAt: string
  source: 'live' | 'mock'
  sourceLabel: 'Live Supabase data' | 'Mock fallback'
  fallbackReason?: string
  summary: ActionCenterSummary
  rebooking: FrontDeskRebookingAction[]
  renewals: FrontDeskRenewalAction[]
  vipRescue: VipRescueAction[]
  messages: FrontDeskMessageAction[]
}

export type OpportunityKind = 'Rebooking' | 'Renewal' | 'VIP Rescue'
export type OpportunityCompletionStatus =
  | 'Contacted'
  | 'Completed'
  | 'Renewed'
