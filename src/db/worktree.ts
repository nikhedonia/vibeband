import { createServerFn } from '@tanstack/react-start'
import { execSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
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

    let mainBranch = 'main'
    try {
      mainBranch = execSync(
        `git -C "${repoPath}" symbolic-ref --short HEAD`,
        { stdio: 'pipe' },
      )
        .toString()
        .trim()
    } catch {
      try {
        mainBranch = execSync(
          `git -C "${repoPath}" rev-parse --abbrev-ref HEAD`,
          { stdio: 'pipe' },
        )
          .toString()
          .trim()
      } catch {
        // fallback to 'main'
      }
    }

    execSync(
      `git -C "${repoPath}" worktree add "${worktreePath}" "${mainBranch}"`,
      { stdio: 'pipe' },
    )
    return { path: worktreePath, created: true, branch: mainBranch }
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
