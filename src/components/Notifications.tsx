import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
  id: string
  type: NotificationType
  message: string
}

interface NotificationsContextValue {
  notify: (message: string, type?: NotificationType) => void
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notify: () => {},
})

export function useNotifications() {
  return useContext(NotificationsContext)
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const counterRef = useRef(0)

  const notify = useCallback(
    (message: string, type: NotificationType = 'info') => {
      const id = String(++counterRef.current)
      setNotifications((prev) => [...prev, { id, type, message }])
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 5000)
    },
    [],
  )

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return (
    <NotificationsContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-xl max-w-sm pointer-events-auto animate-slide-in ${
              n.type === 'success'
                ? 'bg-green-900/95 border border-green-700 text-green-100'
                : n.type === 'error'
                  ? 'bg-red-900/95 border border-red-700 text-red-100'
                  : 'bg-gray-800/95 border border-gray-600 text-gray-100'
            }`}
          >
            {n.type === 'success' && (
              <CheckCircle
                size={16}
                className="flex-shrink-0 mt-0.5 text-green-400"
              />
            )}
            {n.type === 'error' && (
              <AlertCircle
                size={16}
                className="flex-shrink-0 mt-0.5 text-red-400"
              />
            )}
            {n.type === 'info' && (
              <Info
                size={16}
                className="flex-shrink-0 mt-0.5 text-cyan-400"
              />
            )}
            <span className="text-sm flex-1 leading-relaxed">{n.message}</span>
            <button
              onClick={() => dismiss(n.id)}
              className="text-current opacity-50 hover:opacity-100 flex-shrink-0 mt-0.5"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationsContext.Provider>
  )
}
