import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState, useRef } from 'react'
import { GitBranch, ExternalLink, Pencil, Check, X } from 'lucide-react'
import { getBoardData, updateProject } from '../../db/kanban'
import KanbanBoard from '../../components/kanban/KanbanBoard'

export const Route = createFileRoute('/board/$boardId')({
  loader: async ({ params }) => {
    const projectId = Number(params.boardId)
    if (Number.isNaN(projectId)) throw notFound()
    try {
      return await getBoardData({ data: { projectId } })
    } catch {
      throw notFound()
    }
  },
  component: BoardPage,
  notFoundComponent: () => (
    <div className="flex items-center justify-center h-full text-gray-500">
      Board not found
    </div>
  ),
})

function RepoUrlEditor({
  projectId,
  initialUrl,
}: { projectId: number; initialUrl: string }) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(initialUrl)
  const [saved, setSaved] = useState(initialUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const isRemote = saved.startsWith('http://') || saved.startsWith('https://')

  async function save() {
    await updateProject({ data: { id: projectId, repoUrl: url } })
    setSaved(url)
    setEditing(false)
  }

  function cancel() {
    setUrl(saved)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <GitBranch className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
        <input
          ref={inputRef}
          autoFocus
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save()
            if (e.key === 'Escape') cancel()
          }}
          placeholder="https://github.com/org/repo or /local/path"
          className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-gray-200 w-72 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={save}
          className="text-green-400 hover:text-green-300"
          title="Save"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="text-gray-400 hover:text-gray-300"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 mt-1 group">
      <GitBranch className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      {saved ? (
        isRemote ? (
          <a
            href={saved}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            {saved}
            <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-400 font-mono">{saved}</span>
        )
      ) : (
        <span className="text-xs text-gray-600 italic">No git repo linked</span>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 ml-1 transition-opacity"
        title="Edit repo URL"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}

function BoardPage() {
  const { project, columns, tickets } = Route.useLoaderData()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Board header */}
      <div className="px-6 py-4 border-b border-gray-800 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">{project.name}</h1>
        {project.description && (
          <p className="text-sm text-gray-400 mt-0.5">{project.description}</p>
        )}
        <RepoUrlEditor
          projectId={project.id}
          initialUrl={project.repoUrl ?? ''}
        />
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-4">
        <KanbanBoard
          projectId={project.id}
          initialColumns={columns}
          initialTickets={tickets}
        />
      </div>
    </div>
  )
}
