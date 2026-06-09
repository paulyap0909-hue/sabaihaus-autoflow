import type { AppointmentStatus } from '../../types/appointments'
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
