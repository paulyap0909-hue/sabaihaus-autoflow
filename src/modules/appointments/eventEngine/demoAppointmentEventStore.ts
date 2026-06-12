import type {
  AppointmentCompletionEventResult,
  AppointmentCompletionStepResult,
  CompleteAppointmentCommand,
} from './types'

export interface AppointmentEventMetrics {
  completedAppointments: number
  packageRedemptions: number
  inventoryConsumed: number
  commissionGeneratedMinor: number
  followUpsCreated: number
}

const completedCommands = new Map<string, AppointmentCompletionEventResult>()
const listeners = new Set<() => void>()

let metrics: AppointmentEventMetrics = {
  completedAppointments: 1,
  packageRedemptions: 1,
  inventoryConsumed: 3,
  commissionGeneratedMinor: 2200,
  followUpsCreated: 1,
}

function publishMetrics(result: AppointmentCompletionEventResult) {
  metrics = {
    completedAppointments: metrics.completedAppointments + 1,
    packageRedemptions:
      metrics.packageRedemptions + result.package.redemptionsCreated,
    inventoryConsumed:
      metrics.inventoryConsumed + result.inventory.quantityConsumed,
    commissionGeneratedMinor:
      metrics.commissionGeneratedMinor + result.commission.amountMinor,
    followUpsCreated: metrics.followUpsCreated + result.followUp.tasksCreated,
  }
  listeners.forEach((listener) => listener())
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
}

function getMembershipTier(totalSpentMinor: number): string {
  if (totalSpentMinor >= 2_000_000) return 'Diamond'
  if (totalSpentMinor >= 1_000_000) return 'Platinum'
  if (totalSpentMinor >= 500_000) return 'Gold'
  return 'Silver'
}

export async function executeDemoAppointmentCompletion(
  command: CompleteAppointmentCommand,
): Promise<AppointmentCompletionEventResult> {
  const existing = completedCommands.get(command.idempotencyKey)

  if (existing) {
    return { ...existing, idempotentReplay: true }
  }

  const packageRedemptions = command.customerPackageId ? 1 : 0
  const remainingSessions = command.customerPackageId ? 3 : null
  const quantityConsumed = command.serviceId.includes('head-spa') ? 2.25 : 3
  const commissionAmountMinor = Math.round(command.priceMinor * 0.1)
  const totalSpentMinor = 650_000 + command.priceMinor
  const followUpDueAt = addDays(command.completedAt, 30)

  const steps: AppointmentCompletionStepResult[] = [
    {
      type: 'appointment.status.completed',
      status: 'completed',
      recordsCreated: 0,
      message: 'Appointment marked Completed.',
    },
    {
      type: 'customer.statistics.updated',
      status: 'completed',
      recordsCreated: 0,
      amountMinor: command.priceMinor,
      message: 'Customer visit and spending totals updated.',
    },
    {
      type: 'package.redemption.created',
      status: packageRedemptions ? 'completed' : 'skipped',
      recordsCreated: packageRedemptions,
      message: packageRedemptions
        ? 'One package session redeemed.'
        : 'Appointment was not funded by a package.',
    },
    {
      type: 'inventory.usage.deducted',
      status: 'completed',
      recordsCreated: 3,
      quantity: quantityConsumed,
      message: 'Linked consumables deducted and movements recorded.',
    },
    {
      type: 'commission.entry.created',
      status: 'completed',
      recordsCreated: 1,
      amountMinor: commissionAmountMinor,
      message: 'Therapist commission calculated at the active demo rate.',
    },
    {
      type: 'membership.tier.recalculated',
      status: 'completed',
      recordsCreated: 1,
      message: 'Membership tier recalculated from lifetime spend.',
    },
    {
      type: 'revenue.record.created',
      status: 'completed',
      recordsCreated: 1,
      amountMinor: command.priceMinor,
      message: 'Appointment revenue recognized.',
    },
    {
      type: 'follow_up.task.created',
      status: 'completed',
      recordsCreated: 1,
      message: 'Rebooking follow-up scheduled for 30 days later.',
    },
    {
      type: 'appointment.event.created',
      status: 'completed',
      recordsCreated: 1,
      message: 'Completion audit event recorded.',
    },
  ]

  const result: AppointmentCompletionEventResult = {
    eventId: `EVT-${command.appointmentId}`,
    appointmentId: command.appointmentId,
    completedAt: command.completedAt,
    idempotencyKey: command.idempotencyKey,
    idempotentReplay: false,
    customer: {
      totalVisits: 8,
      totalSpentMinor,
      lastVisitAt: command.completedAt,
    },
    package: {
      redemptionsCreated: packageRedemptions,
      remainingSessions,
    },
    inventory: {
      movementsCreated: 3,
      quantityConsumed,
    },
    commission: {
      entriesCreated: 1,
      amountMinor: commissionAmountMinor,
    },
    membership: {
      membershipsUpdated: 1,
      tier: getMembershipTier(totalSpentMinor),
    },
    revenue: {
      recordsCreated: 1,
      amountMinor: command.priceMinor,
    },
    followUp: {
      tasksCreated: 1,
      dueAt: followUpDueAt,
    },
    steps,
  }

  completedCommands.set(command.idempotencyKey, result)
  publishMetrics(result)
  return result
}

export function getAppointmentEventMetrics(): AppointmentEventMetrics {
  return metrics
}

export function subscribeToAppointmentEventMetrics(
  listener: () => void,
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
