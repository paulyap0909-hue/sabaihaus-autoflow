import type { AppointmentStatus } from '../../types/appointments'
import type {
  AppointmentCompletionEventResult,
  CompleteAppointmentCommand,
} from '../../modules/appointments/eventEngine/types'
import { getSupabaseClient } from '../supabase/client'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
  type RepositoryListOptions,
} from './types'

export interface AppointmentRecord extends PersistedRecord {
  customerId: RepositoryId
  therapistId: RepositoryId | null
  serviceId: RepositoryId
  startsAt: string
  endsAt: string
  status: AppointmentStatus
  priceMinor: number
  customerPackageId: RepositoryId | null
  completedAt: string | null
}

export interface AppointmentStatusUpdate {
  status: AppointmentStatus
  completedAt?: string
}

export async function getAppointmentById(
  _context: RepositoryContext,
  _appointmentId: RepositoryId,
): Promise<AppointmentRecord | null> {
  return repositoryNotImplemented(
    'appointmentsRepository.getAppointmentById',
    _context,
    _appointmentId,
  )
}

export async function listAppointments(
  _context: RepositoryContext,
  _options: RepositoryListOptions = {},
): Promise<AppointmentRecord[]> {
  return repositoryNotImplemented(
    'appointmentsRepository.listAppointments',
    _context,
    _options,
  )
}

export async function updateAppointmentStatus(
  _context: RepositoryContext,
  _appointmentId: RepositoryId,
  _update: AppointmentStatusUpdate,
): Promise<AppointmentRecord> {
  return repositoryNotImplemented(
    'appointmentsRepository.updateAppointmentStatus',
    _context,
    _appointmentId,
    _update,
  )
}

interface AppointmentCompletionRpcResult {
  eventId: string
  appointmentId: string
  completedAt: string
  idempotencyKey: string
  idempotentReplay: boolean
  customer: AppointmentCompletionEventResult['customer']
  package: AppointmentCompletionEventResult['package']
  inventory: AppointmentCompletionEventResult['inventory']
  commission: AppointmentCompletionEventResult['commission']
  membership: AppointmentCompletionEventResult['membership']
  revenue: AppointmentCompletionEventResult['revenue']
  followUp: AppointmentCompletionEventResult['followUp']
  steps: AppointmentCompletionEventResult['steps']
}

export async function executeAppointmentCompletion(
  command: CompleteAppointmentCommand,
): Promise<AppointmentCompletionEventResult> {
  const { data, error } = await getSupabaseClient().rpc(
    'process_appointment_completion',
    {
      p_actor_id: command.actorId ?? null,
      p_appointment_id: command.appointmentId,
      p_branch_id: command.branchId,
      p_completed_at: command.completedAt,
      p_idempotency_key: command.idempotencyKey,
      p_organization_id: command.organizationId,
    },
  )

  if (error) {
    throw new Error(`Appointment completion failed: ${error.message}`)
  }

  if (!data || Array.isArray(data) || typeof data !== 'object') {
    throw new Error('Appointment completion returned an invalid event result.')
  }

  return data as unknown as AppointmentCompletionRpcResult
}
