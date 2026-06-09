export type PackageStatus = 'Active' | 'Low Balance' | 'Expiring Soon' | 'Expired'

export interface PackageDefinition {
  id: string
  name: string
  category: string
  sessions: number
  validityDays: number
  price: number
  activeCustomers: number
}

export interface PackageRedemption {
  date: string
  service: string
  therapist: string
  appointmentId: string
}

export interface CustomerPackage {
  id: string
  customer: string
  packageName: string
  purchased: string
  expires: string
  totalSessions: number
  remainingSessions: number
  valueRemaining: number
  status: PackageStatus
  redemptions: PackageRedemption[]
}
