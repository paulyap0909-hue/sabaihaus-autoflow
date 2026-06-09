import type { StockStatus } from '../../types/inventory'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
} from './types'

export interface InventoryItemRecord extends PersistedRecord {
  name: string
  currentStock: number
  unit: string
  status: StockStatus
}

export interface InventoryUsageInput {
  appointmentId: RepositoryId
  serviceId: RepositoryId
  usedAt: string
}

export interface InventoryUsageResult {
  logsCreated: number
  inventoryItemIds: RepositoryId[]
}

export async function getInventoryItemById(
  _context: RepositoryContext,
  _inventoryItemId: RepositoryId,
): Promise<InventoryItemRecord | null> {
  return repositoryNotImplemented(
    'inventoryRepository.getInventoryItemById',
    _context,
    _inventoryItemId,
  )
}

export async function applyServiceUsageRules(
  _context: RepositoryContext,
  _input: InventoryUsageInput,
): Promise<InventoryUsageResult> {
  return repositoryNotImplemented(
    'inventoryRepository.applyServiceUsageRules',
    _context,
    _input,
  )
}
