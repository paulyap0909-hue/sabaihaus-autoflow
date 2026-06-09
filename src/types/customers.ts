export type RetentionStatus =
  | 'Active'
  | 'Follow Up Soon'
  | 'At Risk'
  | 'Lost'
  | 'VIP'

export type MembershipTier = 'None' | 'Essential' | 'Serenity' | 'Signature'

export interface CustomerVisit {
  date: string
  service: string
  therapist: string
  amount: number
}

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  birthday: string
  source: string
  lastVisit: string
  preferredService: string
  lifetimeValue: number
  packageBalance: number
  membershipTier: MembershipTier
  retentionStatus: RetentionStatus
  nextAction: string
  wellnessSummary: string
  followUpNotes: string
  visits: CustomerVisit[]
}
