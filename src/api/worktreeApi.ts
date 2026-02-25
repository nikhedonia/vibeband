import {
  createWorktree,
  removeWorktree,
  ensureMainWorktree,
  listWorktrees,
  getWorktreeDiffStats,
} from './client'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface WorktreeEntry {
  path: string
  branch: string
  added?: number
  deleted?: number
  changed?: number
}

export interface CreateWorktreeRequest {
  repoPath: string
  projectSlug: string
  branchSlug: string
}

export interface CreateWorktreeResponse {
  path: string
  created: boolean
}

export async function createWorktreeApi(req: CreateWorktreeRequest): Promise<CreateWorktreeResponse> {
  return createWorktree(req)
}

export interface RemoveWorktreeRequest {
  repoPath: string
  worktreePath: string
}

export interface RemoveWorktreeResponse {
  removed: boolean
}

export async function removeWorktreeApi(req: RemoveWorktreeRequest): Promise<RemoveWorktreeResponse> {
  return removeWorktree(req)
}

export interface EnsureMainWorktreeRequest {
  repoPath: string
  projectSlug: string
}

export interface EnsureMainWorktreeResponse {
  path: string
  created: boolean
  branch?: string
}

export async function ensureMainWorktreeApi(req: EnsureMainWorktreeRequest): Promise<EnsureMainWorktreeResponse> {
  return ensureMainWorktree(req)
}

export interface ListWorktreesRequest {
  repoPath: string
}

export interface ListWorktreesResponse {
  worktrees: WorktreeEntry[]
}

export async function listWorktreesApi(req: ListWorktreesRequest): Promise<ListWorktreesResponse> {
  return listWorktrees(req.repoPath)
}

export interface WorktreeDiffStatsRequest {
  worktreePath: string
  baseBranch?: string
}

export interface WorktreeDiffStatsResponse {
  added: number
  deleted: number
  changed: number
}

export async function getWorktreeDiffStatsApi(req: WorktreeDiffStatsRequest): Promise<WorktreeDiffStatsResponse> {
  return getWorktreeDiffStats(req)
}
