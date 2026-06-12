import { executeAppointmentCompletion } from '../../../services/repositories/appointmentsRepository'
import type {
  AppointmentCompletionDependencies,
  AppointmentCompletionEventResult,
  CompleteAppointmentCommand,
} from './types'

const defaultDependencies: AppointmentCompletionDependencies = {
  executeCompletion: executeAppointmentCompletion,
}

function validateCommand(command: CompleteAppointmentCommand) {
  if (!command.idempotencyKey.trim()) {
    throw new Error('Appointment completion requires an idempotency key.')
  }

  if (command.priceMinor < 0 || !Number.isInteger(command.priceMinor)) {
    throw new Error('Appointment amount must be a non-negative integer.')
  }

  if (Number.isNaN(Date.parse(command.completedAt))) {
    throw new Error('Appointment completion requires a valid completedAt value.')
  }
}

export async function completeAppointment(
  command: CompleteAppointmentCommand,
  dependencies: AppointmentCompletionDependencies = defaultDependencies,
): Promise<AppointmentCompletionEventResult> {
  validateCommand(command)
  return dependencies.executeCompletion(command)
}
