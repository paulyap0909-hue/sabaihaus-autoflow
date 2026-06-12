import type { LucideIcon } from 'lucide-react'

export type PageKey =
  | 'dashboard'
  | 'action-center'
  | 'appointments'
  | 'customers'
  | 'wellness-profiles'
  | 'packages'
  | 'therapists'
  | 'commission-center'
  | 'memberships'
  | 'inventory-center'
  | 'communication'
  | 'reports'
  | 'settings'
  | 'admin-system-health'

export interface NavigationItem {
  id: PageKey
  label: string
  path: string
  icon: LucideIcon
}

export interface NavigationSection {
  label: string
  items: NavigationItem[]
}

export interface AppNavigationState {
  currentPage: PageKey
  navigate: (page: PageKey) => void
}
