import { useState, useRef, useImperativeHandle } from 'react'
import { Plus, MoreHorizontal, X, Check } from 'lucide-react'
import {
  createTicket,
  createColumn,
  updateTicket,
  updateColumn,
  deleteColumn,
} from '../../db/kanban'

interface Column {
  id: number
  projectId: number
  name: string
  position: number
  createdAt: Date | null
}

interface Ticket {
  id: number
  columnId: number
  projectId: number
  title: string
  content: string | null
  position: number
  createdAt: Date | null
  updatedAt: Date | null
}

export interface KanbanBoardHandle {
  updateTicket: (ticket: Ticket) => void
  deleteTicket: (id: number) => void
}

interface KanbanBoardProps {
  ref?: React.Ref<KanbanBoardHandle>
  projectId: number
  initialColumns: Column[]
  initialTickets: Ticket[]
  selectedTicketId?: number | null
  onTicketSelect: (ticket: Ticket | null) => void
  onTicketMoved?: (ticket: Ticket, column: Column) => void
}

export default function KanbanBoard({
  ref,
  projectId,
  initialColumns,
  initialTickets,
  selectedTicketId,
  onTicketSelect,
  onTicketMoved,
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets)
  const [addingTicket, setAddingTicket] = useState<number | null>(null)
  const [newTicketTitle, setNewTicketTitle] = useState('')
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')
  const [editingColumnId, setEditingColumnId] = useState<number | null>(null)
  const [editingColumnName, setEditingColumnName] = useState('')

  // Drag state
  const dragTicketId = useRef<number | null>(null)
  const dragOverColumnId = useRef<number | null>(null)
  const [draggingTicketId, setDraggingTicketId] = useState<number | null>(null)
  const [dragOverCol, setDragOverCol] = useState<number | null>(null)

  // Expose imperative API for parent to sync ticket updates from the editor
  useImperativeHandle(ref, () => ({
    updateTicket: (ticket: Ticket) => {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? ticket : t)))
    },
    deleteTicket: (id: number) => {
      setTickets((prev) => prev.filter((t) => t.id !== id))
    },
  }))

  // ── Tickets ──────────────────────────────────────────────────────────────────

  async function handleAddTicket(columnId: number) {
    if (!newTicketTitle.trim()) return
    const colTickets = tickets.filter((t) => t.columnId === columnId)
    const position = colTickets.length
    const ticket = await createTicket({
      data: { projectId, columnId, title: newTicketTitle.trim(), position },
    })
    setTickets((prev) => [...prev, ticket])
    setNewTicketTitle('')
    setAddingTicket(null)
  }

  function handleTicketDragStart(e: React.DragEvent, ticketId: number) {
    dragTicketId.current = ticketId
    setDraggingTicketId(ticketId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleTicketDragEnd() {
    dragTicketId.current = null
    setDraggingTicketId(null)
    setDragOverCol(null)
    dragOverColumnId.current = null
  }

  function handleColumnDragOver(e: React.DragEvent, columnId: number) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    dragOverColumnId.current = columnId
    setDragOverCol(columnId)
  }

  async function handleColumnDrop(e: React.DragEvent, columnId: number) {
    e.preventDefault()
    const ticketId = dragTicketId.current
    if (ticketId === null) return

    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.columnId === columnId) {
      handleTicketDragEnd()
      return
    }

    const colTickets = tickets.filter((t) => t.columnId === columnId)
    const newPosition = colTickets.length

    const updatedTicket = { ...ticket, columnId, position: newPosition }
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? updatedTicket : t)),
    )

    await updateTicket({ data: { id: ticketId, columnId, position: newPosition } })

    // Notify parent for worktree management
    const col = columns.find((c) => c.id === columnId)
    if (col) onTicketMoved?.(updatedTicket, col)

    handleTicketDragEnd()
  }

  // ── Columns ───────────────────────────────────────────────────────────────────

  async function handleAddColumn() {
    if (!newColumnName.trim()) return
    const position = columns.length
    const col = await createColumn({
      data: { projectId, name: newColumnName.trim(), position },
    })
    setColumns((prev) => [...prev, col])
    setNewColumnName('')
    setAddingColumn(false)
  }

  async function handleRenameColumn(id: number) {
    if (!editingColumnName.trim()) return
    await updateColumn({ data: { id, name: editingColumnName.trim() } })
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: editingColumnName.trim() } : c)),
    )
    setEditingColumnId(null)
  }

  async function handleDeleteColumn(id: number) {
    await deleteColumn({ data: { id } })
    setColumns((prev) => prev.filter((c) => c.id !== id))
    setTickets((prev) => prev.filter((t) => t.columnId !== id))
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4 px-1">
      {columns.map((col) => {
        const colTickets = tickets
          .filter((t) => t.columnId === col.id)
          .sort((a, b) => a.position - b.position)
        const isOver = dragOverCol === col.id

        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-64 flex flex-col rounded-xl transition-colors ${
              isOver ? 'bg-gray-700/80' : 'bg-gray-800/60'
            }`}
            onDragOver={(e) => handleColumnDragOver(e, col.id)}
            onDrop={(e) => handleColumnDrop(e, col.id)}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 group">
              {editingColumnId === col.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <input
                    autoFocus
                    value={editingColumnName}
                    onChange={(e) => setEditingColumnName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameColumn(col.id)
                      if (e.key === 'Escape') setEditingColumnId(null)
                    }}
                    className="flex-1 bg-gray-700 text-white text-sm px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    onClick={() => handleRenameColumn(col.id)}
                    className="text-green-400 hover:text-green-300"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => setEditingColumnId(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-200">
                      {col.name}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded-full">
                      {colTickets.length}
                    </span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingColumnId(col.id)
                        setEditingColumnName(col.name)
                      }}
                      className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
                      title="Rename column"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteColumn(col.id)}
                      className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400"
                      title="Delete column"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Tickets */}
            <div className="flex-1 overflow-y-auto px-2 space-y-2 min-h-8">
              {colTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={(e) => handleTicketDragStart(e, ticket.id)}
                  onDragEnd={handleTicketDragEnd}
                  onClick={() => onTicketSelect(ticket)}
                  className={`bg-gray-700 hover:bg-gray-600 rounded-lg p-3 cursor-pointer border transition-all select-none ${
                    selectedTicketId === ticket.id
                      ? 'border-cyan-500'
                      : 'border-transparent hover:border-gray-500'
                  } ${draggingTicketId === ticket.id ? 'opacity-40 scale-95' : ''}`}
                >
                  <p className="text-sm text-gray-100 font-medium leading-snug">
                    {ticket.title}
                  </p>
                  {ticket.content && (
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                      {ticket.content}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 mt-2">#{ticket.id}</p>
                </div>
              ))}

              {/* Drop zone hint */}
              {isOver && draggingTicketId !== null && (
                <div className="h-12 border-2 border-dashed border-cyan-500/50 rounded-lg bg-cyan-900/10" />
              )}
            </div>

            {/* Add ticket */}
            <div className="px-2 py-2">
              {addingTicket === col.id ? (
                <div>
                  <textarea
                    autoFocus
                    value={newTicketTitle}
                    onChange={(e) => setNewTicketTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleAddTicket(col.id)
                      }
                      if (e.key === 'Escape') {
                        setAddingTicket(null)
                        setNewTicketTitle('')
                      }
                    }}
                    placeholder="Ticket title…"
                    rows={2}
                    className="w-full bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                  />
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => handleAddTicket(col.id)}
                      className="flex-1 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 rounded text-white transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setAddingTicket(null)
                        setNewTicketTitle('')
                      }}
                      className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingTicket(col.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-700/60 rounded-lg transition-colors"
                >
                  <Plus size={14} /> Add ticket
                </button>
              )}
            </div>
          </div>
        )
      })}

      {/* Add column */}
      <div className="flex-shrink-0 w-64">
        {addingColumn ? (
          <div className="bg-gray-800/60 rounded-xl p-3">
            <input
              autoFocus
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddColumn()
                if (e.key === 'Escape') {
                  setAddingColumn(false)
                  setNewColumnName('')
                }
              }}
              placeholder="Column name…"
              className="w-full bg-gray-700 text-white text-sm px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 mb-2"
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddColumn}
                className="flex-1 py-1 text-xs bg-cyan-600 hover:bg-cyan-700 rounded text-white transition-colors"
              >
                Add Column
              </button>
              <button
                onClick={() => {
                  setAddingColumn(false)
                  setNewColumnName('')
                }}
                className="flex-1 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingColumn(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-300 bg-gray-800/30 hover:bg-gray-800/60 rounded-xl transition-colors border-2 border-dashed border-gray-700 hover:border-gray-600"
          >
            <Plus size={16} /> Add column
          </button>
        )}
      </div>
    </div>
  )
}
