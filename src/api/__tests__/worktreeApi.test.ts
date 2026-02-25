import { describe, it, expect, vi, beforeEach } from 'vitest'
import { slugify } from '../../utils/slugify'

// ── Mock client functions so the API module works without a real server ────────

vi.mock('../client', () => ({
  createWorktree: vi.fn(),
  removeWorktree: vi.fn(),
  ensureMainWorktree: vi.fn(),
  listWorktrees: vi.fn(),
  getWorktreeDiffStats: vi.fn(),
}))

import {
  createWorktreeApi,
  removeWorktreeApi,
  ensureMainWorktreeApi,
  listWorktreesApi,
  getWorktreeDiffStatsApi,
} from '../worktreeApi'

import {
  createWorktree,
  removeWorktree,
  ensureMainWorktree,
  listWorktrees,
  getWorktreeDiffStats,
} from '../client'

const mockCreate = vi.mocked(createWorktree)
const mockRemove = vi.mocked(removeWorktree)
const mockEnsureMain = vi.mocked(ensureMainWorktree)
const mockList = vi.mocked(listWorktrees)
const mockDiffStats = vi.mocked(getWorktreeDiffStats)

// ── Slug helpers (also used to derive the worktrees map key) ──────────────────

describe('worktree slug helpers', () => {
  it('slugify converts spaces and symbols to hyphens', () => {
    expect(slugify('My Feature Ticket')).toBe('my-feature-ticket')
    expect(slugify('Fix: Auth/Login')).toBe('fix-auth-login')
  })

  it('slugify strips leading/trailing hyphens', () => {
    expect(slugify('  --hello--  ')).toBe('hello')
  })

  it('ticket branchSlug has the expected id-suffix form', () => {
    const title = 'Add OAuth login'
    const id = 42
    const branchSlug = `${slugify(title) || 'ticket'}-${id}`
    expect(branchSlug).toBe('add-oauth-login-42')
  })

  it('branchSlug falls back to "ticket-{id}" when title slugifies to empty', () => {
    const title = '!!!'
    const id = 7
    const branchSlug = `${slugify(title) || 'ticket'}-${id}`
    expect(branchSlug).toBe('ticket-7')
  })

  it('projectSlug includes the id suffix', () => {
    const name = 'My Project'
    const id = 3
    const projectSlug = `${slugify(name)}-${id}`
    expect(projectSlug).toBe('my-project-3')
  })

  it('worktree map key matches branchSlug computed at ticket-move time', () => {
    // Simulates how $boardId.tsx and KanbanBoard.tsx must agree
    const ticket = { id: 99, title: 'Implement dashboard' }

    // Key stored by refreshWorktrees (the path segment after /var/tmp/{projectSlug}/)
    const storedKey = `${slugify(ticket.title) || 'ticket'}-${ticket.id}`

    // Key used by KanbanBoard to look up the worktree
    const lookupKey = `${slugify(ticket.title) || 'ticket'}-${ticket.id}`

    expect(storedKey).toBe(lookupKey)
    expect(storedKey).toBe('implement-dashboard-99')
  })
})

// ── Typed API wrapper functions ───────────────────────────────────────────────

describe('createWorktreeApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forwards the request object to createWorktree server fn', async () => {
    mockCreate.mockResolvedValue({ path: '/var/tmp/proj-1/my-ticket-5', created: true })

    const result = await createWorktreeApi({
      repoPath: '/repos/proj',
      projectSlug: 'proj-1',
      branchSlug: 'my-ticket-5',
    })

    expect(mockCreate).toHaveBeenCalledWith({
      repoPath: '/repos/proj', projectSlug: 'proj-1', branchSlug: 'my-ticket-5',
    })
    expect(result).toEqual({ path: '/var/tmp/proj-1/my-ticket-5', created: true })
  })

  it('returns created: false when worktree already exists', async () => {
    mockCreate.mockResolvedValue({ path: '/var/tmp/proj-1/my-ticket-5', created: false })
    const result = await createWorktreeApi({
      repoPath: '/repos/proj',
      projectSlug: 'proj-1',
      branchSlug: 'my-ticket-5',
    })
    expect(result.created).toBe(false)
  })
})

describe('removeWorktreeApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forwards request to removeWorktree server fn', async () => {
    mockRemove.mockResolvedValue({ removed: true })

    const result = await removeWorktreeApi({
      repoPath: '/repos/proj',
      worktreePath: '/var/tmp/proj-1/done-ticket-3',
    })

    expect(mockRemove).toHaveBeenCalledWith({
      repoPath: '/repos/proj', worktreePath: '/var/tmp/proj-1/done-ticket-3',
    })
    expect(result.removed).toBe(true)
  })

  it('returns removed: false when path did not exist', async () => {
    mockRemove.mockResolvedValue({ removed: false })
    const result = await removeWorktreeApi({
      repoPath: '/repos/proj',
      worktreePath: '/var/tmp/proj-1/ghost',
    })
    expect(result.removed).toBe(false)
  })
})

describe('ensureMainWorktreeApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('forwards request to ensureMainWorktree server fn', async () => {
    mockEnsureMain.mockResolvedValue({ path: '/var/tmp/proj-1/main', created: true, branch: 'main' })

    const result = await ensureMainWorktreeApi({ repoPath: '/repos/proj', projectSlug: 'proj-1' })

    expect(mockEnsureMain).toHaveBeenCalledWith({
      repoPath: '/repos/proj', projectSlug: 'proj-1',
    })
    expect(result).toEqual({ path: '/var/tmp/proj-1/main', created: true, branch: 'main' })
  })
})

describe('listWorktreesApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns list of worktrees', async () => {
    const wts = [
      { path: '/var/tmp/proj-1/my-ticket-5', branch: 'my-ticket-5' },
      { path: '/var/tmp/proj-1/main', branch: 'main' },
    ]
    mockList.mockResolvedValue({ worktrees: wts })

    const result = await listWorktreesApi({ repoPath: '/repos/proj' })

    expect(mockList).toHaveBeenCalledWith('/repos/proj')
    expect(result.worktrees).toHaveLength(2)
  })
})

describe('getWorktreeDiffStatsApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns diff stats for a worktree', async () => {
    mockDiffStats.mockResolvedValue({ added: 10, deleted: 2, changed: 3 })

    const result = await getWorktreeDiffStatsApi({
      worktreePath: '/var/tmp/proj-1/my-ticket-5',
      baseBranch: 'main',
    })

    expect(mockDiffStats).toHaveBeenCalledWith({
      worktreePath: '/var/tmp/proj-1/my-ticket-5', baseBranch: 'main',
    })
    expect(result).toEqual({ added: 10, deleted: 2, changed: 3 })
  })

  it('uses undefined baseBranch when not provided (server defaults to "main")', async () => {
    mockDiffStats.mockResolvedValue({ added: 0, deleted: 0, changed: 0 })

    await getWorktreeDiffStatsApi({ worktreePath: '/var/tmp/proj-1/my-ticket-5' })

    expect(mockDiffStats).toHaveBeenCalledWith({
      worktreePath: '/var/tmp/proj-1/my-ticket-5', baseBranch: undefined,
    })
  })
})
