import { messageQueue } from './mockCommunication'
import { appointments, customers } from './mockOperations'
import { memberships, therapists } from './mockPhase3'
import {
  generateRebookingOpportunities,
  generateRenewalOpportunities,
} from '../modules/communication/communicationEngine'
import type {
  ActionCenterSnapshot,
  FrontDeskRebookingAction,
  FrontDeskRenewalAction,
  VipRescueAction,
} from '../types/actionCenter'

const NOW = new Date('2026-06-12T09:00:00+08:00')
const DAY_MS = 86_400_000
const daysInactive = (date: string) =>
  Math.max(0, Math.floor((NOW.getTime() - new Date(date).getTime()) / DAY_MS))

function mockRebooking(): FrontDeskRebookingAction[] {
  return generateRebookingOpportunities().map((item) => {
    const customer = customers.find((record) => record.name === item.customer)
    return {
      id: item.id,
      customerId: customer?.id ?? item.customer,
      customerName: item.customer,
      phone: customer?.phone ?? '',
      lastVisitDate: item.completedAt,
      lastService: item.service,
      preferredTherapist: item.therapist,
      daysInactive: daysInactive(item.completedAt),
      suggestedDate: item.suggestedDate,
      estimatedRevenue:
        appointments.find((appointment) => appointment.id === item.appointmentId)
          ?.price ?? 0,
      priorityScore: item.priorityScore,
      suggestedMessage: `Hi ${item.customer}, it may be time for your next ${item.service}. Would you like us to reserve a visit with ${item.therapist}?`,
      status: 'Open',
    }
  })
}

function mockRenewals(): FrontDeskRenewalAction[] {
  return generateRenewalOpportunities().map((item) => {
    const customer = customers.find((record) => record.name === item.customer)
    return {
      id: item.id,
      customerId: customer?.id ?? item.customer,
      customerName: item.customer,
      phone: customer?.phone ?? '',
      renewalType: item.type,
      itemName: item.itemName,
      remainingSessions: item.remainingSessions ?? null,
      expiryDate: item.dueDate,
      expectedRevenue: item.expectedRevenue,
      suggestedMessage:
        item.type === 'Package'
          ? `Hi ${item.customer}, your ${item.itemName} has ${item.remainingSessions ?? 0} sessions remaining. May we help you renew and plan your next visit?`
          : `Hi ${item.customer}, your ${item.itemName} is ready for renewal. May we reserve your member benefits for the next cycle?`,
      priorityScore: item.priorityScore,
      status: 'Open',
    }
  })
}

function mockVipRescue(): VipRescueAction[] {
  return customers
    .filter((customer) => {
      const membership = memberships.find((item) => item.customer === customer.name)
      const premium = customer.retentionStatus === 'VIP' ||
        ['Gold', 'Platinum', 'Diamond'].includes(membership?.tier ?? '')
      const highValue = customer.lifetimeValue >= 1400
      const noFuture = !appointments.some(
        (appointment) =>
          appointment.customer === customer.name &&
          new Date(`${appointment.date}T${appointment.time}:00+08:00`) > NOW,
      )
      return daysInactive(customer.lastVisit) > 30 && noFuture && (premium || highValue)
    })
    .map((customer) => {
      const membership = memberships.find((item) => item.customer === customer.name)
      const therapist = therapists.find((item) =>
        item.specialties.some((specialty) =>
          customer.preferredService.toLowerCase().includes(specialty.toLowerCase()),
        ),
      ) ?? therapists[0]
      const inactive = daysInactive(customer.lastVisit)
      return {
        id: `VIP-${customer.id}`,
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        segment: customer.retentionStatus === 'VIP'
          ? 'VIP'
          : membership?.tier ?? 'High Value',
        daysInactive: inactive,
        lifetimeValue: customer.lifetimeValue,
        riskScore: Math.min(100, 45 + inactive / 2 + customer.lifetimeValue / 250),
        recoveryOffer: 'Priority therapist booking with a complimentary wellness add-on.',
        recommendedTherapist: therapist?.name ?? 'Preferred therapist',
        hasFutureBooking: false,
        status: 'Open',
      }
    })
}

export function buildMockActionCenterSnapshot(
  fallbackReason?: string,
): ActionCenterSnapshot {
  const rebooking = mockRebooking()
  const renewals = mockRenewals()
  const vipRescue = mockVipRescue()
  const messages = messageQueue.map((item) => {
    const customer = customers.find((record) => record.name === item.customer)
    return {
      id: item.id,
      customerId: customer?.id ?? item.customer,
      customerName: item.customer,
      recipient: item.recipient,
      purpose: item.messageType,
      channel: item.channel,
      message: `Hi ${item.customer}, this is your Sabai Haus ${item.messageType.toLowerCase()} message.`,
      scheduledAt: item.scheduledAt,
      status: item.status,
    }
  })
  const estimatedRevenue = [...rebooking, ...renewals].reduce(
    (sum, item) =>
      sum +
      ('estimatedRevenue' in item
        ? item.estimatedRevenue
        : item.expectedRevenue),
    0,
  )
  return {
    generatedAt: new Date().toISOString(),
    source: 'mock',
    sourceLabel: 'Mock fallback',
    fallbackReason,
    rebooking,
    renewals,
    vipRescue,
    messages,
    summary: {
      rebooking: rebooking.filter((item) => item.status === 'Open').length,
      packageRenewals: renewals.filter((item) => item.renewalType === 'Package').length,
      membershipRenewals: renewals.filter((item) => item.renewalType === 'Membership').length,
      vipAtRisk: vipRescue.length,
      pendingFollowUps: 8,
      pendingMessages: messages.filter((item) => ['Scheduled', 'Pending'].includes(item.status)).length,
      estimatedRevenue,
      urgentActions: [...rebooking, ...renewals, ...vipRescue].filter(
        (item) => ('riskScore' in item ? item.riskScore : item.priorityScore) >= 80,
      ).length,
      totalActions: rebooking.length + renewals.length + vipRescue.length,
    },
  }
}
