import type { Membership, MembershipTierDefinition } from '../types/memberships'
import type { CustomerPackage, PackageDefinition } from '../types/packages'
import type { Therapist } from '../types/therapists'
import type { WellnessProfile } from '../types/wellness'

export const wellnessProfiles: WellnessProfile[] = [
  {
    id: 'WEL-1001',
    customer: 'Amelia Tan',
    phone: '+60 12-884 2108',
    lastAssessment: '2026-06-10',
    overallScore: 72,
    riskLevel: 'Moderate',
    scores: { stressLevel: 7, sleepQuality: 6, neckTension: 8, shoulderTension: 8, backPain: 4, eyeFatigue: 6, scalpHealth: 8, energyLevel: 6 },
    notes: 'Workload has increased. Left shoulder feels tighter after long desk sessions.',
    recommendations: ['90-minute aromatherapy massage', 'Neck and shoulder focus', 'Return within 14 days'],
    journey: [
      { date: '2026-06-10', title: 'Wellness reassessment', detail: 'Shoulder tension improved slightly; stress remains elevated.', score: 72 },
      { date: '2026-05-18', title: 'Thai Wellness Ritual', detail: 'Mobility and energy improved after treatment.', score: 68 },
      { date: '2026-04-22', title: 'Initial assessment', detail: 'High neck and shoulder tension identified.', score: 61 },
    ],
  },
  {
    id: 'WEL-1002',
    customer: 'Sarah Lim',
    phone: '+60 17-620 4419',
    lastAssessment: '2026-06-10',
    overallScore: 84,
    riskLevel: 'Low',
    scores: { stressLevel: 4, sleepQuality: 8, neckTension: 3, shoulderTension: 4, backPain: 2, eyeFatigue: 5, scalpHealth: 6, energyLevel: 8 },
    notes: 'Scalp sensitivity has reduced. Continue fragrance-free care.',
    recommendations: ['Monthly Signature Head Spa', 'Low-heat scalp treatment', 'Hydration follow-up'],
    journey: [
      { date: '2026-06-10', title: 'Head spa assessment', detail: 'Scalp hydration improved and sensitivity reduced.', score: 84 },
      { date: '2026-05-07', title: 'Care plan started', detail: 'Established fragrance-free monthly routine.', score: 76 },
    ],
  },
  {
    id: 'WEL-1003',
    customer: 'Daniel Wong',
    phone: '+60 16-311 7820',
    lastAssessment: '2026-04-19',
    overallScore: 58,
    riskLevel: 'High',
    scores: { stressLevel: 6, sleepQuality: 5, neckTension: 5, shoulderTension: 6, backPain: 9, eyeFatigue: 4, scalpHealth: 8, energyLevel: 5 },
    notes: 'Lower-back discomfort increases after long cycling sessions.',
    recommendations: ['Deep tissue massage', 'Lower-back and hamstring focus', 'Return within 7 days'],
    journey: [
      { date: '2026-04-19', title: 'Deep tissue follow-up', detail: 'Temporary reduction in lower-back tightness.', score: 58 },
      { date: '2026-03-09', title: 'Initial assessment', detail: 'High lower-back tension and reduced flexibility.', score: 52 },
    ],
  },
  {
    id: 'WEL-1004',
    customer: 'Michelle Goh',
    phone: '+60 12-792 1033',
    lastAssessment: '2026-02-12',
    overallScore: 66,
    riskLevel: 'Moderate',
    scores: { stressLevel: 8, sleepQuality: 4, neckTension: 6, shoulderTension: 7, backPain: 3, eyeFatigue: 8, scalpHealth: 7, energyLevel: 4 },
    notes: 'Sleep quality and eye fatigue are the main wellbeing concerns.',
    recommendations: ['Lymphatic massage', 'Quiet-room treatment', 'Evening digital-rest routine'],
    journey: [
      { date: '2026-02-12', title: 'Wellness assessment', detail: 'High stress and low sleep quality recorded.', score: 66 },
    ],
  },
]

export const packageDefinitions: PackageDefinition[] = [
  { id: 'PKD-01', name: 'Sabai Reset 5', category: 'Massage', sessions: 5, validityDays: 180, price: 1050, activeCustomers: 38 },
  { id: 'PKD-02', name: 'Deep Restore 10', category: 'Massage', sessions: 10, validityDays: 365, price: 2600, activeCustomers: 24 },
  { id: 'PKD-03', name: 'Head Spa Ritual 6', category: 'Head Spa', sessions: 6, validityDays: 240, price: 1180, activeCustomers: 31 },
  { id: 'PKD-04', name: 'Thai Wellness Journey', category: 'Wellness Ritual', sessions: 4, validityDays: 180, price: 1320, activeCustomers: 17 },
]

export const customerPackages: CustomerPackage[] = [
  { id: 'CP-1001', customer: 'Amelia Tan', packageName: 'Sabai Reset 5', purchased: '2026-04-22', expires: '2026-10-19', totalSessions: 5, remainingSessions: 3, valueRemaining: 630, status: 'Active', redemptions: [
    { date: '2026-06-10', service: 'Aromatherapy Massage', therapist: 'Nok S.', appointmentId: 'APT-1048' },
    { date: '2026-05-18', service: 'Aromatherapy Massage', therapist: 'Nok S.', appointmentId: 'APT-1011' },
  ] },
  { id: 'CP-1002', customer: 'Sarah Lim', packageName: 'Head Spa Ritual 6', purchased: '2026-02-10', expires: '2026-10-08', totalSessions: 6, remainingSessions: 2, valueRemaining: 394, status: 'Low Balance', redemptions: [
    { date: '2026-06-10', service: 'Signature Head Spa', therapist: 'Mei L.', appointmentId: 'APT-1049' },
    { date: '2026-05-07', service: 'Signature Head Spa', therapist: 'Mei L.', appointmentId: 'APT-0991' },
  ] },
  { id: 'CP-1003', customer: 'Daniel Wong', packageName: 'Deep Restore 10', purchased: '2025-07-01', expires: '2026-06-30', totalSessions: 10, remainingSessions: 1, valueRemaining: 260, status: 'Expiring Soon', redemptions: [
    { date: '2026-04-19', service: 'Deep Tissue Massage', therapist: 'Aom M.', appointmentId: 'APT-0912' },
    { date: '2026-03-09', service: 'Deep Tissue Massage', therapist: 'Aom M.', appointmentId: 'APT-0834' },
  ] },
  { id: 'CP-1004', customer: 'Farah Rahman', packageName: 'Sabai Reset 5', purchased: '2025-08-20', expires: '2026-02-16', totalSessions: 5, remainingSessions: 2, valueRemaining: 420, status: 'Expired', redemptions: [
    { date: '2025-12-20', service: 'Aromatherapy Massage', therapist: 'Aom M.', appointmentId: 'APT-0701' },
  ] },
]

export const membershipTiers: MembershipTierDefinition[] = [
  { tier: 'Silver', monthlyPrice: 129, members: 82, color: 'silver', benefits: ['5% service savings', 'Birthday add-on', 'Member booking window'] },
  { tier: 'Gold', monthlyPrice: 229, members: 61, color: 'gold', benefits: ['10% service savings', 'One monthly add-on', 'Priority booking'] },
  { tier: 'Platinum', monthlyPrice: 369, members: 31, color: 'platinum', benefits: ['One monthly 60-min treatment', '15% add-on savings', 'Priority therapist access'] },
  { tier: 'Diamond', monthlyPrice: 599, members: 12, color: 'diamond', benefits: ['Two monthly treatments', '20% add-on savings', 'Concierge booking'] },
]

export const memberships: Membership[] = [
  { id: 'MEM-101', customer: 'Amelia Tan', tier: 'Diamond', joined: '2025-08-14', renews: '2026-06-14', visitsThisMonth: 2, savingsThisYear: 1280, status: 'Active' },
  { id: 'MEM-102', customer: 'Sarah Lim', tier: 'Gold', joined: '2026-01-03', renews: '2026-06-12', visitsThisMonth: 1, savingsThisYear: 460, status: 'Renewal Due' },
  { id: 'MEM-103', customer: 'Nur Aisyah', tier: 'Platinum', joined: '2025-11-22', renews: '2026-06-22', visitsThisMonth: 2, savingsThisYear: 820, status: 'Active' },
  { id: 'MEM-104', customer: 'Michelle Goh', tier: 'Silver', joined: '2025-10-10', renews: '2026-06-10', visitsThisMonth: 0, savingsThisYear: 210, status: 'Renewal Due' },
  { id: 'MEM-105', customer: 'Jason Lee', tier: 'Gold', joined: '2026-02-18', renews: '2026-07-18', visitsThisMonth: 0, savingsThisYear: 330, status: 'Paused' },
]

export const therapists: Therapist[] = [
  { id: 'TH-01', name: 'Nok S.', initials: 'NS', specialties: ['Thai Massage', 'Aromatherapy'], availability: 'In Treatment', nextAvailable: '11:30 AM', sessions: 94, revenue: 31320, rebookingRate: 78, upsellRate: 32, rating: 4.9, commission: 4320, monthlyTarget: 35000 },
  { id: 'TH-02', name: 'Aom M.', initials: 'AM', specialties: ['Deep Tissue', 'Sports Recovery'], availability: 'Available', nextAvailable: 'Now', sessions: 86, revenue: 27340, rebookingRate: 72, upsellRate: 28, rating: 4.8, commission: 3730, monthlyTarget: 32000 },
  { id: 'TH-03', name: 'Mei L.', initials: 'ML', specialties: ['Head Spa', 'Scalp Care'], availability: 'Break', nextAvailable: '12:15 PM', sessions: 82, revenue: 28460, rebookingRate: 69, upsellRate: 41, rating: 4.9, commission: 3680, monthlyTarget: 30000 },
  { id: 'TH-04', name: 'Pim J.', initials: 'PJ', specialties: ['Lymphatic', 'Relaxation'], availability: 'Available', nextAvailable: 'Now', sessions: 73, revenue: 21480, rebookingRate: 64, upsellRate: 23, rating: 4.7, commission: 2910, monthlyTarget: 28000 },
  { id: 'TH-05', name: 'Mali K.', initials: 'MK', specialties: ['Thai Massage', 'Foot Reflexology'], availability: 'Off Duty', nextAvailable: 'Tomorrow 9:00 AM', sessions: 68, revenue: 19640, rebookingRate: 67, upsellRate: 25, rating: 4.8, commission: 2640, monthlyTarget: 26000 },
]
