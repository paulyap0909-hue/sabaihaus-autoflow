import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  PackageOpen,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import type {
  AttentionItem,
  DashboardAppointment,
  DashboardMetric,
  TherapistSnapshot,
} from '../types/dashboard'

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Today's revenue",
    value: 'RM 8,420',
    change: '+12.4% from last Wednesday',
    icon: CircleDollarSign,
  },
  {
    label: "Today's appointments",
    value: '28',
    change: '22 confirmed · 3 available',
    icon: CalendarDays,
  },
  {
    label: 'Rebooking rate',
    value: '68%',
    change: '+4.8% this month',
    icon: UserRoundCheck,
  },
  {
    label: 'Active members',
    value: '186',
    change: '12 renewals due this week',
    icon: CreditCard,
  },
]

export const todaysAppointments: DashboardAppointment[] = [
  {
    id: 'apt-001',
    time: '10:00',
    customer: 'Amelia Tan',
    service: 'Aromatherapy Massage · 90 min',
    therapist: 'Nok',
    status: 'In Treatment',
    color: 'teal',
  },
  {
    id: 'apt-002',
    time: '11:30',
    customer: 'Sarah Lim',
    service: 'Signature Head Spa · 60 min',
    therapist: 'Mei',
    status: 'Checked In',
    color: 'gold',
  },
  {
    id: 'apt-003',
    time: '12:00',
    customer: 'Daniel Wong',
    service: 'Deep Tissue Massage · 90 min',
    therapist: 'Aom',
    status: 'Confirmed',
    color: 'sand',
  },
  {
    id: 'apt-004',
    time: '13:30',
    customer: 'Nur Aisyah',
    service: 'Thai Wellness Ritual · 120 min',
    therapist: 'Nok',
    status: 'Confirmed',
    color: 'teal',
  },
]

export const attentionItems: AttentionItem[] = [
  {
    id: 'attention-001',
    title: 'Customers ready for a return visit',
    detail: 'No appointment in the last 45 days',
    count: 24,
    icon: UsersRound,
  },
  {
    id: 'attention-002',
    title: 'Packages expiring soon',
    detail: 'Within the next 14 days',
    count: 11,
    icon: PackageOpen,
  },
  {
    id: 'attention-003',
    title: 'Follow-ups due today',
    detail: 'Aftercare and rebooking messages',
    count: 8,
    icon: Clock3,
  },
  {
    id: 'attention-004',
    title: 'Membership renewals',
    detail: 'Payment or confirmation required',
    count: 6,
    icon: Sparkles,
  },
]

export const therapistSnapshots: TherapistSnapshot[] = [
  {
    id: 'therapist-001',
    initials: 'NK',
    name: 'Nok S.',
    sessions: 6,
    revenue: 'RM 1,920',
    rebookingRate: 78,
  },
  {
    id: 'therapist-002',
    initials: 'AM',
    name: 'Aom M.',
    sessions: 5,
    revenue: 'RM 1,640',
    rebookingRate: 72,
  },
  {
    id: 'therapist-003',
    initials: 'ML',
    name: 'Mei L.',
    sessions: 5,
    revenue: 'RM 1,520',
    rebookingRate: 69,
  },
  {
    id: 'therapist-004',
    initials: 'PJ',
    name: 'Pim J.',
    sessions: 4,
    revenue: 'RM 1,260',
    rebookingRate: 64,
  },
]
