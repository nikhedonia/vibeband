import { useState, useEffect } from 'react'
import { X, Eye, Edit3, Trash2 } from 'lucide-react'
import { updateTicket, deleteTicket } from '../../db/kanban'

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

export default function MarkdownEditor({ ticket, onClose, onSave, onDelete }: MarkdownEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title)
      setContent(ticket.content ?? '')
      setPreview(false)
    }
  }, [ticket?.id])

  if (!ticket) return null

  async function handleSave() {
    if (!ticket) return
    setSaving(true)
    const updated = await updateTicket({ data: { id: ticket.id, title, content } })
    setSaving(false)
    onSave({ ...ticket, title, content, updatedAt: updated?.updatedAt ?? null })
  }

  async function handleDelete() {
    if (!ticket) return
    await deleteTicket({ data: { id: ticket.id } })
    onDelete(ticket.id)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-screen w-full max-w-lg bg-gray-900 text-white z-50 flex flex-col shadow-2xl border-l border-gray-700 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(false)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${!preview ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Edit3 size={13} /> Edit
            </button>
            <button
              onClick={() => setPreview(true)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${preview ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Eye size={13} /> Preview
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete ticket"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pt-4 pb-2">
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
              dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${renderMarkdown(content)}</p>` }}
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-80 bg-gray-800 text-gray-200 text-sm font-mono p-3 rounded-md border border-gray-700 focus:border-cyan-500 focus:outline-none resize-none leading-relaxed"
              placeholder="Write your notes in Markdown…&#10;&#10;# Heading&#10;**bold**, *italic*, `code`&#10;- list item"
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700 flex justify-end gap-2">
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
      </div>
    </>
  )
}
