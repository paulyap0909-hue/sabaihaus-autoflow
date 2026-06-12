import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client'
import { resolveTenantContext } from '../tenant/tenantContext'
import type { RepositoryContext } from './types'
import { readableRepositoryError, requireRepositoryRecord } from './types'

const FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export type TherapistStatus = 'Active' | 'Inactive' | 'On Leave'

export interface CreateTherapistInput {
  fullName: string
  phone: string
  email: string
  roleTitle: string
  specialties: string[]
  rating: number
  status: TherapistStatus
}

export interface TherapistRecord extends CreateTherapistInput {
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

function ensureConfigured() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. This test action requires a live Supabase connection.',
    )
  }
}

export async function createTherapist(
  input: CreateTherapistInput,
): Promise<TherapistRecord> {
  ensureConfigured()
  const context = await createContext()
  const { data, error } = await getSupabaseClient()
    .from('therapists')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      full_name: input.fullName.trim(),
      role_title: input.roleTitle.trim(),
      specialties: input.specialties,
      rating: input.rating,
      status: input.status,
    })
    .select('id,organization_id,branch_id,full_name,role_title,specialties,rating,status')
    .single()

  readableRepositoryError('Therapist creation', error)
  const record = requireRepositoryRecord(data, 'Therapist creation')

  return {
    id: String(record.id),
    organizationId: String(record.organization_id),
    branchId: String(record.branch_id),
    fullName: String(record.full_name),
    phone: input.phone,
    email: input.email,
    roleTitle: String(record.role_title ?? ''),
    specialties: Array.isArray(record.specialties) ? record.specialties.map(String) : [],
    rating: Number(record.rating ?? 0),
    status: record.status as TherapistStatus,
  }
}

export async function listTherapists(): Promise<TherapistRecord[]> {
  if (!isSupabaseConfigured()) return []
  const context = await createContext()
  const { data, error } = await getSupabaseClient()
    .from('therapists')
    .select('id,organization_id,branch_id,full_name,role_title,specialties,rating,status')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('created_at', { ascending: false })

  readableRepositoryError('Therapist loading', error)
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    branchId: String(row.branch_id),
    fullName: String(row.full_name),
    phone: '',
    email: '',
    roleTitle: String(row.role_title ?? ''),
    specialties: Array.isArray(row.specialties) ? row.specialties.map(String) : [],
    rating: Number(row.rating ?? 0),
    status: row.status as TherapistStatus,
  }))
}
