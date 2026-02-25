/**
 * Typed API module for worktree operations.
 *
 * All request/response shapes are defined here so both the client call-sites
 * and the server handlers share the same contract.
 */

import {
  createWorktree as _createWorktree,
  removeWorktree as _removeWorktree,
  ensureMainWorktree as _ensureMainWorktree,
  listWorktrees as _listWorktrees,
  getWorktreeDiffStats as _getWorktreeDiffStats,
} from '../db/worktree'

// ── Shared types ──────────────────────────────────────────────────────────────

export interface WorktreeEntry {
  /** Absolute filesystem path to the worktree */
  path: string
  /** Branch checked out in this worktree */
  branch: string
  /** Lines added vs the base branch */
  added?: number
  /** Lines deleted vs the base branch */
  deleted?: number
  /** Files changed vs the base branch */
  changed?: number
}

// ── create ────────────────────────────────────────────────────────────────────

export interface CreateWorktreeRequest {
  /** Absolute path to the bare/main git repo */
  repoPath: string
  /** Slug of the project (used to build the worktree base dir) */
  projectSlug: string
  /** Slug of the branch/ticket (used as the worktree sub-directory) */
  branchSlug: string
}

export interface CreateWorktreeResponse {
  /** Absolute path to the newly created (or pre-existing) worktree */
  path: string
  /** Whether a new worktree was actually created (false = already existed) */
  created: boolean
}

export async function createWorktreeApi(
  req: CreateWorktreeRequest,
): Promise<CreateWorktreeResponse> {
  return _createWorktree({ data: req })
}

// ── remove ────────────────────────────────────────────────────────────────────

export interface RemoveWorktreeRequest {
  /** Absolute path to the bare/main git repo */
  repoPath: string
  /** Absolute path to the worktree to remove */
  worktreePath: string
}

export interface RemoveWorktreeResponse {
  /** Whether a worktree was actually removed (false = did not exist) */
  removed: boolean
}

export async function removeWorktreeApi(
  req: RemoveWorktreeRequest,
): Promise<RemoveWorktreeResponse> {
  return _removeWorktree({ data: req })
}

// ── ensure main ───────────────────────────────────────────────────────────────

export interface EnsureMainWorktreeRequest {
  /** Absolute path to the bare/main git repo */
  repoPath: string
  /** Slug of the project (used to build the worktree base dir) */
  projectSlug: string
}

export interface EnsureMainWorktreeResponse {
  /** Absolute path to the main worktree */
  path: string
  /** Whether a new worktree was created */
  created: boolean
  /** Branch name that was checked out */
  branch?: string
}

export async function ensureMainWorktreeApi(
  req: EnsureMainWorktreeRequest,
): Promise<EnsureMainWorktreeResponse> {
  return _ensureMainWorktree({ data: req })
}

// ── list ──────────────────────────────────────────────────────────────────────

export interface ListWorktreesRequest {
  /** Absolute path to the bare/main git repo */
  repoPath: string
}

export interface ListWorktreesResponse {
  worktrees: WorktreeEntry[]
}

export async function listWorktreesApi(
  req: ListWorktreesRequest,
): Promise<ListWorktreesResponse> {
  return _listWorktrees({ data: req })
}

// ── diff stats ────────────────────────────────────────────────────────────────

export interface WorktreeDiffStatsRequest {
  /** Absolute path to the worktree directory */
  worktreePath: string
  /** Branch to diff against (defaults to "main") */
  baseBranch?: string
}

export interface WorktreeDiffStatsResponse {
  added: number
  deleted: number
  changed: number
}

export async function getWorktreeDiffStatsApi(
  req: WorktreeDiffStatsRequest,
): Promise<WorktreeDiffStatsResponse> {
  return _getWorktreeDiffStats({ data: req })
}
