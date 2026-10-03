import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { notificationService } from '../services/notificationService'
import { useAuth } from './AuthContext'
import { useSSE } from '../lib/useSSE'
import { toast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const { isLoggedIn, isAdmin } = useAuth()
  const listenersRef = useRef(new Set())

  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn || isAdmin) {
      setUnreadCount(0)
      return
    }
    try {
      const data = await notificationService.getUnreadCount()
      if (data.success && typeof data.count === 'number') {
        setUnreadCount(data.count)
      }
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err)
    }
  }, [isLoggedIn, isAdmin])

  // Handle incoming real-time SSE events
  const handleSSEEvent = useCallback(
    (eventName, data) => {
      if (eventName === 'trip_update' || eventName === 'checklist_update') {
        fetchUnreadCount()

        // Display real-time toast alert if summary exists
        if (data.summary) {
          toast.info(`Update: ${data.summary}`, {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          })
        }

        // Notify active page listeners (e.g. trip detail page)
        listenersRef.current.forEach((listener) => {
          try {
            listener(eventName, data)
          } catch (err) {
            console.error('Error in SSE listener:', err)
          }
        })
      }
    },
    [fetchUnreadCount]
  )

  // Subscribe to SSE stream
  useSSE(isLoggedIn && !isAdmin, handleSSEEvent)

  // Fallback 30-second polling for unread badge count
  useEffect(() => {
    fetchUnreadCount()

    if (isLoggedIn && !isAdmin) {
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [isLoggedIn, isAdmin, fetchUnreadCount])

  const decrementUnreadCount = (amount = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount))
  }

  const resetUnreadCount = () => {
    setUnreadCount(0)
  }

  const subscribeToSSEEvents = (callback) => {
    listenersRef.current.add(callback)
    return () => {
      listenersRef.current.delete(callback)
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        fetchUnreadCount,
        decrementUnreadCount,
        resetUnreadCount,
        subscribeToSSEEvents,
      }}
    >
      <ToastContainer />
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
