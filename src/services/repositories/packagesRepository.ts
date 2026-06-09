import type { PackageStatus } from '../../types/packages'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
} from './types'

export interface CustomerPackageRecord extends PersistedRecord {
  customerId: RepositoryId
  packageDefinitionId: RepositoryId
  totalSessions: number
  remainingSessions: number
  status: PackageStatus | 'Fully Used'
  expiresAt: string
}

export interface PackageRedemptionInput {
  customerPackageId: RepositoryId
  appointmentId: RepositoryId
  sessionsRedeemed: number
  redeemedAt: string
}

export async function getCustomerPackageById(
  _context: RepositoryContext,
  _customerPackageId: RepositoryId,
): Promise<CustomerPackageRecord | null> {
  return repositoryNotImplemented(
    'packagesRepository.getCustomerPackageById',
    _context,
    _customerPackageId,
  )
}

export async function redeemPackageSession(
  _context: RepositoryContext,
  _input: PackageRedemptionInput,
): Promise<CustomerPackageRecord> {
  return repositoryNotImplemented(
    'packagesRepository.redeemPackageSession',
    _context,
    _input,
  )
}
