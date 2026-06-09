export type WellnessRisk = 'Low' | 'Moderate' | 'High'

export interface WellnessScores {
  stressLevel: number
  sleepQuality: number
  neckTension: number
  shoulderTension: number
  backPain: number
  eyeFatigue: number
  scalpHealth: number
  energyLevel: number
}

export interface WellnessJourneyEvent {
  date: string
  title: string
  detail: string
  score: number
}

export interface WellnessProfile {
  id: string
  customer: string
  phone: string
  lastAssessment: string
  overallScore: number
  riskLevel: WellnessRisk
  scores: WellnessScores
  notes: string
  recommendations: string[]
  journey: WellnessJourneyEvent[]
}
