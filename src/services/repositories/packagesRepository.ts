import type { PackageStatus } from '../../types/packages'
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client'
import { resolveTenantContext } from '../tenant/tenantContext'
import {
  repositoryNotImplemented,
  type PersistedRecord,
  type RepositoryContext,
  type RepositoryId,
  readableRepositoryError,
  requireRepositoryRecord,
} from './types'

const FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export interface CreatePackageDefinitionInput {
  name: string
  service: string
  totalSessions: number
  price: number
  validityDays: number
  active: boolean
}

export interface PackageDefinitionRecord extends CreatePackageDefinitionInput {
  id: string
  organizationId: string
  branchId: string
}

async function createContext(): Promise<RepositoryContext> {
  const resolution = await resolveTenantContext()
  return resolution.context ?? {
    organizationId: FALLBACK_TENANT_ID,
    branchId: FALLBACK_TENANT_ID,
  }
}

export async function createPackageDefinition(
  input: CreatePackageDefinitionInput,
): Promise<PackageDefinitionRecord> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. This test action requires a live Supabase connection.',
    )
  }
  const context = await createContext()
  const { data, error } = await getSupabaseClient()
    .from('package_definitions')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      name: input.name.trim(),
      category: input.service.trim(),
      total_sessions: input.totalSessions,
      price_minor: Math.round(input.price * 100),
      validity_days: input.validityDays,
      active: input.active,
    })
    .select('id,organization_id,branch_id,name,category,total_sessions,price_minor,validity_days,active')
    .single()

  readableRepositoryError('Package definition creation', error)
  const record = requireRepositoryRecord(data, 'Package definition creation')

  return {
    id: String(record.id),
    organizationId: String(record.organization_id),
    branchId: String(record.branch_id),
    name: String(record.name),
    service: String(record.category ?? ''),
    totalSessions: Number(record.total_sessions),
    price: Number(record.price_minor) / 100,
    validityDays: Number(record.validity_days),
    active: Boolean(record.active),
  }
}

export async function listPackageDefinitions(): Promise<PackageDefinitionRecord[]> {
  if (!isSupabaseConfigured()) return []
  const context = await createContext()
  const { data, error } = await getSupabaseClient()
    .from('package_definitions')
    .select('id,organization_id,branch_id,name,category,total_sessions,price_minor,validity_days,active')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('created_at', { ascending: false })

  readableRepositoryError('Package definition loading', error)
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    branchId: String(row.branch_id),
    name: String(row.name),
    service: String(row.category ?? ''),
    totalSessions: Number(row.total_sessions),
    price: Number(row.price_minor) / 100,
    validityDays: Number(row.validity_days),
    active: Boolean(row.active),
  }))
}

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
