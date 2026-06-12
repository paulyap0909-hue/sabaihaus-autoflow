import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client'
import { resolveTenantContext } from '../tenant/tenantContext'
import type { RepositoryContext } from './types'
import { readableRepositoryError, requireRepositoryRecord } from './types'

const FALLBACK_TENANT_ID = '00000000-0000-0000-0000-000000000001'

export type MembershipPlanTier =
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'

export interface CreateMembershipPlanInput {
  name: string
  tier: MembershipPlanTier
  price: number
  durationDays: number
  benefits: string[]
  active: boolean
}

export interface MembershipPlanRecord extends CreateMembershipPlanInput {
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

export async function createMembershipPlan(
  input: CreateMembershipPlanInput,
): Promise<MembershipPlanRecord> {
  ensureConfigured()
  const context = await createContext()
  const { data, error } = await getSupabaseClient()
    .from('membership_plans')
    .insert({
      organization_id: context.organizationId,
      branch_id: context.branchId,
      name: input.name.trim(),
      tier: input.tier,
      price_minor: Math.round(input.price * 100),
      billing_interval: 'Monthly',
      benefits: input.benefits,
      active: input.active,
    })
    .select('id,organization_id,branch_id,name,tier,price_minor,benefits,active')
    .single()

  readableRepositoryError('Membership plan creation', error)
  const record = requireRepositoryRecord(data, 'Membership plan creation')

  return {
    id: String(record.id),
    organizationId: String(record.organization_id),
    branchId: String(record.branch_id),
    name: String(record.name),
    tier: record.tier as MembershipPlanTier,
    price: Number(record.price_minor) / 100,
    durationDays: input.durationDays,
    benefits: Array.isArray(record.benefits) ? record.benefits.map(String) : [],
    active: Boolean(record.active),
  }
}

export async function listMembershipPlans(): Promise<MembershipPlanRecord[]> {
  if (!isSupabaseConfigured()) return []
  const context = await createContext()
  const { data, error } = await getSupabaseClient()
    .from('membership_plans')
    .select('id,organization_id,branch_id,name,tier,price_minor,benefits,active')
    .eq('organization_id', context.organizationId)
    .eq('branch_id', context.branchId)
    .order('created_at', { ascending: false })

  readableRepositoryError('Membership plan loading', error)
  return (data ?? []).map((row) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    branchId: String(row.branch_id),
    name: String(row.name),
    tier: row.tier as MembershipPlanTier,
    price: Number(row.price_minor) / 100,
    durationDays: 0,
    benefits: Array.isArray(row.benefits) ? row.benefits.map(String) : [],
    active: Boolean(row.active),
  }))
}
