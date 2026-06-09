export type AppointmentCompletionStepType =
  | 'appointment.status.completed'
  | 'appointment.event.created'
  | 'package.redemption.created'
  | 'commission.entry.created'
  | 'inventory.usage.deducted'
  | 'follow_up.task.created'
  | 'notification.queue.created'
  | 'customer.visit.updated'

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

export interface AppointmentCompletionStep {
  type: AppointmentCompletionStepType
  required: boolean
  description: string
  input: Record<string, string | number | boolean | undefined>
}

export interface AppointmentCompletionPlan {
  command: CompleteAppointmentCommand
  status: 'planned'
  steps: AppointmentCompletionStep[]
}

export interface AppointmentCompletionDependencies {
  now: () => string
}
