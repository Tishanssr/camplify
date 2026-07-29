import { useEffect, useState } from 'react'
import { FaCheck, FaEdit, FaEnvelope, FaExclamationTriangle, FaLink, FaMapMarkerAlt, FaShareAlt, FaTimes } from 'react-icons/fa'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { checklistService } from '../services/checklistService'
import { campsiteService } from '../services/campsiteService'
import CampsiteMap from '../components/common/CampsiteMap'
import EditTripModal from '../components/common/EditTripModal'

function TripHero({ trip, isOrganizer, onOpenInvite, onOpenEdit }) {
  const imageUrl = trip.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85'
  const participantCount = trip.participants?.length || 1
  const dateStr = trip.date || (trip.startDate ? `${new Date(trip.startDate).toLocaleDateString()}–${new Date(trip.endDate).toLocaleDateString()}` : 'Dates TBD')

  const today = new Date()
  const tripDate = new Date(trip.startDate || trip.date || Date.now())
  const daysUntil = Math.max(0, Math.ceil((tripDate - today) / (1000 * 60 * 60 * 24)))

  return (
    <>
      <section className="trip-hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(4,20,9,.68), rgba(4,20,9,.1)), url(${imageUrl})` }}>
        <span className="trip-status upcoming">{trip.status || 'upcoming'}</span>
        <h1>{trip.name}</h1>
        <p>{trip.location} · {dateStr} · {participantCount} participant{participantCount !== 1 ? 's' : ''}</p>
        <div>
          {isOrganizer && <button onClick={onOpenEdit}><FaEdit /> Edit Trip</button>}
          {isOrganizer && <button onClick={onOpenInvite}><FaShareAlt /> Share / Invite</button>}
        </div>
      </section>
      <section className="trip-stat-row">
        <span><b>{daysUntil}</b><small>Days Until Trip</small><em>{dateStr}</em></span>
        <span><b>{participantCount}</b><small>Participants</small><em>Confirmed / Invited</em></span>
        <span><b>{trip.readiness || 0}%</b><small>Readiness</small><em>Group prep</em></span>
        <span><b>{trip.gear?.length || 7}</b><small>Equipment</small><em>Shared gear items</em></span>
      </section>
    </>
  )
}

function Overview({ trip, isOrganizer, onOpenInvite, weather }) {
  const participantsList = trip.participants || []

  return (
    <div className="trip-content-grid">
      <div className="overview-main">
        <section className="content-card">
          <h2>About This Trip</h2>
          <p>{trip.description || 'A camping adventure exploring trail points, campsites, and local nature.'}</p>
        </section>

        {/* Dynamic Weather Section bound to campsite/destination coordinates */}
        <section className="content-card">
          <h2>5-Day Weather Forecast ({trip.location})</h2>
          {weather && weather.forecast && weather.forecast.length > 0 ? (
            <div className="trip-forecast">
              {weather.forecast.map((dayItem, idx) => (
                <span key={idx}>
                  <small>{dayItem.day}</small>
                  <b>{dayItem.condition === 'Clear' ? '☀' : dayItem.condition === 'Rain' ? '🌧' : '🌤'}</b>
                  <strong>{dayItem.temp}°C</strong>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">Loading live weather forecast for {trip.location}...</p>
          )}
          {weather && (
            <p className="warning">
              ⚠ Current conditions: <b>{weather.temp}°C · {weather.condition}</b> ({weather.humidity}% humidity, {weather.windSpeed} km/h wind speed).
            </p>
          )}
        </section>

        {isOrganizer && (
          <section className="content-card">
            <h2>Invite Participants (Organizer Only)</h2>
            <div className="invite-options">
              <button onClick={onOpenInvite}>▦<small>QR Code</small><span>Scan to join</span></button>
              <button onClick={onOpenInvite}><FaEnvelope /><small>Email Invite</small><span>Registered users</span></button>
              <button onClick={onOpenInvite}><FaLink /><small>Share Link</small><span>Copy invite link</span></button>
            </div>
          </section>
        )}
      </div>

      <aside className="overview-side">
        <section className="content-card">
          <h2>Meeting Point</h2>
          <div className="map-placeholder overflow-hidden p-0 h-40">
            <CampsiteMap lat={trip.coordinates?.lat} lng={trip.coordinates?.lng} name={trip.location} />
          </div>
          <b>{trip.meetingPoint || trip.location || 'Campsite Trailhead'}</b>
          <p>{trip.location || 'Meeting Area'}</p>
          <a href="#map font-semibold">Meet at 7:30 AM</a>
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

              return (
                <div className="participant-mini flex items-center justify-between py-1" key={p._id || idx}>
                  <div className="flex items-center gap-2">
                    <i className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center not-italic">
                      {pName[0]?.toUpperCase() || 'U'}
                    </i>
                    <span>
                      <b className="text-xs text-gray-800 block">{pName}</b>
                      <small className="text-[10px] text-gray-400 capitalize">{role}</small>
                    </span>
                  </div>
                  <em className={`text-[10px] font-bold px-2 py-0.5 rounded-full not-italic capitalize ${status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
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

function Checklist({ tripId }) {
  const [groups, setGroups] = useState([])

  useEffect(() => {
    async function loadGroupChecklist() {
      if (!tripId) return
      try {
        const data = await checklistService.getGroupChecklist(tripId)
        if (data.success && Array.isArray(data.groups) && data.groups.length > 0) {
          setGroups(data.groups)
        }
      } catch (err) {
        console.error('Failed to load group checklist:', err)
      }
    }
    loadGroupChecklist()
  }, [tripId])

  const handleToggle = async (groupId, itemId, currentState) => {
    try {
      setGroups(prev => prev.map(g => {
        if (g._id === groupId) {
          return {
            ...g,
            items: g.items.map(i => i._id === itemId ? { ...i, done: !currentState } : i)
          }
        }
        return g
      }))
      await checklistService.toggleGroupItem(tripId, itemId, !currentState)
    } catch (err) {
      console.error('Failed to toggle item:', err)
    }
  }

  const totalItems = groups.reduce((acc, g) => acc + (g.items?.length || 0), 0)
  const doneItems = groups.reduce((acc, g) => acc + (g.items?.filter(i => i.done)?.length || 0), 0)
  const sharedItems = groups.reduce((acc, g) => acc + (g.items?.filter(i => i.assignedTo)?.length || 0), 0)
  const readinessPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  return (
    <div className="checklist-layout">
      <div>
        {groups.length === 0 ? (
          <p className="p-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">No group checklist items added yet.</p>
        ) : groups.map((group) => {
          const groupTotal = group.items?.length || 0
          const groupDone = group.items?.filter(i => i.done)?.length || 0
          return (
            <section className="checklist-group" key={group._id || group.title}>
              <header>
                <span>{group.icon || '⛺'}</span>
                <b>{group.title}</b>
                <small>{groupDone}/{groupTotal}</small>
                <i><em style={{ width: `${groupTotal > 0 ? (groupDone / groupTotal) * 100 : 0}%` }} /></i>
              </header>
              {group.items?.map((item) => (
                <div className="checklist-item" key={item._id || item.name} onClick={() => handleToggle(group._id, item._id, item.done)}>
                  <span className={item.done ? 'checked' : ''}>{item.done && '✓'}</span>
                  <b className="cursor-pointer select-none">{item.name}</b>
                  {item.assignedName && <small>{item.assignedName}</small>}
                  <button onClick={(e) => { e.stopPropagation(); }}>⋯</button>
                </div>
              ))}
            </section>
          )
        })}
      </div>
      <aside className="progress-card">
        <h2>Overall Progress</h2>
        <strong>{readinessPct}%</strong>
        <p>{readinessPct === 100 ? 'fully packed!' : 'packed and ready'}</p>
        <em style={{ width: `${readinessPct}%` }} />
        <div>
          <span><b>{doneItems}</b>Done</span>
          <span><b>{totalItems - doneItems}</b>Left</span>
          <span><b>{sharedItems}</b>Shared</span>
        </div>
      </aside>
    </div>
  )
}

function Equipment({ gear }) {
  const gearItems = Array.isArray(gear) && gear.length > 0 ? gear : ['4-person tent', 'Sleeping bags ×4', 'Camp stove + fuel', 'First aid kit', 'Water filter']

  return (
    <section className="equipment-card">
      <div className="card-title flex items-center justify-between">
        <h2>Equipment List ({gearItems.length})</h2>
        <button className="hover:bg-emerald-800 transition-colors">＋ Add Item</button>
      </div>
      {gearItems.map((item, index) => (
        <div className="equipment-row" key={index}>
          <span>⛺</span>
          <div>
            <b>{typeof item === 'string' ? item : item.name}</b>
            <small>Assigned gear item</small>
          </div>
          <em className="confirmed">confirmed</em>
          <button>⋯</button>
        </div>
      ))}
    </section>
  )
}

function Participants({ participants, isOrganizer, onOpenInvite }) {
  const participantsList = Array.isArray(participants) && participants.length > 0 ? participants : []

  return (
    <section className="equipment-card">
      <div className="card-title flex items-center justify-between">
        <h2>All Participants ({participantsList.length})</h2>
        {isOrganizer && (
          <button onClick={onOpenInvite} className="hover:bg-emerald-800 transition-colors">
            ＋ Invite Registered User
          </button>
        )}
      </div>
      {participantsList.length === 0 ? (
        <p className="p-4 text-xs text-gray-400 text-center">No participants found.</p>
      ) : (
        participantsList.map((person, idx) => {
          const pName = person.user?.name || person.email || (idx === 0 ? 'Organizer' : 'Participant')
          const role = person.role || (idx === 0 ? 'Organizer' : 'Participant')
          const status = person.status || 'confirmed'

          return (
            <div className="equipment-row participant-row flex items-center justify-between p-3 border-b border-gray-50" key={person._id || idx}>
              <div className="flex items-center gap-3">
                <i className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center not-italic">
                  {pName[0]?.toUpperCase() || 'U'}
                </i>
                <div>
                  <b className="text-xs text-gray-800 block">{pName}</b>
                  <small className="text-[11px] text-gray-400">{role} · {person.user?.email || person.email || 'Registered User'}</small>
                </div>
              </div>
              <em className={`text-[10px] font-bold px-2.5 py-1 rounded-full not-italic capitalize ${status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700'}`}>
                {status}
              </em>
            </div>
          )
        })
      )}
    </section>
  )
}

export default function TripDetail() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { tripId, tab = 'overview' } = useParams()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [inviteStatus, setInviteStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weather, setWeather] = useState(null)

  const [trip, setTrip] = useState({
    id: tripId,
    name: 'Camping Trip Details',
    location: 'Campsite Destination',
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85',
    participants: [],
  })

  useEffect(() => {
    async function loadTrip() {
      if (!tripId) return
      try {
        const data = await tripService.getTripById(tripId)
        if (data.success && data.trip) {
          setTrip(data.trip)

          // Load live weather for trip destination coordinates / location
          try {
            const lat = data.trip.coordinates?.lat
            const lng = data.trip.coordinates?.lng
            const wRes = await campsiteService.getWeather(lat, lng, data.trip.location)
            if (wRes.success && wRes.weather) {
              setWeather(wRes.weather)
            }
          } catch (wErr) {
            console.error('Failed to load trip weather:', wErr)
          }
        }
      } catch (err) {
        console.error('Failed to load trip details:', err)
      }
    }
    loadTrip()
  }, [tripId])

  const organizerId = trip.organizer?._id || trip.organizer
  const isOrganizer = Boolean(
    !trip.organizer ||
    (user && (String(organizerId) === String(user._id || user.id) || trip.organizer?.email === user.email))
  )

  const handleSendInvite = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    setLoading(true)
    setInviteStatus(null)
    try {
      const res = await tripService.inviteParticipant(tripId, emailInput)
      if (res.success) {
        setInviteStatus({ success: true, message: res.message || `Invitation sent to registered user!` })
        if (res.trip) {
          setTrip(res.trip)
        }
        setEmailInput('')
      } else {
        setInviteStatus({ success: false, message: res.message || 'No registered user found with this email. Please ask them to register first.' })
      }
    } catch (err) {
      setInviteStatus({
        success: false,
        message: err.response?.data?.message || 'No registered user found with this email address.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/invite/${tripId}`
    navigator.clipboard.writeText(inviteUrl)
    setInviteStatus({ success: true, message: 'Direct invite link copied to clipboard!' })
  }

  const content = {
    overview: <Overview trip={trip} isOrganizer={isOrganizer} onOpenInvite={() => setInviteModalOpen(true)} weather={weather} />,
    checklist: <Checklist tripId={tripId} />,
    equipment: <Equipment gear={trip.gear} />,
    participants: <Participants participants={trip.participants} isOrganizer={isOrganizer} onOpenInvite={() => setInviteModalOpen(true)} />,
  }[tab] || <Overview trip={trip} isOrganizer={isOrganizer} onOpenInvite={() => setInviteModalOpen(true)} weather={weather} />

  return (
    <ScreenLayout title={trip.name}>
      <div className="trip-page">
        <TripHero trip={trip} isOrganizer={isOrganizer} onOpenInvite={() => setInviteModalOpen(true)} onOpenEdit={() => setEditModalOpen(true)} />
        <nav className="trip-tabs">
          {['overview', 'checklist', 'equipment', 'participants'].map((item) => (
            <NavLink key={item} to={`/trips/${tripId}/${item}`} className={({ isActive }) => isActive ? 'active' : ''}>
              {item}
            </NavLink>
          ))}
        </nav>
        {content}
      </div>

      {/* Invite Registered Participants Modal (Organizer Only) */}
      {inviteModalOpen && isOrganizer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
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
            <p className="text-xs text-gray-500">
              As the trip organizer, you can send invitations to <b>registered Camplify users</b> by their email address.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700">Registered User Email
                <input
                  type="email"
                  required
                  placeholder="registered.user@example.com"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors"
              >
                {loading ? 'Verifying & Inviting...' : 'Invite Registered User'}
              </button>
            </form>

            <div className="border-t border-gray-100 pt-3 flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-2 py-2 border border-emerald-600 text-emerald-800 font-semibold text-xs rounded-xl hover:bg-emerald-50"
              >
                <FaLink /> Copy Shareable Invite Link
              </button>
            </div>

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
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={(updated) => setTrip(prev => ({ ...prev, ...updated }))}
        onDelete={() => navigate('/trips')}
      />
    </ScreenLayout>
  )
}
