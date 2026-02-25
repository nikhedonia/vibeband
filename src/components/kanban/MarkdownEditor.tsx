import { useState, useEffect, useRef, useCallback } from 'react'
import {
  X,
  Eye,
  Edit3,
  Trash2,
  FolderOpen,
  ChevronRight,
  FileText,
  Folder,
  ArrowLeft,
  Save,
} from 'lucide-react'
import { updateTicket, deleteTicket } from '../../api/client'
import { listProjectFiles, readProjectFile } from '../../api/client'
import type { FileNode } from '../../api/client'

interface Ticket {
  id: number
  title: string
  content: string | null
  columnId: number
  projectId: number
  position: number
  createdAt: Date | null
  updatedAt: Date | null
}

interface MarkdownEditorProps {
  ticket: Ticket | null
  onClose: () => void
  onSave: (ticket: Ticket) => void
  onDelete: (id: number) => void
  repoPath?: string
}

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold mt-4 mb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-700 px-1 rounded text-sm font-mono">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-400 underline" target="_blank">$1</a>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br/>')
}

// ── File tree ─────────────────────────────────────────────────────────────────

function FileTreeNode({
  node,
  onFileClick,
}: {
  node: FileNode
  onFileClick: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  if (node.type === 'dir') {
    return (
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-300 hover:bg-gray-800 rounded text-left"
        >
          <ChevronRight
            size={12}
            className={`flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
          <Folder size={12} className="flex-shrink-0 text-yellow-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div className="pl-3">
            {node.children.map((child) => (
              <FileTreeNode key={child.path} node={child} onFileClick={onFileClick} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onFileClick(node.path)}
      className="w-full flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-800 hover:text-gray-200 rounded text-left"
    >
      <span className="w-3 flex-shrink-0" />
      <FileText size={12} className="flex-shrink-0 text-gray-500" />
      <span className="truncate">{node.name}</span>
    </button>
  )
}

function FileBrowser({ repoPath }: { repoPath: string }) {
  const [files, setFiles] = useState<FileNode[]>([])
  const [openFile, setOpenFile] = useState<{ path: string; content: string } | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    listProjectFiles(repoPath)
      .then((r) => setFiles(r.files))
      .finally(() => setLoading(false))
  }, [repoPath])

  async function handleFileClick(filePath: string) {
    try {
      const { content } = await readProjectFile(repoPath, filePath)
      setOpenFile({ path: filePath, content })
      setEditContent(content)
      setEditing(false)
    } catch {
      setOpenFile({ path: filePath, content: '(binary or unreadable file)' })
      setEditContent('')
      setEditing(false)
    }
  }

  async function handleSave() {
    if (!openFile) return
    setSaving(true)
    try {
      await writeProjectFile({
        data: { rootPath: repoPath, filePath: openFile.path, content: editContent },
      })
      setOpenFile({ ...openFile, content: editContent })
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (openFile) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => { setOpenFile(null); setEditing(false) }}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft size={14} />
          </button>
          <span className="text-xs text-gray-300 font-mono truncate flex-1">
            {openFile.path}
          </span>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              title="Edit file"
            >
              <Edit3 size={13} />
            </button>
          ) : (
            <>
              <button
                onClick={() => { setEditing(false); setEditContent(openFile.content) }}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="Discard changes"
              >
                <X size={13} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="p-1 rounded hover:bg-gray-700 text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
                title="Save file"
              >
                <Save size={13} />
              </button>
            </>
          )}
        </div>
        <div className="flex-1 overflow-auto p-3">
          {editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-full min-h-full bg-transparent text-xs text-gray-300 font-mono whitespace-pre resize-none focus:outline-none leading-relaxed"
              spellCheck={false}
            />
          ) : (
            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
              {openFile.content}
            </pre>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-700 flex-shrink-0">
        <p className="text-xs text-gray-500 font-mono truncate">{repoPath}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="text-xs text-gray-500 px-2 py-2">Loading…</p>
        ) : files.length === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-2">No files found</p>
        ) : (
          files.map((node) => (
            <FileTreeNode key={node.path} node={node} onFileClick={handleFileClick} />
          ))
        )}
      </div>
    </div>
  )
}

// ── Main editor ───────────────────────────────────────────────────────────────

export default function MarkdownEditor({
  ticket,
  onClose,
  onSave,
  onDelete,
  repoPath,
}: MarkdownEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'editor' | 'files'>('editor')
  const [width, setWidth] = useState(480)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = width
    e.preventDefault()
  }, [width])

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing.current) return
      const delta = startX.current - e.clientX
      setWidth(Math.max(320, Math.min(900, startWidth.current + delta)))
    }
    function onMouseUp() {
      isResizing.current = false
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title)
      setContent(ticket.content ?? '')
      setPreview(false)
      setTab('editor')
    }
  }, [ticket?.id])

  async function handleSave() {
    if (!ticket) return
    setSaving(true)
    const updated = await updateTicket(ticket.id, { title, content })
    setSaving(false)
    onSave({ ...ticket, title, content, updatedAt: updated?.updatedAt ?? null })
  }

  async function handleDelete() {
    if (!ticket) return
    await deleteTicket(ticket.id)
    onDelete(ticket.id)
  }

  const hasRepo = !!repoPath

  return (
    <div style={{ width }} className="flex-shrink-0 border-l border-gray-700 bg-gray-900 flex flex-col relative">
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-cyan-500/60 transition-colors z-10"
      />
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setTab('editor')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
            tab === 'editor' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Edit3 size={12} /> Editor
        </button>
        {hasRepo && (
          <button
            onClick={() => setTab('files')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors ${
              tab === 'files' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderOpen size={12} /> Files
          </button>
        )}
        <div className="flex-1" />
        {ticket && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Clear selection"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Files tab */}
      {tab === 'files' && hasRepo && (
        <div className="flex-1 overflow-hidden">
          <FileBrowser repoPath={repoPath} />
        </div>
      )}

      {/* Editor tab */}
      {tab === 'editor' && (
        <>
          {!ticket ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-2">
              <Edit3 size={28} className="opacity-30" />
              <p className="text-sm">Select a ticket to edit</p>
            </div>
          ) : (
            <>
              {/* Edit / Preview toggle */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreview(false)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                      !preview ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                  <button
                    onClick={() => setPreview(true)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
                      preview ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye size={12} /> Preview
                  </button>
                </div>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
                  title="Delete ticket"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Title */}
              <div className="px-4 pt-4 pb-2 flex-shrink-0">
                {preview ? (
                  <h2 className="text-xl font-bold">{title}</h2>
                ) : (
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-transparent text-xl font-bold text-white border-b border-gray-700 focus:border-cyan-500 focus:outline-none pb-1 transition-colors"
                    placeholder="Ticket title…"
                  />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {preview ? (
                  <div
                    className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed"
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: markdown preview
                    dangerouslySetInnerHTML={{
                      __html: `<p class="mb-2">${renderMarkdown(content)}</p>`,
                    }}
                  />
                ) : (
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-full min-h-80 bg-gray-800 text-gray-200 text-sm font-mono p-3 rounded-md border border-gray-700 focus:border-cyan-500 focus:outline-none resize-none leading-relaxed"
                    placeholder={'Write your notes in Markdown…\n\n# Heading\n**bold**, *italic*, `code`\n- list item'}
                  />
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2 flex-shrink-0">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1.5 text-sm rounded bg-cyan-600 hover:bg-cyan-700 text-white transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
