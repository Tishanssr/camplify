import { useEffect, useState } from 'react'
import { FaCheck, FaEdit, FaEnvelope, FaExclamationTriangle, FaLink, FaMapMarkerAlt, FaShareAlt, FaTimes } from 'react-icons/fa'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { checklistService } from '../services/checklistService'
import { campsiteService } from '../services/campsiteService'
import { invitationService } from '../services/invitationService'
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

function Checklist({ tripId, participants, isOrganizer, currentUser }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [assignModalItem, setAssignModalItem] = useState(null)
  const [newItem, setNewItem] = useState({ name: '', quantity: '1', assignedTo: '' })
  const [statusMsg, setStatusMsg] = useState('')

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

  const handleToggle = async (itemId, currentState) => {
    try {
      setItems(prev => prev.map(i => i._id === itemId ? { ...i, done: !currentState } : i))
      const res = await checklistService.toggleGroupItem(tripId, itemId, !currentState)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
      }
    } catch (err) {
      console.error('Failed to toggle item:', err)
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
      }
      setAssignModalItem(null)
    } catch (err) {
      console.error('Failed to assign item:', err)
    }
  }

  const handleDelete = async (itemId) => {
    try {
      const res = await checklistService.deleteGroupItem(tripId, itemId)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
      }
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  const handleAddItemSubmit = async (e) => {
    e.preventDefault()
    if (!newItem.name.trim()) return
    try {
      const res = await checklistService.addGroupChecklistItem(tripId, newItem)
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items)
        setNewItem({ name: '', quantity: '1', assignedTo: '' })
        setAddItemModalOpen(false)
        setStatusMsg('Equipment item added!')
        setTimeout(() => setStatusMsg(''), 3000)
      }
    } catch (err) {
      console.error('Failed to add item:', err)
    }
  }

  const totalItems = items.length
  const doneItems = items.filter(i => i.done).length
  const sharedItems = items.filter(i => i.assignedTo).length
  const readinessPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

  const participantList = Array.isArray(participants) ? participants : []

  return (
    <div className="space-y-4">
      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl text-center">
          {statusMsg}
        </div>
      )}

      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-900">Group Equipment Checklist</h2>
          <p className="text-xs text-gray-500">Coordinate shared camping gear and assign equipment to participants</p>
        </div>
        <button
          onClick={() => setAddItemModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          + Add Equipment Item
        </button>
      </div>

      <div className="checklist-layout">
        <div>
          {loading ? (
            <p className="p-8 text-center text-xs text-gray-400">Loading checklist...</p>
          ) : items.length === 0 ? (
            <p className="p-8 text-center text-xs text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">No equipment items added yet.</p>
          ) : (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isMyAssignment = currentUser && item.assignedTo && String(item.assignedTo) === String(currentUser._id || currentUser.id)
                  return (
                    <div
                      className={`flex items-center justify-between p-3.5 hover:bg-gray-50/80 transition-colors ${item.done ? 'bg-emerald-50/30' : ''}`}
                      key={item._id || item.name}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={Boolean(item.done)}
                          onChange={() => handleToggle(item._id, item.done)}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold block ${item.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">Qty: {item.quantity || '1'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.assignedName ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isMyAssignment ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gray-100 text-gray-700'}`}>
                            Assigned: {item.assignedName}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => currentUser && handleAssign(item._id, currentUser._id || currentUser.id)}
                            className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Claim Gear
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setAssignModalItem(item)}
                          className="text-[10px] font-bold text-gray-500 hover:text-emerald-700 px-2 py-1 border border-gray-200 hover:border-emerald-300 rounded-lg transition-colors cursor-pointer"
                        >
                          Assign
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          className="text-[10px] font-bold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        <aside className="progress-card bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Group Readiness</h2>
          <div className="text-3xl font-extrabold text-emerald-700">{readinessPct}%</div>
          <p className="text-xs font-semibold text-gray-600">
            {readinessPct === 100 ? 'All equipment packed!' : 'Equipment packing in progress'}
          </p>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full transition-all duration-300" style={{ width: `${readinessPct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
            <div>
              <b className="text-sm font-bold text-gray-800 block">{doneItems}</b>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Packed</span>
            </div>
            <div>
              <b className="text-sm font-bold text-gray-800 block">{totalItems - doneItems}</b>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Remaining</span>
            </div>
            <div>
              <b className="text-sm font-bold text-gray-800 block">{sharedItems}</b>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">Assigned</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Equipment Item Modal */}
      {addItemModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">Add Equipment Item</h3>
              <button
                type="button"
                onClick={() => setAddItemModalOpen(false)}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Camp Lantern, Water Filter"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                <input
                  type="text"
                  placeholder="1, 2x, etc."
                  value={newItem.quantity}
                  onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assign To (Optional)</label>
                <select
                  value={newItem.assignedTo}
                  onChange={(e) => setNewItem({ ...newItem, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                >
                  <option value="">Unassigned (Anyone can claim)</option>
                  {participantList.map((p, idx) => {
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

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setAddItemModalOpen(false)}
                  className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Gear Modal */}
      {assignModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900">Assign "{assignModalItem.name}"</h3>
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
                className="w-full text-left p-3 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Unassign (Anyone can claim)
              </button>

              {participantList.map((p, idx) => {
                const pId = p.user?._id || p.user?.id || p._id || p.id
                const pName = p.user?.name || p.email || `Participant ${idx + 1}`
                return (
                  <button
                    key={pId || idx}
                    type="button"
                    onClick={() => handleAssign(assignModalItem._id, pId)}
                    className="w-full text-left p-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer"
                  >
                    {pName}
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
  }, [tripId])

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

  const content = {
    overview: <Overview trip={trip} isOrganizer={isOrganizer} onOpenInvite={() => setInviteModalOpen(true)} weather={weather} />,
    checklist: <Checklist tripId={tripId} participants={trip.participants} isOrganizer={isOrganizer} currentUser={user} />,
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
