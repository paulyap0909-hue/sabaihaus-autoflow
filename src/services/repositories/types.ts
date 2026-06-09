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
