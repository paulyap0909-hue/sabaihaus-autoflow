export type MembershipTier = 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
export type MembershipStatus = 'Active' | 'Renewal Due' | 'Paused' | 'Expired'

export interface MembershipTierDefinition {
  tier: MembershipTier
  monthlyPrice: number
  members: number
  color: string
  benefits: string[]
}

export interface Membership {
  id: string
  customer: string
  tier: MembershipTier
  joined: string
  renews: string
  visitsThisMonth: number
  savingsThisYear: number
  status: MembershipStatus
}
