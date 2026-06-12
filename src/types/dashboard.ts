import type { LucideIcon } from 'lucide-react'

export interface DashboardMetric {
  label: string
  value: string
  change: string
  icon: LucideIcon
}

export interface DashboardAppointment {
  id: string
  time: string
  customer: string
  service: string
  therapist: string
  status: 'Confirmed' | 'Checked In' | 'In Progress'
  color: 'teal' | 'gold' | 'sand'
}

export interface AttentionItem {
  id: string
  title: string
  detail: string
  count: number
  icon: LucideIcon
}

export interface TherapistSnapshot {
  id: string
  initials: string
  name: string
  sessions: number
  revenue: string
  rebookingRate: number
}
