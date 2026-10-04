import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaTrash, FaUsers, FaMapMarkerAlt, FaArrowRight, FaPlus } from 'react-icons/fa'
import { FiEdit3 } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ScreenLayout from '../components/layout/ScreenLayout'
import EditTripModal from '../components/common/EditTripModal'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { getTripCategory, getDaysLabel } from '../utils/dateUtils'
import { getImageUrl } from '../utils/imageUtils'

export { getTripCategory, getDaysLabel }

function ParticipantAvatarStack({ participants }) {
  const list = Array.isArray(participants) ? participants : []
  const maxAvatars = 3
  const visible = list.slice(0, maxAvatars)
  const remaining = list.length - maxAvatars

  if (list.length === 0) {
    return (
      <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1 shrink-0">
        <FaUsers className="text-emerald-600 text-xs shrink-0" /> 1 person
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="flex -space-x-2 overflow-hidden items-center">
        {visible.map((p, idx) => {
          const name = p.user?.name || p.email || 'Participant'
          const pic = p.user?.profilePicture
          return pic ? (
            <img
              key={idx}
              src={getImageUrl(pic)}
              alt={name}
              title={name}
              className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-xs"
            />
          ) : (
            <span
              key={idx}
              title={name}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold ring-2 ring-white shadow-xs"
            >
              {name[0]?.toUpperCase() || 'U'}
            </span>
          )
        })}
        {remaining > 0 && (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold ring-2 ring-white shadow-xs">
            +{remaining}
          </span>
        )}
      </div>
      <span className="text-[11px] text-gray-500 font-medium">
        {list.length} {list.length === 1 ? 'person' : 'people'}
      </span>
    </div>
  )
}

export default function Trips() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [editingTrip, setEditingTrip] = useState(null)

  useEffect(() => {
    async function loadTrips() {
      try {
        const data = await tripService.getTrips()
        if (data.success && Array.isArray(data.trips)) {
          setTrips(data.trips)
        } else {
          setTrips([])
        }
      } catch (err) {
        console.error('Failed to load trips:', err)
        setTrips([])
      } finally {
        setLoading(false)
      }
    }
    loadTrips()
  }, [])

  const isTripOrganizer = (trip) => {
    if (!trip || !user) return false

    const currentUserId = String(user._id || user.id || '')
    const currentUserEmail = (user.email || '').toLowerCase()

    const organizerId = String(trip.organizer?._id || trip.organizer || '')
    const organizerEmail = (trip.organizer?.email || '').toLowerCase()

    if (organizerId && currentUserId && organizerId === currentUserId) return true
    if (organizerEmail && currentUserEmail && organizerEmail === currentUserEmail) return true

    if (Array.isArray(trip.participants)) {
      const org = trip.participants.find(p => p.role === 'organizer')
      if (org) {
        const pId = String(org.user?._id || org.user || '')
        const pEmail = (org.user?.email || org.email || '').toLowerCase()
        if (pId && currentUserId && pId === currentUserId) return true
        if (pEmail && currentUserEmail && pEmail === currentUserEmail) return true
      }
    }

    if (!trip.organizer) return true
    return false
  }

  const handleDeleteTripCard = async (trip) => {
    const tripId = trip._id || trip.id
    if (!window.confirm(`Are you sure you want to delete "${trip.name}"? This action will permanently delete the trip and remove all participants.`)) {
      return
    }

    try {
      const res = await tripService.deleteTrip(tripId)
      if (res.success) {
        setTrips(prev => prev.filter(t => (t._id || t.id) !== tripId))
      } else {
        toast.error(res.message || 'Failed to delete trip')
      }
    } catch (err) {
      console.error('Delete trip error:', err)
      toast.error(err.response?.data?.message || 'Error deleting trip.')
    }
  }

  const getTabCount = (tabName) => {
    if (tabName === 'All') return trips.length
    return trips.filter(t => getTripCategory(t).toLowerCase() === tabName.toLowerCase()).length
  }

  const filteredTrips = trips.filter(trip => {
    if (activeTab === 'All') return true
    const category = getTripCategory(trip)
    return category.toLowerCase() === activeTab.toLowerCase()
  })

  return (
    <ScreenLayout title="My Trips">
      <div className="screen-page space-y-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Upcoming', 'Ongoing', 'Past'].map((tab) => {
            const count = getTabCount(tab)
            const isSelected = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20 scale-102'
                    : 'bg-gray-100/80 hover:bg-emerald-50 text-gray-600 hover:text-emerald-800'
                }`}
              >
                <span>{tab}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isSelected ? 'bg-emerald-900/50 text-white' : 'bg-gray-200/80 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Trips Grid / Empty State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-gray-100 animate-pulse border border-gray-200" />
            ))}
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-state p-12 text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 space-y-4 my-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                No {activeTab.toLowerCase()} trips found
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Plan a new camping adventure with your friends to get started!
              </p>
            </div>
            <Link
              to="/trips/new"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 no-underline"
            >
              <FaPlus className="text-xs" />
              <span>Create Trip</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrips.map((trip) => {
              const tripId = trip._id || trip.id
              const category = getTripCategory(trip)
              const daysLabel = getDaysLabel(trip)
              const imageUrl = trip.image || trip.campsiteId?.images?.[0] || trip.campsiteId?.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'
              const dateStr = trip.date || (trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()}–${new Date(trip.endDate).toLocaleDateString()}` : 'TBD')
              const canEdit = isTripOrganizer(trip)

              return (
                <article
                  key={tripId}
                  onClick={() => navigate(`/trips/${tripId}`)}
                  className="trip-card group cursor-pointer border border-gray-200/80 hover:border-emerald-500/50 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Photo Header with Glassmorphism Overlays */}
                  <div className="trip-card-photo relative h-48 sm:h-52 overflow-hidden">
                    <img
                      src={getImageUrl(imageUrl)}
                      alt={trip.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:from-black/85 transition-colors" />

                    {/* Status Pill */}
                    <span className="absolute top-3 left-3 z-10 backdrop-blur-md bg-emerald-950/70 text-emerald-200 border border-emerald-400/30 px-2.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase shadow-md">
                      {category}
                    </span>

                    {/* Countdown Days Pill */}
                    {daysLabel && daysLabel.toLowerCase() !== category.toLowerCase() && (
                      <b className="absolute top-3 right-3 z-10 backdrop-blur-md bg-black/60 text-white border border-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md">
                        {daysLabel}
                      </b>
                    )}

                    {/* Title & Location Overlay */}
                    <div className="absolute bottom-3.5 left-3.5 right-3.5 z-10 space-y-1 text-white">
                      <h2 className="text-base sm:text-lg font-bold text-white drop-shadow-md line-clamp-1 leading-snug group-hover:text-emerald-300 transition-colors">
                        {trip.name}
                      </h2>
                      <p className="flex items-center gap-1.5 text-xs text-gray-200/90 font-medium drop-shadow-sm truncate">
                        <FaMapMarkerAlt className="text-emerald-400 shrink-0 text-xs" />
                        <span className="truncate">{trip.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="trip-card-body p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-100 pb-3 gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-gray-600 truncate">
                        <FaCalendarAlt className="text-emerald-600 text-xs shrink-0" />
                        <span className="truncate">{dateStr}</span>
                      </span>
                      <ParticipantAvatarStack participants={trip.participants} />
                    </div>

                    {/* Action Bar */}
                    <div className="trip-card-actions flex items-center gap-2 pt-0.5">
                      <span
                        className="flex-1 py-2 px-3 bg-emerald-50 group-hover:bg-emerald-700 text-emerald-800 group-hover:text-white rounded-xl text-xs font-bold text-center transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <span>View Details</span>
                        <FaArrowRight className="text-[11px] group-hover:translate-x-1 transition-transform" />
                      </span>

                      {canEdit && (
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            aria-label="Edit trip"
                            title="Edit Trip"
                            onClick={() => setEditingTrip(trip)}
                            className="w-8 h-8 rounded-xl border border-gray-200 hover:border-emerald-300 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            <FiEdit3 />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete trip"
                            title="Delete Trip"
                            onClick={() => handleDeleteTripCard(trip)}
                            className="w-8 h-8 rounded-xl border border-gray-200 hover:border-red-300 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      <EditTripModal
        trip={editingTrip}
        isOpen={Boolean(editingTrip)}
        onClose={() => setEditingTrip(null)}
        onSuccess={(updated) => {
          setTrips(prev => prev.map(t => (t._id || t.id) === (updated._id || updated.id) ? { ...t, ...updated } : t))
        }}
        onDelete={(deletedId) => {
          setTrips(prev => prev.filter(t => (t._id || t.id) !== deletedId))
        }}
      />
    </ScreenLayout>
  )
}
