export type TherapistAvailability = 'Available' | 'In Treatment' | 'Break' | 'Off Duty'

export interface Therapist {
  id: string
  name: string
  initials: string
  specialties: string[]
  availability: TherapistAvailability
  nextAvailable: string
  sessions: number
  revenue: number
  rebookingRate: number
  upsellRate: number
  rating: number
  commission: number
  monthlyTarget: number
}
