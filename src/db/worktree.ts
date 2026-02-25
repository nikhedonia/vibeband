import { createServerFn } from '@tanstack/react-start'
import { execSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

const IGNORE = new Set([
  '.git',
  'node_modules',
  '__pycache__',
  '.next',
  'dist',
  'build',
  '.DS_Store',
])

function listFilesRecursive(
  dirPath: string,
  relPath = '',
  depth = 0,
): FileNode[] {
  if (depth > 5) return []
  try {
    return readdirSync(dirPath)
      .filter((name) => !IGNORE.has(name) && !name.startsWith('.'))
      .sort((a, b) => {
        // dirs first
        const aIsDir = statSync(path.join(dirPath, a)).isDirectory()
        const bIsDir = statSync(path.join(dirPath, b)).isDirectory()
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
        return a.localeCompare(b)
      })
      .map((name) => {
        const fullPath = path.join(dirPath, name)
        const rel = relPath ? `${relPath}/${name}` : name
        try {
          const stat = statSync(fullPath)
          if (stat.isDirectory()) {
            return {
              name,
              path: rel,
              type: 'dir' as const,
              children: listFilesRecursive(fullPath, rel, depth + 1),
            }
          }
          return { name, path: rel, type: 'file' as const }
        } catch {
          return null
        }
      })
      .filter(Boolean) as FileNode[]
  } catch {
    return []
  }
}

// ── Worktree operations ───────────────────────────────────────────────────────

export const createWorktree = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { repoPath: string; projectSlug: string; branchSlug: string }) =>
      data,
  )
  .handler(async ({ data }) => {
    const { repoPath, projectSlug, branchSlug } = data
    const worktreeBase = `/var/tmp/${projectSlug}`
    const worktreePath = `${worktreeBase}/${branchSlug}`

    if (!existsSync(repoPath)) {
      throw new Error(`Repo not found: ${repoPath}`)
    }

    mkdirSync(worktreeBase, { recursive: true })

    if (existsSync(worktreePath)) {
      return { path: worktreePath, created: false }
    }

    try {
      execSync(
        `git -C "${repoPath}" worktree add "${worktreePath}" -b "${branchSlug}"`,
        { stdio: 'pipe' },
      )
    } catch {
      try {
        // Branch might already exist — just check it out
        execSync(
          `git -C "${repoPath}" worktree add "${worktreePath}" "${branchSlug}"`,
          { stdio: 'pipe' },
        )
      } catch (e2) {
        throw new Error(`Failed to create worktree: ${e2}`)
      }
    }

    return { path: worktreePath, created: true }
  })

export const removeWorktree = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { repoPath: string; worktreePath: string }) => data,
  )
  .handler(async ({ data }) => {
    const { repoPath, worktreePath } = data

    if (!existsSync(worktreePath)) {
      return { removed: false }
    }

    try {
      execSync(
        `git -C "${repoPath}" worktree remove --force "${worktreePath}"`,
        { stdio: 'pipe' },
      )
      return { removed: true }
    } catch (e) {
      throw new Error(`Failed to remove worktree: ${e}`)
    }
  })

export const ensureMainWorktree = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { repoPath: string; projectSlug: string }) => data,
  )
  .handler(async ({ data }) => {
    const { repoPath, projectSlug } = data
    const worktreePath = `/var/tmp/${projectSlug}/main`

    if (!existsSync(repoPath)) {
      throw new Error(`Repo not found: ${repoPath}`)
    }

    mkdirSync(`/var/tmp/${projectSlug}`, { recursive: true })

    if (existsSync(worktreePath)) {
      return { path: worktreePath, created: false }
    }

    // Try to find the remote's default branch (main/master) first
    let mainBranch = 'main'
    try {
      const remoteHead = execSync(
        `git -C "${repoPath}" remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}'`,
        { stdio: 'pipe' },
      )
        .toString()
        .trim()
      if (remoteHead && remoteHead !== '(unknown)') mainBranch = remoteHead
    } catch {
      // fallback to main
    }

    // Try to add worktree for the default branch; if already checked out, create a new tracking branch
    try {
      execSync(
        `git -C "${repoPath}" worktree add "${worktreePath}" "${mainBranch}"`,
        { stdio: 'pipe' },
      )
    } catch {
      // Branch already checked out — create a new local branch tracking the remote default
      const newBranch = `${mainBranch}-workspace`
      execSync(
        `git -C "${repoPath}" worktree add -b "${newBranch}" "${worktreePath}" "origin/${mainBranch}"`,
        { stdio: 'pipe' },
      )
    }
    return { path: worktreePath, created: true, branch: mainBranch }
  })

// ── Remote repo cloning ───────────────────────────────────────────────────────

export function isRemoteUrl(url: string): boolean {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('git@') ||
    url.includes('://')
  )
}

export const ensureRepoCloned = createServerFn({ method: 'POST' })
  .inputValidator((data: { repoUrl: string; projectSlug: string }) => data)
  .handler(async ({ data }) => {
    const { repoUrl, projectSlug } = data
    const clonePath = `/var/tmp/${projectSlug}/repo`

    mkdirSync(`/var/tmp/${projectSlug}`, { recursive: true })

    if (existsSync(clonePath)) {
      // Pull latest on the current branch silently
      try {
        execSync(`git -C "${clonePath}" fetch --all --prune`, {
          stdio: 'pipe',
          env: { ...process.env, GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o StrictHostKeyChecking=no' },
        })
      } catch {
        // non-fatal — offline or auth issue
      }
      return { path: clonePath, cloned: false }
    }

    execSync(`git clone "${repoUrl}" "${clonePath}"`, {
      stdio: 'pipe',
      env: { ...process.env, GIT_SSH_COMMAND: 'ssh -o BatchMode=yes -o StrictHostKeyChecking=no' },
    })
    return { path: clonePath, cloned: true }
  })

// ── File browser ──────────────────────────────────────────────────────────────

export const listProjectFiles = createServerFn({ method: 'GET' })
  .inputValidator((data: { rootPath: string }) => data)
  .handler(async ({ data }) => {
    if (!existsSync(data.rootPath)) return { files: [] }
    return { files: listFilesRecursive(data.rootPath) }
  })

export const readProjectFile = createServerFn({ method: 'GET' })
  .inputValidator((data: { rootPath: string; filePath: string }) => data)
  .handler(async ({ data }) => {
    const fullPath = path.resolve(path.join(data.rootPath, data.filePath))
    const root = path.resolve(data.rootPath)
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      throw new Error('Path traversal not allowed')
    }
    try {
      const content = readFileSync(fullPath, 'utf-8')
      return { content }
    } catch {
      throw new Error('File not readable')
    }
  })

export const writeProjectFile = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { rootPath: string; filePath: string; content: string }) => data,
  )
  .handler(async ({ data }) => {
    const fullPath = path.resolve(path.join(data.rootPath, data.filePath))
    const root = path.resolve(data.rootPath)
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      throw new Error('Path traversal not allowed')
    }
    writeFileSync(fullPath, data.content, 'utf-8')
    return { ok: true }
  })

// ── Worktree listing & diff stats ─────────────────────────────────────────────

export interface WorktreeInfo {
  path: string
  branch: string
}

export const listWorktrees = createServerFn({ method: 'GET' })
  .inputValidator((data: { repoPath: string }) => data)
  .handler(async ({ data }) => {
    if (!existsSync(data.repoPath)) return { worktrees: [] as WorktreeInfo[] }
    try {
      const out = execSync(`git -C "${data.repoPath}" worktree list --porcelain`, {
        stdio: 'pipe',
      }).toString()
      const worktrees: WorktreeInfo[] = []
      let currentPath = ''
      for (const line of out.split('\n')) {
        if (line.startsWith('worktree ')) {
          currentPath = line.slice('worktree '.length).trim()
        } else if (line.startsWith('branch ')) {
          const ref = line.slice('branch '.length).trim()
          const branch = ref.replace(/^refs\/heads\//, '')
          if (currentPath) worktrees.push({ path: currentPath, branch })
          currentPath = ''
        } else if (line.trim() === 'detached') {
          // detached HEAD — skip this worktree
          currentPath = ''
        }
      }
      return { worktrees }
    } catch {
      return { worktrees: [] as WorktreeInfo[] }
    }
  })

export const getWorktreeDiffStats = createServerFn({ method: 'GET' })
  .inputValidator((data: { worktreePath: string; baseBranch?: string }) => data)
  .handler(async ({ data }) => {
    const base = data.baseBranch ?? 'main'
    if (!existsSync(data.worktreePath)) return { added: 0, deleted: 0, changed: 0 }
    try {
      // Try origin/base first, fall back to base
      let ref = `origin/${base}`
      try {
        execSync(`git -C "${data.worktreePath}" rev-parse --verify "${ref}"`, { stdio: 'pipe' })
      } catch {
        ref = base
      }
      const out = execSync(
        `git -C "${data.worktreePath}" diff --shortstat "${ref}"`,
        { stdio: 'pipe' },
      ).toString().trim()
      // e.g. " 3 files changed, 42 insertions(+), 5 deletions(-)"
      const changed = Number(out.match(/(\d+) files? changed/)?.[1] ?? 0)
      const added = Number(out.match(/(\d+) insertion/)?.[1] ?? 0)
      const deleted = Number(out.match(/(\d+) deletion/)?.[1] ?? 0)
      return { added, deleted, changed }
    } catch {
      return { added: 0, deleted: 0, changed: 0 }
    }
  })
