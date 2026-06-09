import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  HeartPulse,
  BellRing,
  Boxes,
  LayoutDashboard,
  PackageOpen,
  Settings,
  Sparkles,
  UsersRound,
} from 'lucide-react'
import type { NavigationSection } from '../types/navigation'

export const navigationSections: NavigationSection[] = [
  {
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        id: 'appointments',
        label: 'Appointments',
        path: '/appointments',
        icon: CalendarDays,
      },
      {
        id: 'customers',
        label: 'Customers',
        path: '/customers',
        icon: UsersRound,
      },
      {
        id: 'wellness-profiles',
        label: 'Wellness Profiles',
        path: '/wellness-profiles',
        icon: HeartPulse,
      },
      {
        id: 'packages',
        label: 'Packages',
        path: '/packages',
        icon: PackageOpen,
      },
      {
        id: 'memberships',
        label: 'Memberships',
        path: '/memberships',
        icon: CreditCard,
      },
      {
        id: 'therapists',
        label: 'Therapists',
        path: '/therapists',
        icon: Sparkles,
      },
      {
        id: 'commission-center',
        label: 'Commission Center',
        path: '/commission-center',
        icon: CircleDollarSign,
      },
      {
        id: 'inventory-center',
        label: 'Inventory Center',
        path: '/inventory-center',
        icon: Boxes,
      },
      {
        id: 'notification-center',
        label: 'Notification Center',
        path: '/notification-center',
        icon: BellRing,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: ChartNoAxesCombined,
      },
      {
        id: 'settings',
        label: 'Settings',
        path: '/settings',
        icon: Settings,
      },
    ],
  },
]
