import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaTrash, FaUsers } from 'react-icons/fa'
import { FiEdit3 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import EditTripModal from '../components/common/EditTripModal'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'

export const getTripCategory = (trip) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  const startDate = trip.startDate ? new Date(trip.startDate) : null
  const endDate = trip.endDate ? new Date(trip.endDate) : null

  // 1. If trip has ended or status is completed/past
  if (trip.status?.toLowerCase() === 'completed' || trip.status?.toLowerCase() === 'past' || (endDate && endDate < now)) {
    return 'past'
  }

  // 2. If trip starts in the future or is currently ongoing (startDate <= today <= endDate)
  if (startDate) {
    startDate.setHours(0, 0, 0, 0)
    if (startDate >= now || (endDate && startDate <= now && endDate >= now)) {
      return 'upcoming'
    }
  } else if (trip.status?.toLowerCase() === 'upcoming') {
    return 'upcoming'
  }

  // 3. Otherwise trip is in planning phase
  return 'planning'
}

export const getDaysLabel = (trip) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (!trip.startDate) return 'Planning'

  const startDate = new Date(trip.startDate)
  startDate.setHours(0, 0, 0, 0)

  const diffTime = startDate - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays > 0) return `${diffDays}d left`
  if (diffDays === 0) return 'Starts Today!'

  const endDate = trip.endDate ? new Date(trip.endDate) : null
  if (endDate && endDate >= now) return 'Ongoing'

  return 'Past'
}

export default function Trips() {
  const { user } = useAuth()
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
    if (!trip) return false
    if (!user) return false

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
        alert(res.message || 'Failed to delete trip')
      }
    } catch (err) {
      console.error('Delete trip error:', err)
      alert(err.response?.data?.message || 'Error deleting trip.')
    }
  }

  const filteredTrips = trips.filter(trip => {
    if (activeTab === 'All') return true
    const category = getTripCategory(trip)
    return category.toLowerCase() === activeTab.toLowerCase()
  })

  return (
    <ScreenLayout title="My Trips">
      <div className="screen-page">
        <div className="tabs-row">
          <div>
            {['All', 'Upcoming', 'Planning', 'Past'].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'selected' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <Link to="/trips/new" className="new-trip-button">＋ Create Trip</Link>
        </div>

        {loading ? (
          <p className="p-8 text-center text-gray-400">Loading trips...</p>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-state p-12 text-center border border-dashed rounded-2xl border-emerald-800/40 my-8">
            <h3 className="text-xl font-medium text-gray-200 mb-2">No {activeTab.toLowerCase()} trips found</h3>
            <p className="text-gray-400 mb-6">Plan a new camping adventure to get started!</p>
            <Link to="/trips/new" className="new-trip-button inline-block">＋ Create Trip</Link>
          </div>
        ) : (
          <div className="trip-card-grid">
            {filteredTrips.map((trip) => {
              const tripId = trip._id || trip.id
              const category = getTripCategory(trip)
              const daysLabel = getDaysLabel(trip)
              const imageUrl = trip.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'
              const readiness = trip.readiness || (category === 'past' ? 100 : 45)
              const dateStr = trip.date || (trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()}–${new Date(trip.endDate).toLocaleDateString()}` : 'TBD')
              const canEdit = isTripOrganizer(trip)

              return (
                <article className="trip-card" key={tripId}>
                  <div className="trip-card-photo">
                    <img src={imageUrl} alt={trip.name} />
                    <span className={`trip-status ${category}`}>{category}</span>
                    <b>{daysLabel}</b>
                    <div>
                      <h2>{trip.name}</h2>
                      <p>{trip.location}</p>
                    </div>
                  </div>
                  <div className="trip-card-body">
                    <p>
                      <FaCalendarAlt /> {dateStr}
                      <span><FaUsers /> {trip.participants?.length || trip.people || 1} people</span>
                    </p>
                    <div className="trip-card-progress">
                      <span>Trip readiness</span>
                      <b>{readiness}%</b>
                      <i><em style={{ width: `${readiness}%` }} /></i>
                    </div>
                    <div className="trip-card-actions">
                      <Link to={`/trips/${tripId}`}>View Details</Link>
                      {canEdit && (
                        <>
                          <button aria-label="Edit trip" onClick={() => setEditingTrip(trip)}>
                            <FiEdit3 />
                          </button>
                          <button
                            aria-label="Delete trip"
                            className="hover:text-red-500"
                            onClick={() => handleDeleteTripCard(trip)}
                          >
                            <FaTrash />
                          </button>
                        </>
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
