import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client'
import type { RepositoryContext } from '../repositories/types'

export type TenantResolutionMode =
  | 'Authenticated JWT'
  | 'User metadata'
  | 'Operational data'
  | 'Environment compatibility'
  | 'Unavailable'

export interface TenantContextResolution {
  context: RepositoryContext | null
  organizationId: string | null
  branchId: string | null
  mode: TenantResolutionMode
  missingFields: Array<'organization' | 'branch'>
  sourceTable?: string
}

interface TenantCandidate {
  organizationId: string | null
  branchId: string | null
}

const tenantTables = [
  'customers',
  'appointments',
  'customer_packages',
  'customer_memberships',
] as const

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null
}

function resolution(
  candidate: TenantCandidate,
  mode: TenantResolutionMode,
  sourceTable?: string,
): TenantContextResolution {
  const missingFields: TenantContextResolution['missingFields'] = []
  if (!candidate.organizationId) missingFields.push('organization')
  if (!candidate.branchId) missingFields.push('branch')

  return {
    context:
      candidate.organizationId && candidate.branchId
        ? {
            organizationId: candidate.organizationId,
            branchId: candidate.branchId,
          }
        : null,
    organizationId: candidate.organizationId,
    branchId: candidate.branchId,
    mode,
    missingFields,
    sourceTable,
  }
}

async function resolveFromAuth(): Promise<TenantContextResolution | null> {
  const client = getSupabaseClient()
  const {
    data: { session },
  } = await client.auth.getSession()
  const claims = session?.user.app_metadata ?? {}
  const metadata = session?.user.user_metadata ?? {}
  const jwtCandidate = {
    organizationId: text(claims.organization_id),
    branchId: text(claims.branch_id),
  }

  if (jwtCandidate.organizationId || jwtCandidate.branchId) {
    return resolution(jwtCandidate, 'Authenticated JWT')
  }

  const metadataCandidate = {
    organizationId: text(metadata.organization_id),
    branchId: text(metadata.branch_id),
  }
  if (metadataCandidate.organizationId || metadataCandidate.branchId) {
    return resolution(metadataCandidate, 'User metadata')
  }

  return null
}

async function resolveFromOperationalData(): Promise<TenantContextResolution | null> {
  const client = getSupabaseClient()
  let partial: TenantContextResolution | null = null

  for (const table of tenantTables) {
    const { data, error } = await client
      .from(table)
      .select('organization_id,branch_id')
      .limit(1)
      .maybeSingle()

    if (error || !data) continue

    const candidate = {
      organizationId: text(data.organization_id),
      branchId: text(data.branch_id),
    }
    const next = resolution(candidate, 'Operational data', table)
    if (next.context) return next
    partial ??= next
  }

  return partial
}

export async function resolveTenantContext(): Promise<TenantContextResolution> {
  if (!isSupabaseConfigured()) {
    return resolution(
      { organizationId: null, branchId: null },
      'Unavailable',
    )
  }

  const authResolution = await resolveFromAuth()
  if (authResolution?.context) return authResolution

  const operationalResolution = await resolveFromOperationalData()
  if (operationalResolution?.context) return operationalResolution

  const environmentResolution = resolution(
    {
      organizationId: text(import.meta.env.VITE_SUPABASE_ORGANIZATION_ID),
      branchId: text(import.meta.env.VITE_SUPABASE_BRANCH_ID),
    },
    'Environment compatibility',
  )
  if (
    environmentResolution.context ||
    environmentResolution.missingFields.length < 2
  ) {
    return environmentResolution
  }

  return (
    authResolution ??
    operationalResolution ??
    resolution(
      { organizationId: null, branchId: null },
      'Unavailable',
    )
  )
}
