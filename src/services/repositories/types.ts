export type RepositoryId = string

export interface RepositoryContext {
  organizationId: RepositoryId
  branchId: RepositoryId
}

export interface RepositoryListOptions {
  limit?: number
  offset?: number
}

export interface PersistedRecord {
  id: RepositoryId
  organizationId: RepositoryId
  branchId: RepositoryId
  createdAt: string
  updatedAt: string
}

export function repositoryNotImplemented(
  operation: string,
  ...contractInputs: unknown[]
): never {
  void contractInputs
  throw new Error(
    `${operation} is not implemented. Phase 4 defines repository contracts only.`,
  )
}

export function readableRepositoryError(
  operation: string,
  error: { message: string; code?: string } | null,
) {
  if (!error) return
  const message = error.message.toLowerCase()

  if (
    error.code === '42501' ||
    message.includes('row-level security') ||
    message.includes('permission denied')
  ) {
    throw new Error(
      `${operation} was blocked by tenant security. Confirm migration 007 is applied and the organization/branch scope matches.`,
    )
  }
  if (
    error.code === '42703' ||
    message.includes('column') && message.includes('does not exist')
  ) {
    throw new Error(
      `${operation} failed because the frontend and database schema do not match.`,
    )
  }
  if (
    error.code === '23514' ||
    message.includes('check constraint')
  ) {
    throw new Error(
      `${operation} contains an invalid status, tier, or numeric value.`,
    )
  }
  if (
    message.includes('organization') ||
    message.includes('branch') ||
    message.includes('not-null constraint')
  ) {
    throw new Error(
      `${operation} requires a valid organization and branch.`,
    )
  }

  throw new Error(`${operation} failed: ${error.message}`)
}

export function requireRepositoryRecord<T>(
  data: T | null,
  operation: string,
): T {
  if (data === null) {
    throw new Error(`${operation} completed but returned no record.`)
  }
  return data
}
