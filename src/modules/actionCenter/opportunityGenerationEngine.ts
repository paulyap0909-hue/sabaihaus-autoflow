import type {
  OpportunityGenerationThresholds,
  OpportunityTrigger,
} from '../../types/opportunityGeneration'

export const opportunityGenerationThresholds: OpportunityGenerationThresholds = {
  inactiveCustomerDays: 21,
  packageRemainingSessions: 1,
  membershipExpiryDays: 7,
  vipInactiveDays: 30,
}

export function calculateOpportunityPriority(
  trigger: OpportunityTrigger,
  days: number,
) {
  const baseScore: Record<OpportunityTrigger, number> = {
    'Inactive Customer': 55,
    'Package Balance': 82,
    'Membership Expiry': 85,
    'VIP Inactive': 90,
    'Appointment Confirmation': 78,
  }

  return Math.min(100, baseScore[trigger] + Math.max(0, Math.floor(days / 7)))
}

export function buildOpportunityGenerationKey(
  trigger: OpportunityTrigger,
  sourceId: string,
  cycle?: string,
) {
  return [
    'phase4.9.1',
    trigger.toLowerCase().replaceAll(' ', '-'),
    sourceId,
    cycle,
  ]
    .filter(Boolean)
    .join(':')
}
