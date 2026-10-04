import { useEffect, useState } from 'react'
import { FaCheck, FaEnvelope, FaLink, FaPlus, FaTimes } from 'react-icons/fa'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { tripService } from '../services/tripService'
import { campsiteService } from '../services/campsiteService'
import { authService } from '../services/authService'
import { geoapifyService } from '../services/geoapifyService'
import { getTodayString } from '../utils/dateUtils'
import GeoapifyAutocomplete from '../components/common/GeoapifyAutocomplete'
import GeoapifyMap from '../components/common/GeoapifyMap'


const steps = ['Trip Details', 'Location & Dates', 'Participants', 'Checklist & Gear']

export default function CreateTrip() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCampsiteParam = searchParams.get('campsite')

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteStatus, setInviteStatus] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [campsitesList, setCampsitesList] = useState([])
  const [isCustomLocation, setIsCustomLocation] = useState(false)

  const todayStr = getTodayString()
  const futureDateStr = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Default form state: EMPTY unless a campsite param is passed from Explore
  const [form, setForm] = useState({
    name: preselectedCampsiteParam ? `${preselectedCampsiteParam} Trip` : '',
    description: '',
    selectedCampsite: preselectedCampsiteParam || '',
    campsiteId: null,
    location: preselectedCampsiteParam || '',
    startDate: todayStr,
    endDate: futureDateStr,
    meetingPoint: '',
    meetingTime: '07:30',
    invitedEmail: '',
    invitedParticipants: [],
    gearList: [],
    selectedGear: [],
    customGearInput: '',
  })

  const [routeInfo, setRouteInfo] = useState({
    distanceKm: null,
    durationFormatted: null,
    loading: false,
  })

  // Calculate distance in KM between meeting point and destination
  useEffect(() => {
    const destLat = form.coordinates?.lat
    const destLng = form.coordinates?.lng
    const meetLat = form.meetingCoordinates?.lat
    const meetLng = form.meetingCoordinates?.lng

    if (!destLat || !destLng || !meetLat || !meetLng) {
      setRouteInfo({ distanceKm: null, durationFormatted: null, loading: false })
      return
    }

    let isMounted = true
    setRouteInfo(prev => ({ ...prev, loading: true }))

    async function fetchDistance() {
      try {
        const route = await geoapifyService.calculateRoute(
          { lat: meetLat, lng: meetLng },
          { lat: destLat, lng: destLng },
          'drive'
        )

        if (!isMounted) return

        if (route && route.distanceKm) {
          setRouteInfo({
            distanceKm: route.distanceKm,
            durationFormatted: route.durationFormatted,
            loading: false,
          })
        } else {
          const km = geoapifyService.getHaversineDistanceKm(meetLat, meetLng, destLat, destLng)
          setRouteInfo({
            distanceKm: km ? `${km} km` : null,
            durationFormatted: null,
            loading: false,
          })
        }
      } catch (err) {
        if (!isMounted) return
        const km = geoapifyService.getHaversineDistanceKm(meetLat, meetLng, destLat, destLng)
        setRouteInfo({
          distanceKm: km ? `${km} km` : null,
          durationFormatted: null,
          loading: false,
        })
      }
    }

    fetchDistance()

    return () => {
      isMounted = false
    }
  }, [form.coordinates?.lat, form.coordinates?.lng, form.meetingCoordinates?.lat, form.meetingCoordinates?.lng])

  useEffect(() => {
    async function loadCampsites() {
      try {
        const res = await campsiteService.getCampsites()
        if (res.success && Array.isArray(res.campsites) && res.campsites.length > 0) {
          setCampsitesList(res.campsites)
          if (preselectedCampsiteParam) {
            const found = res.campsites.find(c => c.name.toLowerCase().includes(preselectedCampsiteParam.toLowerCase()))
            if (found) {
              setIsCustomLocation(false)
              const formattedLoc = found.location ? `${found.name} (${found.location})` : found.name
              const coords = found.coordinates && found.coordinates.lat != null && found.coordinates.lng != null
                ? { lat: Number(found.coordinates.lat), lng: Number(found.coordinates.lng) }
                : null

              setForm(prev => ({
                ...prev,
                selectedCampsite: found.name,
                campsiteId: found._id || found.id,
                location: formattedLoc,
                coordinates: coords,
                name: prev.name.trim() ? prev.name : `${found.name} Trip`,
              }))
            }
          }
        } else {
          setCampsitesList([])
        }
      } catch (err) {
        console.error('Failed to load campsites list:', err)
        setCampsitesList([])
      }
    }
    loadCampsites()
  }, [preselectedCampsiteParam])

  const updateField = (field, value) => {
    setError('')
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSelectCampsite = (e) => {
    const val = e.target.value
    setError('')
    if (val === 'CUSTOM') {
      setIsCustomLocation(true)
      setForm(prev => ({
        ...prev,
        selectedCampsite: '',
        campsiteId: null,
        location: '',
        coordinates: null,
      }))
      return
    }

    if (!val) {
      setIsCustomLocation(false)
      setForm(prev => ({
        ...prev,
        selectedCampsite: '',
        campsiteId: null,
        location: '',
        coordinates: null,
      }))
      return
    }

    setIsCustomLocation(false)
    const selectedObj = campsitesList.find(c => c.name === val || c._id === val || String(c.id) === val)
    if (selectedObj) {
      const formattedLoc = selectedObj.location ? `${selectedObj.name} (${selectedObj.location})` : selectedObj.name
      const coords = selectedObj.coordinates && selectedObj.coordinates.lat != null && selectedObj.coordinates.lng != null
        ? { lat: Number(selectedObj.coordinates.lat), lng: Number(selectedObj.coordinates.lng) }
        : null

      setForm(prev => ({
        ...prev,
        selectedCampsite: selectedObj.name,
        campsiteId: selectedObj._id || selectedObj.id,
        location: formattedLoc,
        coordinates: coords,
        name: prev.name.trim() ? prev.name : `${selectedObj.name} Trip`,
      }))
    }
  }

  const handleAddParticipantEmail = async (e) => {
    e.preventDefault()
    const email = form.invitedEmail.trim().toLowerCase()
    if (!email) return

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setInviteError('Please enter a valid email address.')
      setInviteStatus('')
      return
    }

    if (form.invitedParticipants.includes(email)) {
      setInviteError(`"${email}" is already added to the invite list below.`)
      setInviteStatus('')
      return
    }

    setInviteLoading(true)
    setInviteError('')
    setInviteStatus('')

    try {
      const res = await authService.checkUserEmail(email)
      setForm(prev => ({
        ...prev,
        invitedParticipants: [...prev.invitedParticipants, email],
        invitedEmail: '',
      }))

      if (res.success && res.exists) {
        setInviteStatus(`Added registered camper ${res.user?.name ? `${res.user.name} ` : ''}(${email}) to trip invite list!`)
      } else {
        setInviteStatus(`Added ${email} to invite list! An invitation link will be sent to them.`)
      }
    } catch {
      setForm(prev => ({
        ...prev,
        invitedParticipants: [...prev.invitedParticipants, email],
        invitedEmail: '',
      }))
      setInviteStatus(`Added ${email} to invite list! An invitation link will be sent to them.`)
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveParticipant = (emailToRemove) => {
    setForm(prev => ({
      ...prev,
      invitedParticipants: prev.invitedParticipants.filter(e => e !== emailToRemove)
    }))
  }

  const handleToggleGear = (gearItem) => {
    setForm(prev => {
      const exists = prev.selectedGear.includes(gearItem)
      const nextGear = exists
        ? prev.selectedGear.filter(g => g !== gearItem)
        : [...prev.selectedGear, gearItem]
      return { ...prev, selectedGear: nextGear }
    })
  }

  const handleAddCustomGear = (e) => {
    e.preventDefault()
    const customItem = form.customGearInput.trim()
    if (!customItem) return

    setForm(prev => ({
      ...prev,
      gearList: prev.gearList.includes(customItem) ? prev.gearList : [...prev.gearList, customItem],
      selectedGear: prev.selectedGear.includes(customItem) ? prev.selectedGear : [...prev.selectedGear, customItem],
      customGearInput: '',
    }))
  }

  const validateStep = (currentStep) => {
    if (currentStep === 0) {
      if (!form.name.trim()) return 'Trip name is required'
    }
    if (currentStep === 1) {
      if (!isCustomLocation && form.campsiteId) {
        if (!form.coordinates || form.coordinates.lat == null || form.coordinates.lng == null) {
          return 'This campsite does not have a valid location configured. Please contact an administrator.'
        }
      } else {
        if (!form.location.trim()) return 'Destination location is required. Select a campsite or type a custom location.'
      }
      if (!form.startDate || !form.endDate) return 'Start and End dates are required'
      if (new Date(form.startDate) < new Date(todayStr)) return 'Start date must be today or in the future'
      if (new Date(form.endDate) < new Date(form.startDate)) return 'End date must be after start date'
      if (!form.meetingPoint || !form.meetingPoint.trim()) return 'Meeting Point / Assembly Area is required'
      if (!form.meetingTime || !form.meetingTime.trim()) return 'Meeting Time is required'
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(step)
    if (err) {
      setError(err)
      return
    }
    setError('')
    if (step < steps.length - 1) {
      setStep(s => s + 1)
    } else {
      handleSubmitTrip()
    }
  }

  const handleSubmitTrip = async () => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        campsiteId: form.campsiteId || undefined,
        coordinates: form.coordinates || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        meetingPoint: form.meetingPoint.trim(),
        meetingTime: form.meetingTime || '07:30',
        meetingCoordinates: form.meetingCoordinates || undefined,
        gear: form.selectedGear,
        invitedParticipants: form.invitedParticipants,
      }

      const res = await tripService.createTrip(payload)
      if (res.success && res.trip) {
        const createdId = res.trip._id || res.trip.id
        navigate(`/trips/${createdId}`)
      } else if (res.limitReached) {
        setError(res.message || 'Free plan limit reached.')
      } else {
        setError(res.message || 'Failed to create trip. Please try again.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating trip. Please check details.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <ScreenLayout title="Create New Trip">
      <div className="screen-page create-page">
        {/* Wizard Progress Stepper */}
        <div className="stepper shadow-sm mb-6">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`step-item ${index === step ? 'active' : ''} ${index < step ? 'completed' : ''}`}
              onClick={() => index < step && setStep(index)}
            >
              <div className="step-circle">{index < step ? '✓' : index + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-2xl text-xs font-semibold mb-6 flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><FaTimes /></button>
          </div>
        )}

        <div className="create-grid">
          <div className="flex flex-col justify-between">
            {/* SCREEN 1: TRIP DETAILS */}
            {step === 0 && (
              <section className="form-card space-y-5">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">Step 1: Trip Details</h2>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Trip Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yahangala Weekend Expedition"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Description</label>
                  <textarea
                    rows={4}
                    placeholder="What is the goal or itinerary for this camping trip?"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>
              </section>
            )}

            {/* SCREEN 2: LOCATION & DATES */}
            {step === 1 && (
              <section className="form-card space-y-5">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">Step 2: Location & Dates</h2>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-700">Select Destination Campsite</label>
                  <select
                    value={isCustomLocation ? 'CUSTOM' : (form.selectedCampsite || '')}
                    onChange={handleSelectCampsite}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  >
                    <option value="">-- Select from Campsites List --</option>
                    {campsitesList.map((c) => (
                      <option key={c._id || c.id || c.name} value={c.name}>
                        🏕 {c.name} ({c.location})
                      </option>
                    ))}
                    <option value="CUSTOM">＋ Search / Type Custom Location via Geoapify</option>
                  </select>
                </div>

                {!isCustomLocation && form.campsiteId ? (
                  /* Admin-Registered Campsite Location Summary Card (Manual search & pin click hidden) */
                  <div className="space-y-3 p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-emerald-950">{form.selectedCampsite}</h3>
                        <p className="text-xs text-gray-600 font-medium mt-0.5">{form.location}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectCampsite({ target: { value: 'CUSTOM' } })}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline shrink-0 cursor-pointer"
                      >
                        Use Custom Location Instead
                      </button>
                    </div>

                    {form.coordinates?.lat && form.coordinates?.lng ? (
                      <div className="space-y-1 pt-1">
                        <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          📍 Official Coordinates: <strong>{Number(form.coordinates.lat).toFixed(4)}, {Number(form.coordinates.lng).toFixed(4)}</strong>
                        </p>
                        <GeoapifyMap
                          height="220px"
                          center={[form.coordinates.lat, form.coordinates.lng]}
                          zoom={13}
                          markers={[{
                            id: 'campsite-admin-dest',
                            title: form.selectedCampsite,
                            subtitle: form.location,
                            lat: form.coordinates.lat,
                            lng: form.coordinates.lng,
                            type: 'campsite',
                          }]}
                        />
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold">
                        ⚠ This campsite does not have a valid location configured. Please contact an administrator.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Custom Location Mode: Address Autocomplete & Interactive Map Pin */
                  <>
                    <div className="space-y-1.5">
                      <GeoapifyAutocomplete
                        label="Destination Location / Address *"
                        value={form.location}
                        placeholder="Search city, national park, or address via Geoapify..."
                        onChange={(val) => updateField('location', val)}
                        onSelect={(place) => {
                          if (place) {
                            updateField('location', place.formatted)
                            if (place.lat && place.lng) {
                              updateField('coordinates', { lat: place.lat, lng: place.lng })
                            }
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-gray-700">Interactive Location Map Pin</label>
                      <GeoapifyMap
                        height="280px"
                        center={form.coordinates?.lat ? [form.coordinates.lat, form.coordinates.lng] : [7.8731, 80.7718]}
                        zoom={form.coordinates?.lat ? 12 : 8}
                        onMapClick={({ lat, lng }) => {
                          updateField('coordinates', { lat, lng })
                          geoapifyService.reverseGeocode(lat, lng).then(result => {
                            if (result?.formatted) {
                              updateField('location', result.formatted)
                            }
                          })
                        }}
                        markers={form.coordinates?.lat ? [{
                          id: 'selected-destination',
                          title: form.name || 'Trip Destination',
                          subtitle: form.location,
                          lat: form.coordinates.lat,
                          lng: form.coordinates.lng,
                          type: 'campsite',
                        }] : []}
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">Start Date *</label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">End Date *</label>
                    <input
                      type="date"
                      required
                      min={form.startDate || todayStr}
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <GeoapifyAutocomplete
                      label="Meeting Point / Assembly Area *"
                      value={form.meetingPoint}
                      placeholder="e.g. Colombo Fort Railway Station or Trailhead parking"
                      onChange={(val) => {
                        updateField('meetingPoint', val)
                        if (!val) updateField('meetingCoordinates', null)
                      }}
                      onSelect={(place) => {
                        if (place) {
                          updateField('meetingPoint', place.formatted)
                          if (place.lat && place.lng) {
                            updateField('meetingCoordinates', { lat: place.lat, lng: place.lng })
                          }
                        } else {
                          updateField('meetingCoordinates', null)
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-gray-700">Meeting Time *</label>
                    <input
                      type="time"
                      required
                      value={form.meetingTime}
                      onChange={(e) => updateField('meetingTime', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                    />
                  </div>
                </div>
                  {routeInfo.loading && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1 animate-pulse flex items-center gap-1.5">
                      ⏳ Calculating distance to destination...
                    </p>
                  )}
                  {!routeInfo.loading && routeInfo.distanceKm && (
                    <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                        🚗 Distance to Destination: <span className="text-emerald-700 font-extrabold text-sm">{routeInfo.distanceKm} {routeInfo.distanceKm.includes('km') ? '' : 'KM'}</span>
                      </span>
                      {routeInfo.durationFormatted && (
                        <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                          ⏱ ~{routeInfo.durationFormatted}
                        </span>
                      )}
                    </div>
                  )}
              </section>
            )}


            {/* SCREEN 3: PARTICIPANTS */}
            {step === 2 && (
              <section className="form-card space-y-5">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">Step 3: Invite Participants</h2>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Invite campers by email. An invitation email with a direct link will be sent so they can log in or register to join your trip.
                </p>

                <form onSubmit={handleAddParticipantEmail} className="flex gap-2.5">
                  <input
                    type="email"
                    placeholder="friend@example.com"
                    value={form.invitedEmail}
                    onChange={(e) => {
                      updateField('invitedEmail', e.target.value)
                      setInviteError('')
                    }}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                  >
                    <FaPlus /> {inviteLoading ? 'Verifying...' : 'Add'}
                  </button>
                </form>

                {inviteError && (
                  <div className="text-xs text-red-700 font-semibold bg-red-50 p-3 rounded-xl border border-red-200 flex items-center justify-between">
                    <span>⚠ {inviteError}</span>
                    <button type="button" onClick={() => setInviteError('')} className="text-red-500 hover:text-red-700">
                      <FaTimes />
                    </button>
                  </div>
                )}

                {inviteStatus && (
                  <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                    {inviteStatus}
                  </p>
                )}

                <div className="space-y-2.5 pt-2">
                  <h3 className="text-xs font-bold text-gray-700">Invited Campers ({form.invitedParticipants.length})</h3>
                  {form.invitedParticipants.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No campers added yet. You can also invite them later from the trip screen.</p>
                  ) : (
                    <div className="grid gap-2">
                      {form.invitedParticipants.map((email) => (
                        <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                          <span className="font-semibold text-gray-700 flex items-center gap-2">
                            <FaEnvelope className="text-emerald-700" /> {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(email)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* SCREEN 4: GEAR & CHECKLIST */}
            {step === 3 && (
              <section className="form-card space-y-5">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-3">Step 4: Gear & Equipment Checklist</h2>
                <p className="text-xs text-gray-500 leading-relaxed">Select items to include in the group equipment checklist for this trip.</p>

                <form onSubmit={handleAddCustomGear} className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Add custom gear item (e.g. Solar power bank)"
                    value={form.customGearInput}
                    onChange={(e) => updateField('customGearInput', e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <FaPlus /> Add Custom
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {form.gearList.map((item) => {
                    const isSelected = form.selectedGear.includes(item)
                    return (
                      <div
                        key={item}
                        onClick={() => handleToggleGear(item)}
                        className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                          isSelected ? 'bg-emerald-50 border-emerald-600 text-emerald-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>⛺ {item}</span>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${isSelected ? 'bg-emerald-700 text-white' : 'border border-gray-300'}`}>
                          {isSelected && '✓'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Stepper Navigation Controls */}
            <div className="flex items-center justify-between pt-6 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (step > 0) {
                    setStep(s => s - 1)
                  } else {
                    navigate('/trips')
                  }
                }}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Creating Trip...' : step === steps.length - 1 ? 'Finish & Create Trip ✓' : 'Continue Step →'}
              </button>
            </div>
          </div>

          {/* PROGRESSIVE TRIP SUMMARY SIDEBAR */}
          <aside className="summary-card h-fit space-y-4">
            <h2 className="text-sm font-bold text-gray-800 border-b border-emerald-900/10 pb-3">Trip Summary</h2>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Trip Name</span>
                <b className="text-gray-800 block text-sm">{form.name || '(Not set yet)'}</b>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Destination</span>
                <b className="text-emerald-800 block">{form.location || '(Not selected)'}</b>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Dates</span>
                <p className="text-gray-700 font-semibold">{form.startDate} to {form.endDate}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Meeting Point</span>
                <p className="text-gray-600">{form.meetingPoint || 'Trailhead / Campsite area'}</p>
                {routeInfo.loading && (
                  <p className="text-[10px] text-emerald-600 font-medium italic mt-0.5 animate-pulse">Calculating distance...</p>
                )}
                {!routeInfo.loading && routeInfo.distanceKm && (
                  <div className="mt-1.5 inline-flex flex-col gap-0.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200">
                    <span className="text-emerald-800 font-extrabold">
                      📍 {routeInfo.distanceKm} {routeInfo.distanceKm.includes('km') ? '' : 'KM'} to destination
                    </span>
                    {routeInfo.durationFormatted && (
                      <span className="text-[10px] text-gray-500 font-normal">Est. travel time: {routeInfo.durationFormatted}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Invited Participants</span>
                <p className="text-gray-700 font-semibold">{form.invitedParticipants.length} camper(s) added</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Equipment Items</span>
                <p className="text-gray-700 font-semibold">{form.selectedGear.length} item(s) selected</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ScreenLayout>
  )
}
