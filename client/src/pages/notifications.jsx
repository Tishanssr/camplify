import { useEffect, useState } from 'react'
import {
  FaCheck,
  FaEnvelope,
  FaTrash,
  FaTimes,
  FaBell,
  FaCompass,
  FaExclamationTriangle,
  FaUserCheck,
  FaTasks,
  FaExternalLinkAlt,
} from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { notificationService } from '../services/notificationService'
import { invitationService } from '../services/invitationService'
import { useNotification } from '../context/NotificationContext'
import { timeAgo } from '../utils/timeAgo'

export default function Notifications() {
  const [items, setItems] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'unread' | 'invitations'
  const [actionStatus, setActionStatus] = useState({})
  const [processingAction, setProcessingAction] = useState(null)

  const { fetchUnreadCount } = useNotification()
  const navigate = useNavigate()

  const loadAllData = async () => {
    try {
      const [notifData, inviteData] = await Promise.all([
        notificationService.getNotifications().catch(() => ({ success: false })),
        invitationService.getInvitations().catch(() => ({ success: false })),
      ])

      if (notifData.success && Array.isArray(notifData.notifications)) {
        setItems(notifData.notifications)
      } else {
        setItems([])
      }

      if (inviteData.success && Array.isArray(inviteData.invitations)) {
        setInvitations(inviteData.invitations)
      } else {
        setInvitations([])
      }
    } finally {
      setLoading(false)
      fetchUnreadCount()
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const handleRespondInvitation = async (invitationId, status) => {
    setProcessingAction({ id: invitationId, action: status })
    handleMarkSingleRead(`inv-${invitationId}`)
    try {
      const res = await invitationService.respondInvitation(invitationId, status)
      if (res.success) {
        setActionStatus((prev) => ({
          ...prev,
          [invitationId]: {
            success: true,
            isAccepted: status === 'accepted',
            message: res.message || (status === 'accepted' ? 'Invitation accepted!' : 'Invitation declined.'),
            tripId: res.invitation?.trip?._id || res.invitation?.trip,
          },
        }))
        setInvitations((prev) =>
          prev.map((inv) => (inv._id === invitationId ? { ...inv, status: status === 'accepted' ? 'accepted' : 'rejected', read: true } : inv))
        )
      } else {
        setActionStatus((prev) => ({
          ...prev,
          [invitationId]: { success: false, message: res.message || 'Failed to update invitation status.' },
        }))
      }
    } catch (err) {
      console.error('Error responding to invitation:', err)
      setActionStatus((prev) => ({
        ...prev,
        [invitationId]: { success: false, message: err.response?.data?.message || 'Error processing response.' },
      }))
    } finally {
      setProcessingAction(null)
      fetchUnreadCount()
    }
  }

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })))
    setInvitations((prev) => prev.map((inv) => ({ ...inv, read: true })))
    try {
      await notificationService.markAllAsRead()
      fetchUnreadCount()
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
  }

  const handleMarkSingleRead = async (id) => {
    if (String(id).startsWith('inv-')) {
      const realId = String(id).replace('inv-', '')
      setInvitations((prev) => prev.map((inv) => (String(inv._id) === realId ? { ...inv, read: true } : inv)))
    } else {
      setItems((prev) => prev.map((item) => (item._id === id || item.id === id ? { ...item, read: true } : item)))
    }
    try {
      await notificationService.markAsRead(id)
      fetchUnreadCount()
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleDeleteNotification = async (id) => {
    if (String(id).startsWith('inv-')) {
      const realId = String(id).replace('inv-', '')
      setInvitations((prev) => prev.filter((inv) => String(inv._id) !== realId))
      try {
        await invitationService.deleteInvitation(realId)
      } catch (err) {
        console.error('Failed to delete invitation notification:', err)
      }
    } else {
      setItems((prev) => prev.filter((item) => item._id !== id && item.id !== id))
      try {
        await notificationService.deleteNotification(id)
      } catch (err) {
        console.error('Failed to delete notification:', err)
      }
    }
    fetchUnreadCount()
  }

  const handleClearAllNotifications = async () => {
    setItems([])
    setInvitations((prev) => prev.filter((inv) => inv.status === 'pending'))
    try {
      await notificationService.clearAllNotifications()
      await invitationService.clearRespondedInvitations()
      fetchUnreadCount()
    } catch (err) {
      console.error('Failed to clear all notifications:', err)
    }
  }

  const handleCardNavigate = (notificationId, relatedTripId, isDeleted) => {
    handleMarkSingleRead(notificationId)
    if (relatedTripId && !isDeleted) {
      navigate(`/trips/${relatedTripId}`)
    }
  }

  // Filter out redundant initial "Trip Invitation" system notifications since the invitation record renders interactively
  const filteredNotifs = items.filter(
    (item) => !item.title?.toLowerCase().includes('trip invitation') && !item.text?.toLowerCase().includes('invited by')
  )

  const invitationFeedItems = invitations.map((inv) => ({
    id: `inv-${inv._id}`,
    type: 'invitation',
    createdAt: inv.createdAt,
    read: Boolean(inv.read || inv.status !== 'pending'),
    data: inv,
  }))

  const standardFeedItems = filteredNotifs.map((notif) => ({
    id: `notif-${notif._id || notif.id}`,
    type: 'standard',
    createdAt: notif.createdAt,
    read: notif.read,
    data: notif,
  }))

  const unifiedFeed = [...invitationFeedItems, ...standardFeedItems].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )

  const unreadCount = unifiedFeed.filter((i) => !i.read).length

  // Filter feed based on active tab
  const displayedFeed = unifiedFeed.filter((item) => {
    if (activeTab === 'unread') return !item.read
    if (activeTab === 'invitations') return item.type === 'invitation'
    return true
  })

  const getNotifIcon = (notif) => {
    if (notif.type === 'trip_update') return <FaCompass className="text-blue-600" />
    if (notif.type === 'trip_deleted') return <FaExclamationTriangle className="text-red-500" />
    if (notif.type === 'invitation_response') return <FaUserCheck className="text-emerald-600" />
    if (notif.type === 'checklist_update') return <FaTasks className="text-purple-600" />
    if (notif.color === 'yellow') return <FaEnvelope className="text-amber-600" />
    if (notif.color === 'red') return <FaExclamationTriangle className="text-red-600" />
    if (notif.color === 'blue') return <FaCompass className="text-blue-600" />
    return <FaCheck />
  }

  return (
    <ScreenLayout title="Notifications">
      <div className="screen-page notification-page space-y-4 max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-800">Inbox</h2>
            {unreadCount > 0 && (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-emerald-700 font-bold hover:underline px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={handleClearAllNotifications}
              className="text-xs text-red-700 font-bold bg-red-50 border border-red-200/60 px-3 py-1.5 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-1.5"
              title="Clear all notifications"
            >
              <FaTrash className="text-[10px]" /> Clear All
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            All ({unifiedFeed.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'unread' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'}`}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('invitations')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'invitations'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            Invitations ({invitationFeedItems.length})
          </button>
        </div>

        {/* Content Feed */}
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="p-4 bg-white rounded-2xl border border-gray-100 animate-pulse flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-150 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedFeed.length === 0 ? (
          <div className="empty-state p-12 text-center border border-dashed rounded-2xl border-emerald-800/20 bg-white/50 space-y-2 my-2">
            <FaBell className="text-3xl text-emerald-600/40 mx-auto" />
            <h3 className="text-sm font-bold text-gray-700">No notifications found</h3>
            <p className="text-xs text-gray-400">
              {activeTab === 'unread'
                ? 'You have read all your notifications!'
                : activeTab === 'invitations'
                ? 'No trip invitations received.'
                : 'Your inbox is clear! Check back later for updates.'}
            </p>
          </div>
        ) : (
          <div className="notification-list space-y-3">
            {displayedFeed.map((feedItem) => {
              if (feedItem.type === 'invitation') {
                const inv = feedItem.data
                const tripName = inv.trip?.name || 'Camping Trip'
                const tripLocation = inv.trip?.location ? ` (${inv.trip.location})` : ''
                const inviterName = inv.invitedBy?.name || 'A trip organizer'
                const status = inv.status || 'pending'
                const feedback = actionStatus[inv._id]

                return (
                  <article
                    key={feedItem.id}
                    onClick={() => handleMarkSingleRead(feedItem.id)}
                    className={`p-4 border rounded-2xl bg-white shadow-sm space-y-3 transition-all cursor-pointer ${
                      !feedItem.read ? 'border-amber-300 bg-amber-50/40' : 'border-gray-100 opacity-90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                          <FaEnvelope className="text-base" />
                        </span>
                        <div>
                          <h3 className="text-xs font-bold text-gray-800">Trip Invitation: {tripName}{tripLocation}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">You were invited by <b>{inviterName}</b></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full capitalize ${
                            status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {status}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNotification(feedItem.id)
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Dismiss invitation"
                        >
                          <FaTimes className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {feedback && (
                      <div
                        className={`p-2.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                          feedback.success
                            ? feedback.isAccepted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span>{feedback.message}</span>
                        {feedback.success && feedback.isAccepted && feedback.tripId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkSingleRead(feedItem.id)
                              navigate(`/trips/${feedback.tripId}`)
                            }}
                            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View Trip <FaExternalLinkAlt className="text-[10px]" />
                          </button>
                        )}
                      </div>
                    )}

                    {status === 'pending' && !feedback?.success && (
                      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleRespondInvitation(inv._id, 'accepted')}
                          disabled={!!processingAction}
                          className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <FaCheck /> {processingAction?.id === inv._id && processingAction?.action === 'accepted' ? 'Accepting...' : 'Accept Invitation'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondInvitation(inv._id, 'rejected')}
                          disabled={!!processingAction}
                          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <FaTimes /> {processingAction?.id === inv._id && processingAction?.action === 'rejected' ? 'Declining...' : 'Decline'}
                        </button>
                      </div>
                    )}
                  </article>
                )
              }

              const item = feedItem.data
              const notificationId = item._id || item.id || item.title
              const relatedTripId = item.relatedId
              const isTripDeleted = item.type === 'trip_deleted'

              return (
                <article
                  className={`notification-card relative group cursor-pointer transition-all ${!item.read ? 'unread' : 'opacity-80'}`}
                  key={feedItem.id}
                  onClick={() => handleCardNavigate(notificationId, relatedTripId, isTripDeleted)}
                >
                  <span className={`notification-icon ${item.color || 'green'}`}>
                    {getNotifIcon(item)}
                  </span>
                  <div className="pr-6 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2>{item.title}</h2>
                      {!item.read && <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />}
                    </div>
                    <p>{item.text || item.message}</p>
                    
                    {relatedTripId && !isTripDeleted && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardNavigate(notificationId, relatedTripId, false)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline pt-1 cursor-pointer"
                      >
                        View Trip <FaExternalLinkAlt className="text-[10px]" />
                      </button>
                    )}
                  </div>
                  <time className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{timeAgo(item.createdAt)}</span>
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
      </div>
    </ScreenLayout>
  )
}
