export type CommissionStatus = 'Pending' | 'Approved' | 'Paid'
export type StatementStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Paid'
export type CommissionAppliesTo = 'Service' | 'Package' | 'Product' | 'Membership'
export type CommissionCalculation = 'Fixed' | 'Percentage' | 'Tiered'
export type AdjustmentType = 'Bonus' | 'Deduction' | 'Correction'

export interface TherapistCommission {
  id: string
  therapist: string
  sessions: number
  serviceRevenue: number
  packageSales: number
  productSales: number
  commission: number
  bonus: number
  totalPayout: number
  status: CommissionStatus
}

export interface CommissionRule {
  id: string
  name: string
  appliesTo: CommissionAppliesTo
  category: string
  calculation: CommissionCalculation
  rate: string
  active: boolean
  effectiveDate: string
}

export interface CommissionStatement {
  id: string
  therapist: string
  period: string
  basicSalary: number
  commission: number
  bonus: number
  deductions: number
  netPayout: number
  status: StatementStatus
}

export interface CommissionAdjustment {
  id: string
  therapist: string
  reason: string
  amount: number
  type: AdjustmentType
  approvedBy: string
  date: string
}
