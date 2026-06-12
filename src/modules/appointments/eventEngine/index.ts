export { completeAppointment } from './completeAppointment'
export {
  appointmentStatuses,
  assertAppointmentTransition,
  canTransitionAppointment,
} from './statusWorkflow'
export type {
  AppointmentCompletionDependencies,
  AppointmentCompletionEventResult,
  AppointmentCompletionStepResult,
  AppointmentCompletionStepType,
  CompleteAppointmentCommand,
} from './types'
