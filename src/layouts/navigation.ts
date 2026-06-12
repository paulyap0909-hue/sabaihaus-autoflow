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
  ListChecks,
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
      {
        id: 'action-center',
        label: 'Action Center',
        path: '/action-center',
        icon: ListChecks,
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
        id: 'communication',
        label: 'Communication',
        path: '/communication',
        icon: BellRing,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        id: 'reports',
        label: 'Business Intelligence',
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
