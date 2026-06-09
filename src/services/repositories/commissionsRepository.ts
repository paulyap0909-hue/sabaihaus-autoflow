import type { CommissionStatus } from '../../types/commissions'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
} from './types'

export interface CommissionEntryRecord extends PersistedRecord {
  therapistId: RepositoryId
  appointmentId: RepositoryId | null
  commissionRuleId: RepositoryId | null
  sourceAmountMinor: number
  commissionAmountMinor: number
  status: CommissionStatus | 'Reversed'
  earnedAt: string
}

export interface CommissionEntryInput {
  therapistId: RepositoryId
  appointmentId: RepositoryId
  sourceAmountMinor: number
  earnedAt: string
}

export async function createCommissionEntry(
  _context: RepositoryContext,
  _input: CommissionEntryInput,
): Promise<CommissionEntryRecord> {
  return repositoryNotImplemented(
    'commissionsRepository.createCommissionEntry',
    _context,
    _input,
  )
}

export async function listCommissionEntriesForTherapist(
  _context: RepositoryContext,
  _therapistId: RepositoryId,
): Promise<CommissionEntryRecord[]> {
  return repositoryNotImplemented(
    'commissionsRepository.listCommissionEntriesForTherapist',
    _context,
    _therapistId,
  )
}
