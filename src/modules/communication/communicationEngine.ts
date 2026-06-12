import { appointments, customers } from '../../services/mockOperations'
import { customerPackages, memberships, membershipTiers } from '../../services/mockPhase3'
import type {
  CustomerTimelineEvent,
  RebookingOpportunity,
  RenewalOpportunity,
} from '../../types/communication'

const DAY_MS = 86_400_000
const today = new Date('2026-06-12T09:00:00+08:00')

function addDays(value: string, days: number) {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysUntil(value: string) {
  return Math.ceil(
    (new Date(`${value}T23:59:59+08:00`).getTime() - today.getTime()) / DAY_MS,
  )
}

export function generateRebookingOpportunities(): RebookingOpportunity[] {
  return appointments
    .filter((appointment) => appointment.status === 'Completed')
    .filter(
      (appointment) =>
        !appointments.some(
          (future) =>
            future.customer === appointment.customer &&
            new Date(`${future.date}T${future.time}:00+08:00`) > today &&
            !['Cancelled', 'No Show'].includes(future.status),
        ),
    )
    .map((appointment) => {
      const customer = customers.find(
        (item) => item.name === appointment.customer,
      )
      const daysSinceCompletion = Math.max(
        0,
        Math.floor(
          (today.getTime() -
            new Date(`${appointment.date}T${appointment.time}:00+08:00`).getTime()) /
            DAY_MS,
        ),
      )
      return {
        id: `RB-${appointment.id}`,
        customer: appointment.customer,
        appointmentId: appointment.id,
        completedAt: appointment.date,
        therapist: appointment.therapist,
        service: appointment.service,
        priorityScore: Math.min(
          100,
          45 +
            daysSinceCompletion +
            (customer?.retentionStatus === 'VIP' ? 20 : 0) +
            (customer?.packageBalance ? 10 : 0),
        ),
        suggestedDate: addDays(appointment.date, 30),
        reason: 'Completed treatment with no future appointment booked.',
      }
    })
    .sort((first, second) => second.priorityScore - first.priorityScore)
}

export function generateRenewalOpportunities(): RenewalOpportunity[] {
  const packageOpportunities: RenewalOpportunity[] = customerPackages
    .filter(
      (item) =>
        item.remainingSessions <= 2 &&
        !['Expired'].includes(item.status),
    )
    .map((item) => {
      const usedValue =
        item.totalSessions > 0
          ? item.valueRemaining / Math.max(1, item.remainingSessions)
          : 0
      return {
        id: `RN-${item.id}`,
        customer: item.customer,
        type: 'Package',
        itemName: item.packageName,
        dueDate: item.expires,
        remainingSessions: item.remainingSessions,
        expectedRevenue: Math.round(usedValue * item.totalSessions),
        priorityScore: Math.min(
          100,
          60 + (2 - item.remainingSessions) * 15 + (daysUntil(item.expires) <= 30 ? 15 : 0),
        ),
      }
    })

  const membershipOpportunities: RenewalOpportunity[] = memberships
    .filter((item) => daysUntil(item.renews) <= 30)
    .map((item) => ({
      id: `RN-${item.id}`,
      customer: item.customer,
      type: 'Membership',
      itemName: `${item.tier} Membership`,
      dueDate: item.renews,
      expectedRevenue:
        membershipTiers.find((tier) => tier.tier === item.tier)?.monthlyPrice ??
        0,
      priorityScore: Math.min(
        100,
        65 +
          (item.status === 'Renewal Due' ? 20 : 0) +
          Math.max(0, 15 - daysUntil(item.renews)),
      ),
    }))

  return [...packageOpportunities, ...membershipOpportunities].sort(
    (first, second) => second.priorityScore - first.priorityScore,
  )
}

export function buildCustomerTimeline(
  customerName: string,
): CustomerTimelineEvent[] {
  const customer = customers.find((item) => item.name === customerName)
  const events: CustomerTimelineEvent[] = []

  customer?.visits.forEach((visit, index) => {
    events.push({
      id: `visit-${customer.id}-${index}`,
      type: 'Appointment',
      occurredAt: visit.date,
      title: visit.service,
      detail: `${visit.therapist} · RM ${visit.amount}`,
      status: 'Completed',
    })
  })

  customerPackages
    .filter((item) => item.customer === customerName)
    .flatMap((item) =>
      item.redemptions.map((redemption) => ({
        id: `redemption-${redemption.appointmentId}`,
        type: 'Package Redemption' as const,
        occurredAt: redemption.date,
        title: `${item.packageName} redeemed`,
        detail: `${redemption.service} with ${redemption.therapist}`,
        status: `${item.remainingSessions} sessions remaining`,
      })),
    )
    .forEach((event) => events.push(event))

  memberships
    .filter((item) => item.customer === customerName)
    .forEach((membership) => {
      events.push({
        id: `membership-${membership.id}`,
        type: 'Membership Event',
        occurredAt: membership.joined,
        title: `${membership.tier} membership started`,
        detail: `Next renewal ${membership.renews}`,
        status: membership.status,
      })
    })

  if (customer) {
    events.push(
      {
        id: `message-${customer.id}`,
        type: 'Message',
        occurredAt: '2026-06-11T16:30:00+08:00',
        title: 'WhatsApp wellness follow-up',
        detail: customer.nextAction,
        status: 'Sent',
      },
      {
        id: `followup-${customer.id}`,
        type: 'Follow Up',
        occurredAt: '2026-06-12T09:00:00+08:00',
        title: 'Relationship follow-up',
        detail: customer.followUpNotes,
        status: customer.retentionStatus,
      },
      {
        id: `note-${customer.id}`,
        type: 'Note',
        occurredAt: customer.lastVisit,
        title: 'Wellness note',
        detail: customer.wellnessSummary,
      },
    )
  }

  return events.sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  )
}
