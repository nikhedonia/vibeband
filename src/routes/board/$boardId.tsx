import { createFileRoute, notFound } from '@tanstack/react-router'
import { getBoardData } from '../../db/kanban'
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
