import type {
  AppointmentCompletionDependencies,
  AppointmentCompletionPlan,
  AppointmentCompletionStep,
  CompleteAppointmentCommand,
} from './types'

const defaultDependencies: AppointmentCompletionDependencies = {
  now: () => new Date().toISOString(),
}

function buildCompletionSteps(
  command: CompleteAppointmentCommand,
  plannedAt: string,
): AppointmentCompletionStep[] {
  return [
    {
      type: 'appointment.status.completed',
      required: true,
      description: 'Update the appointment status and completed timestamp.',
      input: {
        appointmentId: command.appointmentId,
        status: 'Completed',
        completedAt: command.completedAt,
      },
    },
    {
      type: 'appointment.event.created',
      required: true,
      description: 'Record an immutable appointment completion event.',
      input: {
        appointmentId: command.appointmentId,
        eventType: 'Completed',
        actorId: command.actorId,
        idempotencyKey: command.idempotencyKey,
        occurredAt: command.completedAt,
      },
    },
    {
      type: 'package.redemption.created',
      required: false,
      description: 'Redeem one session when a customer package funded the visit.',
      input: {
        appointmentId: command.appointmentId,
        customerPackageId: command.customerPackageId,
        sessionsRedeemed: command.customerPackageId ? 1 : 0,
      },
    },
    {
      type: 'commission.entry.created',
      required: true,
      description: 'Calculate commission from the completed appointment and active rule.',
      input: {
        appointmentId: command.appointmentId,
        therapistId: command.therapistId,
        sourceAmountMinor: command.priceMinor,
      },
    },
    {
      type: 'inventory.usage.deducted',
      required: true,
      description: 'Apply service usage rules and create inventory usage logs.',
      input: {
        appointmentId: command.appointmentId,
        serviceId: command.serviceId,
      },
    },
    {
      type: 'follow_up.task.created',
      required: true,
      description: 'Create an aftercare or rebooking follow-up task.',
      input: {
        appointmentId: command.appointmentId,
        customerId: command.customerId,
        taskType: 'Aftercare',
      },
    },
    {
      type: 'notification.queue.created',
      required: false,
      description: 'Queue the configured after-treatment notification.',
      input: {
        appointmentId: command.appointmentId,
        customerId: command.customerId,
        purpose: 'After-Treatment Care',
      },
    },
    {
      type: 'customer.visit.updated',
      required: true,
      description: 'Update customer visit history and lifetime value.',
      input: {
        customerId: command.customerId,
        appointmentId: command.appointmentId,
        revenueMinor: command.priceMinor,
        visitedAt: command.completedAt,
        plannedAt,
      },
    },
  ]
}

export async function completeAppointment(
  command: CompleteAppointmentCommand,
  dependencies: AppointmentCompletionDependencies = defaultDependencies,
): Promise<AppointmentCompletionPlan> {
  const plannedAt = dependencies.now()

  // TODO: Execute these steps inside a server-side transaction or database RPC.
  // TODO: Lock the appointment row and reject duplicate completion attempts.
  // TODO: Persist appointment_events using idempotencyKey before side effects.
  // TODO: Apply package, commission, inventory, follow-up, notification, and visit
  //       updates through repositories after their Supabase queries are implemented.
  return {
    command,
    status: 'planned',
    steps: buildCompletionSteps(command, plannedAt),
  }
}
