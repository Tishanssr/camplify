import { useEffect, useState } from 'react'
import { FaCheck, FaCheckCircle, FaClock, FaCrown, FaEdit, FaEnvelope, FaExclamationTriangle, FaMapMarkerAlt, FaPaperPlane, FaTimes, FaTint, FaUmbrella, FaUserPlus, FaWind } from 'react-icons/fa'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { tripService } from '../services/tripService'
import { checklistService } from '../services/checklistService'
import { weatherService } from '../services/weatherService'
import { invitationService } from '../services/invitationService'
import CampsiteMap from '../components/common/CampsiteMap'
import EditTripModal from '../components/common/EditTripModal'
import WeatherIcon from '../components/common/WeatherIcon'
import { geoapifyService } from '../services/geoapifyService'
import { getTripCategory, formatTime12h } from '../utils/dateUtils'
import { getImageUrl } from '../utils/imageUtils'

function TripHero({ trip, isOrganizer, isConfirmedParticipant, onOpenInvite, onOpenEdit }) {
  const imageUrl = trip.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'
  const category = getTripCategory(trip)
  const participantCount = trip.participants?.length || 1
  const dateStr = trip.date || (trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()}–${new Date(trip.endDate).toLocaleDateString()}` : 'Dates TBD')

  const today = new Date()
  const tripDate = new Date(trip.startDate || trip.date || Date.now())
  const daysUntil = Math.max(0, Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24)))

  let tripDurationDays = 1
  if (trip.startDate && trip.endDate) {
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    if (!isNaN(diffDays) && diffDays > 0) {
      tripDurationDays = diffDays
    }
  }

  return (
    <>
      <section className="trip-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(4,20,9,.68), rgba(4,20,9,.1)), url(${imageUrl})` }}>
        <span className={`trip-status ${category}`}>{category}</span>
        <h1>{trip.name}</h1>
        <p>{trip.location} · {dateStr} · {participantCount} participant{participantCount !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          {(isOrganizer || isConfirmedParticipant) && (
            <button onClick={onOpenEdit}>
              <FaEdit /> {isOrganizer ? 'Edit Trip' : 'Edit Details'}
            </button>
          )}
          {isOrganizer && <button onClick={onOpenInvite}><FaEnvelope /> Invite Campers</button>}
        </div>
      </section>
      <section className="trip-stat-row">
        <span><b>{daysUntil}</b><small>Days Until Trip</small><em>{dateStr}</em></span>
        <span><b>{tripDurationDays}</b><small>Trip Duration</small><em>{tripDurationDays === 1 ? '1 Day Adventure' : `${tripDurationDays} Days Adventure`}</em></span>
        <span><b>{participantCount}</b><small>Participants</small><em>Confirmed / Invited</em></span>
        <span><b>{trip.gear?.length || 7}</b><small>Equipment</small><em>Shared gear items</em></span>
      </section>
    </>
  )
}

function Overview({ trip, isOrganizer, onOpenInvite, weather, weatherLoading, weatherError, currentUserId, onDownloadMap, downloadingMap, onTripUpdated }) {
  const participantsList = trip.participants || []
  const [inlineEmail, setInlineEmail] = useState('')
  const [inlineLoading, setInlineLoading] = useState(false)
  const [inlineStatus, setInlineStatus] = useState(null)

  const handleInlineInviteSubmit = async (e) => {
    e.preventDefault()
    if (!inlineEmail.trim()) return

    setInlineLoading(true)
    setInlineStatus(null)
    try {
      const res = await tripService.inviteParticipant(trip._id, inlineEmail.trim())
      if (res.success) {
        setInlineStatus({ success: true, message: res.message || `Invitation sent to ${inlineEmail}` })
        setInlineEmail('')
        if (res.trip && onTripUpdated) {
          onTripUpdated(res.trip)
        }
      } else {
        setInlineStatus({ success: false, message: res.message || 'Could not send invitation.' })
      }
    } catch (err) {
      setInlineStatus({
        success: false,
        message: err.response?.data?.message || 'Could not send invitation.',
      })
    } finally {
      setInlineLoading(false)
    }
  }

  const pendingInvites = participantsList.filter(p => p.status === 'pending')
  const totalCount = participantsList.length
  const isPremium = trip.organizerIsPremium || trip.organizer?.isPremium

  return (
    <div className="trip-content-grid">
      <div className="overview-main">
        <section className="content-card">
          <h2>About This Trip</h2>
          <p>{trip.description || 'A camping adventure exploring trail points, campsites, and local nature.'}</p>
        </section>

        {/* Offline Campsite Map Section - Hidden for custom location trips (!trip.campsiteId) */}
        {trip.campsiteId && (
          <section className="content-card">
            <h2>Offline Campsite Map</h2>
            {!trip.campsiteHasOfflineMap ? (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                <span>🗺️ No offline PDF map has been uploaded for this campsite yet by system admins.</span>
              </div>
            ) : trip.organizerIsPremium ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                    📄 Official Campsite PDF Map Ready
                  </h3>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Unlocked by trip organizer's Premium membership. Download to access offline during your trip.
                  </p>
                </div>
                <button
                  onClick={onDownloadMap}
                  disabled={downloadingMap}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {downloadingMap ? 'Downloading PDF...' : '📥 Download Offline Map (PDF)'}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    🔒 Offline Map Locked (Premium Feature)
                  </h3>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    An official offline PDF map is available for this campsite! The trip organizer requires an active Premium plan to unlock offline map downloads for all trip members.
                  </p>
                </div>
                <Link
                  to="/pricing"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 text-center cursor-pointer"
                >
                  {isOrganizer ? 'Upgrade to Premium →' : 'View Premium Details →'}
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Dynamic Weather Section bound to campsite/destination coordinates */}

        <section className="content-card">
          <h2>5-Day Weather Forecast ({trip.location})</h2>
          {weatherLoading ? (
            <p className="text-xs text-gray-400 animate-pulse py-4">Loading live weather forecast for {trip.location}...</p>
          ) : weatherError ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
              <FaExclamationTriangle className="text-amber-600" />
              <span>{weatherError}</span>
            </div>
          ) : weather && weather.forecast && weather.forecast.length > 0 ? (
            <div className="trip-forecast flex items-center gap-4 overflow-x-auto py-2">
              {weather.forecast.map((dayItem, idx) => (
                <span key={idx} className="flex flex-col items-center min-w-[60px] p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <small className="text-[11px] font-semibold text-gray-500">{dayItem.day}</small>
                  <WeatherIcon condition={dayItem.condition} className="my-1.5 text-base text-amber-400" />
                  <strong className="text-xs font-bold text-gray-800">{dayItem.temp}°C</strong>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">No weather forecast data available.</p>
          )}

          {weather && (
            <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 flex flex-wrap items-center justify-between gap-2">
              <span>
                Current conditions: <b>{weather.temp}°C · {weather.description || weather.condition}</b>
              </span>
              <div className="flex items-center gap-3 text-[11px] text-emerald-800 font-semibold">
                <span title="Rain Chance"><FaUmbrella className="inline mr-1 text-emerald-600" />{weather.rainProbability || 0}% Rain</span>
                <span title="Wind Speed"><FaWind className="inline mr-1 text-emerald-600" />{weather.windSpeed} km/h</span>
                <span title="Humidity"><FaTint className="inline mr-1 text-emerald-600" />{weather.humidity}%</span>
              </div>
            </div>
          )}
        </section>


        {isOrganizer && (
          <section className="content-card bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 border border-emerald-100 shadow-xs rounded-2xl p-5 space-y-4">
            {/* Header with Title & Capacity Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100/80 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 m-0 border-none pb-0">
                  <FaUserPlus className="text-emerald-700 text-sm" /> Invite Participants
                  <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Organizer Only
                  </span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Send instant email invitations to campers so they can join your trip.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200/80 shadow-2xs self-start sm:self-auto">
                {isPremium ? (
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <FaCrown className="text-amber-400 text-xs" /> Unlimited Slots
                  </span>
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-900 block">
                      {totalCount} / 10 Campers
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Free Plan Capacity</span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Interactive Email Invite Form */}
            <form onSubmit={handleInlineInviteSubmit} className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="email"
                    required
                    placeholder="Enter camper's email address (e.g. friend@example.com)..."
                    value={inlineEmail}
                    onChange={(e) => setInlineEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 rounded-xl text-xs outline-none transition-all placeholder:text-gray-400 shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inlineLoading}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-700/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <FaPaperPlane className="text-xs" />
                  <span>{inlineLoading ? 'Sending...' : 'Send Email Invite'}</span>
                </button>
              </div>
            </form>

            {/* Inline Status Message */}
            {inlineStatus && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all ${
                  inlineStatus.success
                    ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {inlineStatus.success ? <FaCheckCircle className="text-emerald-700 text-sm shrink-0" /> : <FaExclamationTriangle className="text-red-500 text-sm shrink-0" />}
                  {inlineStatus.message}
                </span>
                <button
                  type="button"
                  onClick={() => setInlineStatus(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-bold ml-2 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Pending Invitations Activity List */}
            {pendingInvites.length > 0 && (
              <div className="pt-2 border-t border-emerald-100/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                  <span className="flex items-center gap-1 text-emerald-900">
                    <FaClock className="text-amber-500 text-xs" /> Pending Email Invitations ({pendingInvites.length})
                  </span>
                  <button
                    type="button"
                    onClick={onOpenInvite}
                    className="text-[11px] text-emerald-700 hover:underline cursor-pointer font-bold"
                  >
                    Open Dialog →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pendingInvites.map((p, idx) => (
                    <div
                      key={p._id || idx}
                      className="p-2.5 bg-white/90 rounded-xl border border-emerald-100 text-xs flex items-center justify-between shadow-2xs"
                    >
                      <span className="font-semibold text-gray-800 flex items-center gap-2 truncate">
                        <FaEnvelope className="text-emerald-600 shrink-0 text-xs" />
                        <span className="truncate">{p.email}</span>
                      </span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full shrink-0">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      <aside className="overview-side">
        <section className="content-card bg-white border border-gray-200 p-4">
          <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-1.5">
            <FaMapMarkerAlt className="text-emerald-700 text-xs" /> Meeting Point
          </h2>
          <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 shadow-sm">
            <CampsiteMap
              lat={trip.meetingCoordinates?.lat || (trip.meetingPoint ? undefined : trip.coordinates?.lat)}
              lng={trip.meetingCoordinates?.lng || (trip.meetingPoint ? undefined : trip.coordinates?.lng)}
              locationName={trip.meetingPoint || trip.location || 'Meeting Point'}
              height="200px"
              zoom={13}
            />
          </div>
          <b className="text-xs font-extrabold text-gray-900 block leading-snug">
            {trip.meetingPoint || trip.location || 'Campsite Trailhead'}
          </b>
          <p className="text-xs font-semibold text-gray-700 mt-1.5 leading-normal">
            {trip.location ? `Destination: ${trip.location}` : 'Meeting Area'}
          </p>

          {trip.meetingCoordinates?.lat && trip.coordinates?.lat && (
            <div className="mt-2.5 p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-1.5">
              <span>🚗 {geoapifyService.getHaversineDistanceKm(trip.meetingCoordinates.lat, trip.meetingCoordinates.lng, trip.coordinates.lat, trip.coordinates.lng)} KM</span>
              <span className="text-[10px] text-emerald-700 font-medium">to destination</span>
            </div>
          )}

          <span className="inline-block mt-2.5 px-3 py-1 bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm">
            Meet at {formatTime12h(trip.meetingTime || '07:30')}
          </span>
        </section>




        <section className="content-card">
          <h2>Participants ({participantsList.length})</h2>
          {participantsList.length === 0 ? (
            <p className="text-xs text-gray-400">No participants added yet.</p>
          ) : (
            participantsList.map((p, idx) => {
              const pName = p.user?.name || p.email || (idx === 0 ? 'Organizer' : 'Participant')
              const role = p.role || (idx === 0 ? 'Organizer' : 'Participant')
              const status = p.status || 'confirmed'
              const profileUserId = p.user?._id || p.user
              const isSelf = profileUserId && currentUserId && String(profileUserId) === String(currentUserId)

              const innerContent = (
                <div className="flex items-center gap-2.5 min-w-0">
                  {p.user?.profilePicture ? (
                    <img
                      src={getImageUrl(p.user.profilePicture)}
                      alt={pName}
                      className="w-7 h-7 rounded-full object-cover shrink-0 shadow-xs"
                    />
                  ) : (
                    <i className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 not-italic">
                      {pName[0]?.toUpperCase() || 'U'}
                    </i>
                  )}
                  <div className="min-w-0 flex flex-col justify-center">
                    <b className="text-xs text-gray-800 font-semibold block truncate leading-snug">
                      {pName}
                      {isSelf && <span className="text-[10px] text-emerald-700 font-normal ml-1">(You)</span>}
                    </b>
                    <small className="text-[10px] text-gray-400 capitalize block truncate">{role}</small>
                  </div>
                </div>
              )

              return (
                <div className="participant-mini flex items-center justify-between py-2 border-b border-gray-50 last:border-0" key={p._id || idx}>
                  {profileUserId && !isSelf ? (
                    <Link
                      to={`/profile/${profileUserId}`}
                      className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                      style={{ textDecoration: 'none' }}
                    >
                      {innerContent}
                    </Link>
                  ) : (
                    innerContent
                  )}
                  <em className={`text-[10px] font-bold px-2 py-0.5 rounded-full not-italic capitalize shrink-0 ml-2 ${status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                    {status}
                  </em>
                </div>
              )
            })
          )}

          {isOrganizer && (
            <button className="text-xs font-semibold text-emerald-700 mt-3 block hover:underline" onClick={onOpenInvite}>
              + Invite Registered User →
            </button>
          )}
        </section>
      </aside>
    </div>
  )
}

function Checklist({ trip, tripId, participants, isOrganizer, isConfirmedParticipant, currentUser }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [assignModalItem, setAssignModalItem] = useState(null)
  const [editModalItem, setEditModalItem] = useState(null)
  const [editFormData, setEditFormData] = useState({ name: '', quantity: '1', description: '' })
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', description: '', assignedTo: '' })
  const [statusMsg, setStatusMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const { subscribeToSSEEvents } = useNotification()

  const loadGroupChecklist = async () => {
    if (!tripId) return
    try {
      const data = await checklistService.getGroupChecklist(tripId)
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items)
      } else if (data.success && Array.isArray(data.groups)) {
        let flat = []
        data.groups.forEach(g => { if (Array.isArray(g.items)) flat.push(...g.items) })
        setItems(flat)
      }
    } catch (err) {
      console.error('Failed to load group checklist:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGroupChecklist()
  }, [tripId])

  useEffect(() => {
    if (!subscribeToSSEEvents) return
    const unsubscribe = subscribeToSSEEvents((eventName, data) => {
      if (eventName === 'checklist_update' && String(data.tripId) === String(tripId)) {
        loadGroupChecklist()
      }
    })
    return () => unsubscribe()
  }, [tripId, subscribeToSSEEvents])

  const handleToggle = async (itemId, currentState, isMyAssignment) => {
    if (!isOrganizer && !isMyAssignment) {
      setErrorMsg('You can only mark equipment assigned to yourself as packed.')
      setTimeout(() => setErrorMsg(''), 3500)
      return
    }
    try {
      setItems(prev => prev.map(i => i._id === itemId ? { ...i, done: !currentState } : i))
      const res = await checklistService.toggleGroupItem(tripId, itemId, !currentState)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
      } else if (!res.success) {
        setErrorMsg(res.message || 'Failed to update item status')
        loadGroupChecklist()
      }
    } catch (err) {
      console.error('Failed to toggle item:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to update item status')
      loadGroupChecklist()
    }
  }

  const handleAssign = async (itemId, targetUserId) => {
    try {
      const res = await checklistService.assignEquipment(tripId, itemId, targetUserId)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
        setStatusMsg('Equipment assignment updated!')
        setTimeout(() => setStatusMsg(''), 3000)
      } else {
        setErrorMsg(res.message || 'Failed to update assignment')
        setTimeout(() => setErrorMsg(''), 3000)
      }
      setAssignModalItem(null)
    } catch (err) {
      console.error('Failed to assign item:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to update assignment')
      setTimeout(() => setErrorMsg(''), 3000)
    }
  }

  const handleDelete = async (itemId) => {
    try {
      const res = await checklistService.deleteGroupItem(tripId, itemId)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
        setStatusMsg('Equipment item deleted!')
        setTimeout(() => setStatusMsg(''), 3000)
      } else {
        setErrorMsg(res.message || 'Failed to delete item')
      }
    } catch (err) {
      console.error('Failed to delete item:', err)
      setErrorMsg(err.response?.data?.message || 'Failed to delete item')
    }
  }

  const handleAddItemSubmit = async (e) => {
    e.preventDefault()
    if (!newItem.name.trim()) return
    setErrorMsg('')
    try {
      const res = await checklistService.addGroupChecklistItem(tripId, newItem)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
        setNewItem({ name: '', quantity: '1', description: '', assignedTo: '' })
        setAddItemModalOpen(false)
        setStatusMsg('Equipment item added!')
        setTimeout(() => setStatusMsg(''), 3000)
      } else if (res.limitReached) {
        setErrorMsg(res.message || 'Free plan limit reached (6 items max).')
      } else {
        setErrorMsg(res.message || 'Failed to add equipment item.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to add equipment item.')
    }
  }

  const openEditModal = (item) => {
    setEditModalItem(item)
    setEditFormData({
      name: item.name || '',
      quantity: item.quantity || '1',
      description: item.description || '',
    })
  }

  const handleEditItemSubmit = async (e) => {
    e.preventDefault()
    if (!editFormData.name.trim() || !editModalItem) return
    setErrorMsg('')
    try {
      const res = await checklistService.editGroupItem(tripId, editModalItem._id, editFormData)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
        setEditModalItem(null)
        setStatusMsg('Equipment item updated!')
        setTimeout(() => setStatusMsg(''), 3000)
      } else {
        setErrorMsg(res.message || 'Failed to edit equipment item.')
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to edit equipment item.')
    }
  }

  const myUserId = currentUser ? String(currentUser._id || currentUser.id) : null
  const totalItems = items.length
  const doneItems = items.filter(i => i.done).length
  const myItemsCount = items.filter(i => i.assignedTo && String(i.assignedTo) === myUserId).length
  const unassignedCount = items.filter(i => !i.assignedTo).length
  const remainingCount = totalItems - doneItems
  const sharedItems = items.filter(i => i.assignedTo).length
  const readinessPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const participantList = Array.isArray(participants) ? participants : []
  const confirmedParticipants = participantList.filter(p => p.status === 'confirmed' || p.status === 'accepted')

  // Search and Tab Filtering
  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase().trim()
    if (q) {
      const matchName = item.name.toLowerCase().includes(q)
      const matchDesc = (item.description || '').toLowerCase().includes(q)
      const matchAssignee = (item.assignedName || '').toLowerCase().includes(q)
      if (!matchName && !matchDesc && !matchAssignee) return false
    }

    if (filterTab === 'mine') {
      return item.assignedTo && String(item.assignedTo) === myUserId
    }
    if (filterTab === 'unassigned') {
      return !item.assignedTo
    }
    if (filterTab === 'packed') {
      return item.done
    }
    if (filterTab === 'remaining') {
      return !item.done
    }
    return true
  })

  return (
    <div className="space-y-5">
      {/* Toast Notifications */}
      {statusMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-bold rounded-2xl text-center shadow-xs backdrop-blur-sm animate-fade-in flex items-center justify-center gap-2">
          <span>✓</span> {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-700 text-xs font-bold rounded-2xl text-center shadow-xs backdrop-blur-sm animate-fade-in flex items-center justify-center gap-2">
          <span>Error:</span> {errorMsg}
        </div>
      )}

      {/* Free Plan Limit Warning */}
      {!trip?.organizerIsPremium && items.length >= 6 && (
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-900 text-xs font-semibold rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[10px] uppercase">Notice</span>
            <span><b>Free Plan Limit Reached</b> ({items.length}/6 items). Upgrade to Premium for unlimited shared equipment.</span>
          </div>
          <Link to="/pricing" className="px-4 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shrink-0 shadow-xs transition-transform hover:scale-105">
            Upgrade →
          </Link>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-500 to-teal-600" />
        <div className="flex items-center gap-3.5 pl-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Group Equipment Checklist</h2>
            <p className="text-xs text-gray-500 font-medium">Coordinate shared camping gear and assign equipment to participants</p>
          </div>
        </div>
        {isOrganizer && (
          <button
            onClick={() => setAddItemModalOpen(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-sm font-extrabold">+</span> Add Equipment Item
          </button>
        )}
      </div>

      {/* Interactive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Main List Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search equipment or assignee..."
                className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200/80 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
              {[
                { id: 'all', label: 'All', count: totalItems },
                { id: 'mine', label: 'My Gear', count: myItemsCount },
                { id: 'unassigned', label: 'Unassigned', count: unassignedCount },
                { id: 'remaining', label: 'Remaining', count: remainingCount },
                { id: 'packed', label: 'Packed', count: doneItems },
              ].map(tab => {
                const isActive = filterTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFilterTab(tab.id)}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 text-[11px] ${
                      isActive
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs font-bold'
                        : 'bg-gray-50 border-gray-200/80 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200/70 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Checklist Items Container */}
          {loading ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-200/80 text-center shadow-xs">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-medium">Loading group checklist...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 text-center shadow-xs space-y-2">
              <p className="text-xs font-bold text-gray-700">
                {items.length === 0
                  ? 'No equipment items added yet'
                  : 'No equipment matching your filters'}
              </p>
              <p className="text-[11px] text-gray-400">
                {items.length === 0
                  ? isOrganizer ? 'Click "+ Add Equipment Item" above to add gear for your trip.' : 'The trip organizer has not added shared gear yet.'
                  : 'Try adjusting your search query or selecting a different filter tab.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item) => {
                const isMyAssignment = currentUser && item.assignedTo && String(item.assignedTo) === String(currentUser._id || currentUser.id)
                const canToggle = isOrganizer || isMyAssignment
                const canClaim = !isOrganizer && isConfirmedParticipant && !item.assignedTo

                let borderAccent = 'border-l-amber-400'
                if (item.done) borderAccent = 'border-l-emerald-500'
                else if (isMyAssignment) borderAccent = 'border-l-teal-500'
                else if (item.assignedTo) borderAccent = 'border-l-blue-400'

                return (
                  <div
                    key={item._id || item.name}
                    className={`bg-white p-4 rounded-2xl border border-gray-200/80 border-l-4 ${borderAccent} shadow-xs hover:shadow-md hover:border-gray-300/80 transition-all duration-200 flex flex-wrap items-center justify-between gap-3 ${
                      item.done ? 'bg-emerald-50/15' : ''
                    }`}
                  >
                    {/* Item Info & Checkbox */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <button
                        type="button"
                        disabled={!canToggle}
                        onClick={() => handleToggle(item._id, item.done, isMyAssignment)}
                        title={!canToggle ? "Only assigned user or organizer can mark this as packed" : "Toggle packing status"}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          item.done
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : canToggle
                            ? 'border-gray-300 bg-gray-50 hover:border-emerald-500 hover:bg-emerald-50/30'
                            : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {item.done && (
                          <svg className="w-3.5 h-3.5 stroke-current stroke-[3]" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${item.done ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                            {item.name}
                          </span>
                          <span className="bg-gray-100/80 text-gray-600 border border-gray-200/60 px-2 py-0.2 rounded-md text-[10px] font-bold">
                            Qty: {item.quantity || '1'}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 font-medium truncate">
                            Note: {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Assignee & Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Assignee Pill */}
                      {item.assignedName ? (
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5 shadow-2xs ${
                            isMyAssignment
                              ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-300/80'
                              : 'bg-blue-50 text-blue-700 border border-blue-200/80'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current" />
                          <span>Assigned: {item.assignedName}</span>
                        </span>
                      ) : canClaim ? (
                        <button
                          type="button"
                          onClick={() => currentUser && handleAssign(item._id, currentUser._id || currentUser.id)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-[11px] rounded-xl shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                        >
                          Claim Gear
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 border-dashed px-2.5 py-1 rounded-xl">
                          Unassigned
                        </span>
                      )}

                      {/* Organizer Actions */}
                      {isOrganizer && (
                        <div className="flex items-center gap-1.5 border-l border-gray-200/80 pl-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="text-[11px] font-bold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 border border-gray-200/80 hover:border-emerald-300 rounded-xl transition-all cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setAssignModalItem(item)}
                            className="text-[11px] font-bold text-gray-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 border border-gray-200/80 hover:border-blue-300 rounded-xl transition-all cursor-pointer"
                          >
                            Assign
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 border border-transparent hover:border-red-200 rounded-xl transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Packing Overview Sidebar Card */}
        <aside className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4 sticky top-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              Packing Overview
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              readinessPct === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
            }`}>
              {readinessPct}% Complete
            </span>
          </div>

          <div className="text-center py-2 space-y-2">
            <div className="text-4xl font-black tracking-tight text-gray-900">
              <span className="text-emerald-600">{doneItems}</span>
              <span className="text-gray-300 text-2xl font-light"> / </span>
              <span className="text-gray-700">{totalItems}</span>
            </div>

            <p className="text-xs font-semibold text-gray-600">
              {totalItems === 0
                ? 'No equipment items yet'
                : readinessPct === 100
                ? 'All equipment packed and ready!'
                : `${remainingCount} item${remainingCount === 1 ? '' : 's'} remaining to be packed`}
            </p>

            {/* Smooth Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${readinessPct}%` }}
              />
            </div>
          </div>

          {/* Quick Stat Cards Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/70 text-center">
              <b className="text-sm font-black text-emerald-800 block">{doneItems}</b>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Packed</span>
            </div>
            <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/70 text-center">
              <b className="text-sm font-black text-amber-800 block">{remainingCount}</b>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Remaining</span>
            </div>
            <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/70 text-center">
              <b className="text-sm font-black text-blue-800 block">{sharedItems}</b>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Assigned</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Equipment Item Modal */}
      {addItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Add Equipment Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-3.5">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center justify-between">
                  <span>⚠ {errorMsg}</span>
                  <Link to="/pricing" className="text-xs font-bold text-red-800 underline">Upgrade →</Link>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Camp Lantern, Water Filter"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                <input
                  type="text"
                  placeholder="1, 2x, etc."
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., 4-person dome tent, blue color"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assign To (Optional)</label>
                <select
                  value={newItem.assignedTo}
                  onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Unassigned (Anyone can claim)</option>
                  {confirmedParticipants.map((p, idx) => {
                    const pId = p.user?._id || p.user?.id || p._id || p.id
                    const pName = p.user?.name || p.email || `Participant ${idx + 1}`
                    return (
                      <option key={pId || idx} value={pId}>
                        {pName}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Equipment Item Modal (Organizer Only) */}
      {editModalItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Edit Equipment Item</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditModalItem(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditItemSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Camp Lantern"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Quantity</label>
                <input
                  type="text"
                  placeholder="1, 2x, etc."
                  value={editFormData.quantity}
                  onChange={(e) => setEditFormData({ ...editFormData, quantity: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g., 4-person dome tent"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditModalItem(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Update Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Gear Modal (Organizer Only) */}
      {assignModalItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Assign "{assignModalItem.name}"</h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalItem(null)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-gray-600 font-medium">Select a participant to assign this equipment to:</p>

              <button
                type="button"
                onClick={() => handleAssign(assignModalItem._id, '')}
                className="w-full text-left p-3.5 border border-gray-200/80 rounded-2xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all cursor-pointer flex items-center justify-between"
              >
                <span>Unassign (Anyone can claim)</span>
                <span className="text-gray-400 text-xs">⚡</span>
              </button>

              {confirmedParticipants.map((p, idx) => {
                const pId = p.user?._id || p.user?.id || p._id || p.id
                const pName = p.user?.name || p.email || `Participant ${idx + 1}`
                const isCurrent = assignModalItem.assignedTo && String(assignModalItem.assignedTo) === String(pId)
                return (
                  <button
                    key={pId || idx}
                    type="button"
                    onClick={() => handleAssign(assignModalItem._id, pId)}
                    className={`w-full text-left p-3.5 border rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                        : 'border-gray-200/80 text-gray-800 hover:bg-emerald-50/50 hover:border-emerald-300'
                    }`}
                  >
                    <span>{pName}</span>
                    {isCurrent && <span className="text-emerald-700 text-xs font-bold">✓ Assigned</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Equipment({ gear }) {
  const gearItems = Array.isArray(gear) && gear.length > 0 ? gear : ['4-person tent', 'Sleeping bags ×4', 'Camp stove + fuel', 'First aid kit', 'Water filter']

  return (
    <section className="equipment-card">
      <div className="card-title flex items-center justify-between">
        <h2>Equipment List ({gearItems.length})</h2>
        <button className="hover:bg-emerald-800 transition-colors">+ Add Item</button>
      </div>
      {gearItems.map((item, index) => (
        <div className="equipment-row" key={index}>
          <div>
            <b>{typeof item === 'string' ? item : item.name}</b>
            <small>Assigned gear item</small>
          </div>
          <em className="confirmed">confirmed</em>
        </div>
      ))}
    </section>
  )
}

function Participants({ trip, participants, isOrganizer, onOpenInvite, currentUserId }) {
  const participantsList = Array.isArray(participants) && participants.length > 0 ? participants : []

  return (
    <section className="equipment-card border border-gray-100 rounded-xl bg-white shadow-xs overflow-hidden">
      {!trip?.organizerIsPremium && participantsList.length >= 10 && (
        <div className="p-3.5 mx-5 mt-4 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl flex items-center justify-between gap-3">
          <span>⚠️ Free Plan Participant Limit Reached (10/10 total participants including organizer). Upgrade to Premium to invite more campers.</span>
          <Link to="/pricing" className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shrink-0">
            Upgrade Plan →
          </Link>
        </div>
      )}

      <div className="card-title flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">

        <h2 className="text-sm sm:text-base font-bold text-gray-800 m-0">All Participants ({participantsList.length})</h2>
        {isOrganizer && (
          <button onClick={onOpenInvite} className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs">
            <span>＋</span> Invite Registered User
          </button>
        )}
      </div>
      {participantsList.length === 0 ? (
        <p className="p-6 text-xs text-gray-400 text-center m-0">No participants found.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {participantsList.map((person, idx) => {
            const pName = person.user?.name || person.email || (idx === 0 ? 'Organizer' : 'Participant')
            const role = person.role || (idx === 0 ? 'Organizer' : 'Participant')
            const status = person.status || 'confirmed'
            const profileUserId = person.user?._id || person.user
            const isSelf = profileUserId && currentUserId && String(profileUserId) === String(currentUserId)

            const inner = (
              <div className="flex items-center gap-3.5 min-w-0">
                {person.user?.profilePicture ? (
                  <img
                    src={getImageUrl(person.user.profilePicture)}
                    alt={pName}
                    className="w-9 h-9 rounded-full object-cover shrink-0 shadow-xs"
                  />
                ) : (
                  <i className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 not-italic shadow-xs">
                    {pName[0]?.toUpperCase() || 'U'}
                  </i>
                )}
                <div className="min-w-0 flex flex-col justify-center">
                  <b className="text-xs sm:text-sm font-semibold text-gray-800 block truncate leading-tight">
                    {pName}
                    {isSelf && <span className="text-xs text-emerald-700 font-normal ml-1.5">(You)</span>}
                  </b>
                  <small className="text-[11px] text-gray-500 mt-0.5 block truncate capitalize">{role} · {person.user?.email || person.email || 'Registered User'}</small>
                </div>
              </div>
            )

            return (
              <div className="participant-row flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors" key={person._id || idx}>
                {profileUserId && !isSelf ? (
                  <Link
                    to={`/profile/${profileUserId}`}
                    className="flex items-center gap-3.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                    style={{ textDecoration: 'none' }}
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
                <em className={`text-[10px] font-bold px-2.5 py-1 rounded-full not-italic capitalize shrink-0 ml-3 ${status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                  {status}
                </em>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}


export default function TripDetail() {
  const { user } = useAuth()
  const { subscribeToSSEEvents } = useNotification()
  const navigate = useNavigate()
  const { tripId, tab = 'overview' } = useParams()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState(null)

  const [accessDeniedInfo, setAccessDeniedInfo] = useState(null)
  const [respondingInvite, setRespondingInvite] = useState(false)

  const [trip, setTrip] = useState({
    id: tripId,
    name: 'Camping Trip Details',
    location: 'Campsite Destination',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    participants: [],
  })

  const loadTrip = async () => {
    if (!tripId) return
    try {
      const data = await tripService.getTripById(tripId)
      if (data.success && data.trip) {
        setTrip(data.trip)
        setAccessDeniedInfo(null)

        // Load live weather for trip destination coordinates / location
        setWeatherLoading(true)
        setWeatherError(null)
        try {
          const lat = data.trip.coordinates?.lat || data.trip.campsiteId?.coordinates?.lat
          const lng = data.trip.coordinates?.lng || data.trip.campsiteId?.coordinates?.lng
          const wRes = await weatherService.getWeather(lat, lng, data.trip.location)
          if (wRes.success && wRes.weather) {
            setWeather(wRes.weather)
          } else {
            setWeatherError(wRes.message || 'Weather unavailable')
            setWeather(null)
          }
        } catch (wErr) {
          console.error('Failed to load trip weather:', wErr)
          setWeatherError('Could not load weather')
          setWeather(null)
        } finally {
          setWeatherLoading(false)
        }
      } else if (data.accessDenied || data.isPendingInvite) {
        setAccessDeniedInfo(data)
      } else {
        setAccessDeniedInfo({ accessDenied: true, message: data.message || 'Trip not found or access restricted.' })
      }
    } catch (err) {
      console.error('Failed to load trip details:', err)
      setAccessDeniedInfo({ accessDenied: true, message: 'Failed to load trip details.' })
    }
  }

  useEffect(() => {
    loadTrip()

    // Real-time listener for SSE trip updates
    const unsubscribe = subscribeToSSEEvents((eventName, data) => {
      if (eventName === 'trip_update' && String(data.tripId) === String(tripId)) {
        console.log('[TripDetail] Real-time trip update received, refreshing trip data...')
        loadTrip()
      }
    })

    return () => unsubscribe()
  }, [tripId, subscribeToSSEEvents])

  const handleAcceptPendingInvite = async () => {
    setRespondingInvite(true)
    try {
      if (accessDeniedInfo.invitationId) {
        await invitationService.respondInvitation(accessDeniedInfo.invitationId, 'accepted')
      } else {
        await invitationService.acceptByCode(tripId)
      }
      setAccessDeniedInfo(null)
      loadTrip()
    } catch (err) {
      console.error('Failed to accept invitation:', err)
    } finally {
      setRespondingInvite(false)
    }
  }

  const handleDeclinePendingInvite = async () => {
    setRespondingInvite(true)
    try {
      if (accessDeniedInfo.invitationId) {
        await invitationService.respondInvitation(accessDeniedInfo.invitationId, 'rejected')
      }
      navigate('/trips')
    } catch (err) {
      console.error('Failed to decline invitation:', err)
    } finally {
      setRespondingInvite(false)
    }
  }

  const organizerId = trip.organizer?._id || trip.organizer
  const isOrganizer = Boolean(
    !trip.organizer ||
    (user && (String(organizerId) === String(user._id || user.id) || trip.organizer?.email === user.email))
  )

  const isConfirmedParticipant = Boolean(
    (trip.participants || []).some(
      (p) =>
        (String(p.user?._id || p.user) === String(user?._id || user?.id) || p.email === user?.email) &&
        (p.status === 'confirmed' || p.status === 'accepted')
    )
  )


  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    setLoading(true)
    setInviteStatus(null)
    try {
      const res = await tripService.inviteParticipant(tripId, emailInput)
      if (res.success) {
        setInviteStatus({ success: true, message: res.message || `Invitation sent successfully!` })
        if (res.trip) {
          setTrip(res.trip)
        }
        setEmailInput('')
      } else {
        setInviteStatus({ success: false, message: res.message || 'Could not send invitation.' })
      }
    } catch (err) {
      setInviteStatus({
        success: false,
        message: err.response?.data?.message || 'Could not send invitation.',
      })
    } finally {
      setLoading(false)
    }
  }



  if (accessDeniedInfo) {
    if (accessDeniedInfo.isPendingInvite) {
      return (
        <ScreenLayout title="Trip Invitation">
          <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-200 shadow-xl text-center space-y-4">
            <h1 className="text-xl font-extrabold text-gray-900">Trip Invitation Pending</h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              You have been invited by <b>{accessDeniedInfo.organizerName}</b> to join <b>{accessDeniedInfo.tripName}</b> in <b>{accessDeniedInfo.location}</b>.
            </p>
            <p className="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl font-semibold border border-amber-200">
              You must accept the trip invitation before accessing trip details, gear checklists, and participant information.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={respondingInvite}
                onClick={handleDeclinePendingInvite}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={respondingInvite}
                onClick={handleAcceptPendingInvite}
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {respondingInvite ? 'Joining...' : 'Accept Invitation'}
              </button>
            </div>
          </div>
        </ScreenLayout>
      )
    }

    return (
      <ScreenLayout title="Access Restricted">
        <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-200 shadow-xl text-center space-y-4">
          <h1 className="text-xl font-extrabold text-gray-900">Access Restricted</h1>
          <p className="text-xs text-gray-600 leading-relaxed">
            {accessDeniedInfo.message || 'You do not have permission to view this trip.'}
          </p>
          <Link
            to="/trips"
            className="inline-block px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            ← Back to My Trips
          </Link>
        </div>
      </ScreenLayout>
    )
  }

  const [downloadingMap, setDownloadingMap] = useState(false)

  const handleDownloadMap = async () => {
    try {
      setDownloadingMap(true)
      const blob = await tripService.downloadCampsiteMap(trip._id || tripId)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      const safeName = (trip.name || 'Campsite').replace(/[^a-zA-Z0-9_-]/g, '_')
      link.setAttribute('download', `${safeName}_Offline_Map.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('Failed to download offline map: ' + (err.response?.data?.message || err.message || 'Error'))
    } finally {
      setDownloadingMap(false)
    }
  }

  const content = {
    overview: (
      <Overview
        trip={trip}
        isOrganizer={isOrganizer}
        onOpenInvite={() => setInviteModalOpen(true)}
        weather={weather}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        currentUserId={user?._id}
        onDownloadMap={handleDownloadMap}
        downloadingMap={downloadingMap}
        onTripUpdated={(updated) => setTrip(prev => ({ ...prev, ...updated }))}
      />
    ),
    checklist: (
      <div className="py-6">
        <Checklist
          trip={trip}
          tripId={tripId}
          participants={trip.participants}
          isOrganizer={isOrganizer}
          isConfirmedParticipant={isConfirmedParticipant}
          currentUser={user}
        />
      </div>
    ),
    equipment: (
      <div className="py-6">
        <Equipment gear={trip.gear} />
      </div>
    ),
    participants: (
      <div className="py-6">
        <Participants
          trip={trip}
          participants={trip.participants}
          isOrganizer={isOrganizer}
          onOpenInvite={() => setInviteModalOpen(true)}
          currentUserId={user?._id}
        />
      </div>
    ),
  }[tab] || (
    <Overview
      trip={trip}
      isOrganizer={isOrganizer}
      onOpenInvite={() => setInviteModalOpen(true)}
      weather={weather}
      weatherLoading={weatherLoading}
      weatherError={weatherError}
      currentUserId={user?._id}
      onDownloadMap={handleDownloadMap}
      downloadingMap={downloadingMap}
      onTripUpdated={(updated) => setTrip(prev => ({ ...prev, ...updated }))}
    />
  )



  return (
    <ScreenLayout title={trip.name}>
      <div className="trip-page">
        <TripHero
          trip={trip}
          isOrganizer={isOrganizer}
          isConfirmedParticipant={isConfirmedParticipant}
          onOpenInvite={() => setInviteModalOpen(true)}
          onOpenEdit={() => setEditModalOpen(true)}
        />
        <nav className="trip-tabs">
          {['overview', 'checklist', 'equipment', 'participants'].map((item) => (
            <NavLink key={item} to={`/trips/${tripId}/${item}`} className={({ isActive }) => isActive ? 'active' : ''}>
              {item}
            </NavLink>
          ))}
        </nav>
        {content}
      </div>

      {/* Invite Participants Modal (Organizer Only) */}
      {inviteModalOpen && isOrganizer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={() => {
                setInviteModalOpen(false)
                setInviteStatus(null)
              }}
            >
              <FaTimes />
            </button>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FaEnvelope className="text-emerald-700" /> Invite Camper to {trip.name}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              As the trip organizer, send an invitation email to campers. They will receive an email with a direct link to join your trip.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">Camper Email Address
                <input
                  type="email"
                  required
                  placeholder="camper@example.com"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Sending Invitation...' : 'Send Email Invite'}
              </button>
            </form>

            {inviteStatus && (
              <div className={`text-xs font-medium p-3 rounded-xl flex items-start gap-2 ${inviteStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {inviteStatus.success ? <FaCheck className="text-emerald-600 flex-shrink-0 mt-0.5" /> : <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5" />}
                <span>{inviteStatus.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <EditTripModal
        trip={trip}
        isOrganizer={isOrganizer}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={(updated) => setTrip(prev => ({ ...prev, ...updated }))}
        onDelete={() => navigate('/trips')}
      />
    </ScreenLayout>
  )
}
