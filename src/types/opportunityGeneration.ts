export type OpportunityTrigger =
  | 'Inactive Customer'
  | 'Package Balance'
  | 'Membership Expiry'
  | 'VIP Inactive'
  | 'Appointment Confirmation'

export interface OpportunityGenerationThresholds {
  inactiveCustomerDays: number
  packageRemainingSessions: number
  membershipExpiryDays: number
  vipInactiveDays: number
}

export interface OpportunityGenerationResult {
  scannedAt: string
  organizationsScanned: number
  rebookingCreated: number
  renewalsCreated: number
  messagesQueued: number
  timelineEventsCreated: number
}

export interface OpportunityCandidate {
  trigger: OpportunityTrigger
  sourceId: string
  customerId: string
  priorityScore: number
}
