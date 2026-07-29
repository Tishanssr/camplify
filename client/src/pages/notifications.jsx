import { useEffect, useState } from 'react'
import { FaCheck, FaCloudSun, FaEnvelope, FaTrash, FaTimes, FaUsers } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { notificationService } from '../services/notificationService'
import { invitationService } from '../services/invitationService'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionStatus, setActionStatus] = useState({})
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    async function loadAllData() {
      try {
        const notifData = await notificationService.getNotifications()
        if (notifData.success && Array.isArray(notifData.notifications)) {
          setItems(notifData.notifications)
        } else {
          setItems([])
        }
      } catch {
        setItems([])
      }

      try {
        const inviteData = await invitationService.getInvitations()
        if (inviteData.success && Array.isArray(inviteData.invitations)) {
          setInvitations(inviteData.invitations)
        } else {
          setInvitations([])
        }
      } catch (err) {
        console.error('Failed to load user invitations:', err)
        setInvitations([])
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  const handleRespondInvitation = async (invitationId, status) => {
    setProcessingId(invitationId)
    try {
      const res = await invitationService.respondInvitation(invitationId, status)
      if (res.success) {
        setActionStatus(prev => ({
          ...prev,
          [invitationId]: {
            success: true,
            message: res.message || (status === 'accepted' ? 'Invitation accepted!' : 'Invitation declined.'),
            tripId: res.invitation?.trip?._id || res.invitation?.trip,
          }
        }))
        setInvitations(prev =>
          prev.map(inv => (inv._id === invitationId ? { ...inv, status: status === 'accepted' ? 'accepted' : 'rejected' } : inv))
        )
      } else {
        setActionStatus(prev => ({
          ...prev,
          [invitationId]: { success: false, message: res.message || 'Failed to update invitation status.' }
        }))
      }
    } catch (err) {
      console.error('Error responding to invitation:', err)
      setActionStatus(prev => ({
        ...prev,
        [invitationId]: { success: false, message: err.response?.data?.message || 'Error processing response.' }
      }))
    } finally {
      setProcessingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    setItems(prev => prev.map(item => ({ ...item, read: true })))
    try {
      await notificationService.markAllAsRead()
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }

  const handleMarkSingleRead = async (id) => {
    setItems(prev => prev.map(item => (item._id === id || item.id === id) ? { ...item, read: true } : item))
    try {
      await notificationService.markAsRead(id)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleDeleteNotification = async (id) => {
    setItems(prev => prev.filter(item => item._id !== id && item.id !== id))
    try {
      await notificationService.deleteNotification(id)
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const handleClearAllNotifications = async () => {
    setItems([])
    try {
      await notificationService.clearAllNotifications()
    } catch (err) {
      console.error('Failed to clear all notifications:', err)
    }
  }

  // Exclude invitation notifications from general list so invitations appear ONLY in Trip Invitations
  const generalNotifications = items.filter(
    item => !item.title?.toLowerCase().includes('trip invitation') && !item.text?.toLowerCase().includes('invited')
  )

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
  const unreadCount = generalNotifications.filter(i => !i.read).length + pendingInvitations.length

  return (
    <ScreenLayout title="Notifications & Invitations">
      <div className="screen-page notification-page space-y-6">
        <div className="notification-heading flex items-center justify-between">
          <b>{unreadCount} unread item{unreadCount !== 1 ? 's' : ''}</b>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-emerald-700 font-bold hover:underline px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={handleClearAllNotifications}
              className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Clear all notifications from database"
            >
              <FaTrash className="text-[10px]" /> Clear All Notifications
            </button>
          </div>
        </div>

        {/* SECTION 1: TRIP INVITATIONS */}
        {invitations.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FaEnvelope className="text-emerald-700" /> Trip Invitations ({invitations.length})
            </h2>

            <div className="grid gap-3">
              {invitations.map((inv) => {
                const tripName = inv.trip?.name || 'Camping Trip'
                const inviterName = inv.invitedBy?.name || 'A trip organizer'
                const status = inv.status || 'pending'
                const feedback = actionStatus[inv._id]

                return (
                  <article key={inv._id} className={`p-4 border rounded-2xl bg-white shadow-sm space-y-3 ${status === 'pending' ? 'border-amber-200 bg-amber-50/20' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                          <FaUsers />
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-gray-800">{tripName}</h3>
                          <p className="text-xs text-gray-500">Invited by <b>{inviterName}</b> ({inv.email})</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full capitalize ${status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                        {status}
                      </span>
                    </div>

                    {feedback && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center justify-between ${feedback.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700'}`}>
                        <span>{feedback.message}</span>
                        {feedback.success && feedback.tripId && (
                          <Link to={`/trips/${feedback.tripId}`} className="text-xs font-bold text-emerald-800 hover:underline ml-2">
                            View Trip →
                          </Link>
                        )}
                      </div>
                    )}

                    {status === 'pending' && !feedback?.success && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleRespondInvitation(inv._id, 'accepted')}
                          disabled={processingId === inv._id}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FaCheck /> {processingId === inv._id ? 'Accepting...' : 'Accept Invitation'}
                        </button>
                        <button
                          onClick={() => handleRespondInvitation(inv._id, 'rejected')}
                          disabled={processingId === inv._id}
                          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FaTimes /> Decline
                        </button>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: SYSTEM NOTIFICATIONS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <FaCloudSun className="text-emerald-700" /> General Notifications ({generalNotifications.length})
            </h2>
            {generalNotifications.length > 0 && (
              <button
                onClick={handleClearAllNotifications}
                className="text-xs text-red-600 font-semibold hover:underline flex items-center gap-1"
              >
                <FaTrash className="text-[10px]" /> Clear List
              </button>
            )}
          </div>

          {loading ? (
            <p className="p-8 text-center text-gray-400">Loading notifications...</p>
          ) : generalNotifications.length === 0 ? (
            <div className="empty-state p-8 text-center text-gray-400 border border-dashed rounded-2xl border-emerald-800/30 my-3">
              No general notifications right now.
            </div>
          ) : (
            <div className="notification-list">
              {generalNotifications.map((item) => {
                const notificationId = item._id || item.id || item.title
                return (
                  <article
                    className={`notification-card relative group cursor-pointer transition-all ${!item.read ? 'unread' : 'opacity-80'}`}
                    key={notificationId}
                    onClick={() => handleMarkSingleRead(notificationId)}
                  >
                    <span className={`notification-icon ${item.color || 'green'}`}>
                      {typeof item.icon === 'string' ? item.icon : item.icon || <FaCheck />}
                    </span>
                    <div className="pr-6">
                      <h2>{item.title}</h2>
                      <p>{item.text || item.message}</p>
                      {item.action && <small>{item.action}</small>}
                    </div>
                    <time className="flex items-center gap-2">
                      <span>● {item.time || 'Recently'}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNotification(notificationId)
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Clear notification"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </time>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </ScreenLayout>
  )
}
