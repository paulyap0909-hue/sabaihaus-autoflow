import type { RetentionStatus } from '../../types/customers'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
  type RepositoryListOptions,
} from './types'

export interface CustomerRecord extends PersistedRecord {
  fullName: string
  phone: string
  email: string | null
  retentionStatus: RetentionStatus
  lastVisitAt: string | null
  lifetimeValueMinor: number
}

export interface CustomerVisitUpdate {
  appointmentId: RepositoryId
  visitedAt: string
  revenueMinor: number
}

export async function getCustomerById(
  _context: RepositoryContext,
  _customerId: RepositoryId,
): Promise<CustomerRecord | null> {
  return repositoryNotImplemented(
    'customersRepository.getCustomerById',
    _context,
    _customerId,
  )
}

export async function listCustomers(
  _context: RepositoryContext,
  _options: RepositoryListOptions = {},
): Promise<CustomerRecord[]> {
  return repositoryNotImplemented(
    'customersRepository.listCustomers',
    _context,
    _options,
  )
}

export async function recordCustomerVisit(
  _context: RepositoryContext,
  _customerId: RepositoryId,
  _visit: CustomerVisitUpdate,
): Promise<CustomerRecord> {
  return repositoryNotImplemented(
    'customersRepository.recordCustomerVisit',
    _context,
    _customerId,
    _visit,
  )
}
