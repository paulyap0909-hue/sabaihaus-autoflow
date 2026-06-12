export type AppointmentCompletionStepType =
  | 'appointment.status.completed'
  | 'customer.statistics.updated'
  | 'package.redemption.created'
  | 'inventory.usage.deducted'
  | 'commission.entry.created'
  | 'membership.tier.recalculated'
  | 'revenue.record.created'
  | 'follow_up.task.created'
  | 'appointment.event.created'

export interface CompleteAppointmentCommand {
  organizationId: string
  branchId: string
  appointmentId: string
  customerId: string
  therapistId: string
  serviceId: string
  customerPackageId?: string
  completedAt: string
  priceMinor: number
  actorId?: string
  idempotencyKey: string
}

export interface AppointmentCompletionStepResult {
  type: AppointmentCompletionStepType
  status: 'completed' | 'skipped'
  recordsCreated: number
  amountMinor?: number
  quantity?: number
  message: string
}

export interface AppointmentCompletionEventResult {
  eventId: string
  appointmentId: string
  completedAt: string
  idempotencyKey: string
  idempotentReplay: boolean
  customer: {
    totalVisits: number
    totalSpentMinor: number
    lastVisitAt: string
  }
  package: {
    redemptionsCreated: number
    remainingSessions: number | null
  }
  inventory: {
    movementsCreated: number
    quantityConsumed: number
  }
  commission: {
    entriesCreated: number
    amountMinor: number
  }
  membership: {
    membershipsUpdated: number
    tier: string | null
  }
  revenue: {
    recordsCreated: number
    amountMinor: number
  }
  followUp: {
    tasksCreated: number
    dueAt: string
  }
  steps: AppointmentCompletionStepResult[]
}

export interface AppointmentCompletionDependencies {
  executeCompletion: (
    command: CompleteAppointmentCommand,
  ) => Promise<AppointmentCompletionEventResult>
}
