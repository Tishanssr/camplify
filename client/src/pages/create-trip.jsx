import { useEffect, useState } from 'react'
import { FaCheck, FaEnvelope, FaLink, FaPlus, FaTimes } from 'react-icons/fa'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { tripService } from '../services/tripService'
import { campsiteService } from '../services/campsiteService'
import { getTodayString } from '../utils/dateUtils'

const steps = ['Trip Details', 'Location & Dates', 'Participants', 'Checklist & Gear']

export default function CreateTrip() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCampsiteParam = searchParams.get('campsite')

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteStatus, setInviteStatus] = useState('')
  const [campsitesList, setCampsitesList] = useState([])
  const [isCustomLocation, setIsCustomLocation] = useState(false)

  const todayStr = getTodayString()
  const futureDateStr = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Default form state: EMPTY unless a campsite param is passed from Explore
  const [form, setForm] = useState({
    name: preselectedCampsiteParam ? `${preselectedCampsiteParam} Trip` : '',
    description: '',
    selectedCampsite: preselectedCampsiteParam || '',
    location: preselectedCampsiteParam || '',
    startDate: todayStr,
    endDate: futureDateStr,
    meetingPoint: '',
    invitedEmail: '',
    invitedParticipants: [],
    gearList: [],
    selectedGear: [],
    customGearInput: '',
  })

  useEffect(() => {
    async function loadCampsites() {
      try {
        const res = await campsiteService.getCampsites()
        if (res.success && Array.isArray(res.campsites) && res.campsites.length > 0) {
          setCampsitesList(res.campsites)
          if (preselectedCampsiteParam) {
            const found = res.campsites.find(c => c.name.toLowerCase().includes(preselectedCampsiteParam.toLowerCase()))
            if (found) {
              setForm(prev => ({
                ...prev,
                selectedCampsite: found.name,
                location: `${found.name} (${found.location})`,
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
    if (val === 'CUSTOM') {
      setIsCustomLocation(true)
      updateField('selectedCampsite', '')
      updateField('location', '')
      return
    }

    setIsCustomLocation(false)
    const selectedObj = campsitesList.find(c => c.name === val)
    if (selectedObj) {
      updateField('selectedCampsite', selectedObj.name)
      updateField('location', `${selectedObj.name} (${selectedObj.location})`)
      if (!form.name.trim()) {
        updateField('name', `${selectedObj.name} Trip`)
      }
    } else {
      updateField('selectedCampsite', val)
      updateField('location', val)
    }
  }

  const handleAddParticipantEmail = (e) => {
    e.preventDefault()
    const email = form.invitedEmail.trim().toLowerCase()
    if (!email) return

    if (form.invitedParticipants.includes(email)) {
      setInviteStatus(`"${email}" is already added to the invite list below.`)
      return
    }

    setForm(prev => ({
      ...prev,
      invitedParticipants: [...prev.invitedParticipants, email],
      invitedEmail: '',
    }))
    setInviteStatus(`Added ${email} to trip invite list!`)
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
      if (!form.location.trim()) return 'Destination location is required. Select a campsite or type a custom location.'
      if (!form.startDate || !form.endDate) return 'Start and End dates are required'
      if (new Date(form.startDate) < new Date(todayStr)) return 'Start date must be today or in the future'
      if (new Date(form.endDate) < new Date(form.startDate)) return 'End date must be after start date'
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
        startDate: form.startDate,
        endDate: form.endDate,
        meetingPoint: form.meetingPoint.trim(),
        gear: form.selectedGear,
        invitedParticipants: form.invitedParticipants,
      }

      const res = await tripService.createTrip(payload)
      if (res.success && res.trip) {
        const createdId = res.trip._id || res.trip.id
        navigate(`/trips/${createdId}`)
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
      <div className="create-trip-page">
        {/* Wizard Progress Stepper */}
        <div className="stepper shadow-sm border border-emerald-800/10">
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
          <div className="bg-red-50 text-red-700 border border-red-200 p-3.5 rounded-2xl text-xs font-semibold mb-4 flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><FaTimes /></button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* SCREEN 1: TRIP DETAILS */}
            {step === 0 && (
              <section className="form-card space-y-4">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">Step 1: Trip Details</h2>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Trip Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yahangala Weekend Expedition"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="What is the goal or itinerary for this camping trip?"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </section>
            )}

            {/* SCREEN 2: LOCATION & DATES */}
            {step === 1 && (
              <section className="form-card space-y-4">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">Step 2: Location & Dates</h2>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Select Destination Campsite</label>
                  <select
                    value={isCustomLocation ? 'CUSTOM' : form.selectedCampsite}
                    onChange={handleSelectCampsite}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600 bg-white"
                  >
                    <option value="">-- Select from Campsites List --</option>
                    {campsitesList.map((c) => (
                      <option key={c._id || c.id || c.name} value={c.name}>
                        🏕 {c.name} ({c.location})
                      </option>
                    ))}
                    <option value="CUSTOM">＋ Type Custom Location / Address</option>
                  </select>
                </div>

                {(isCustomLocation || campsitesList.length === 0 || !form.selectedCampsite) && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Destination Location / Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. Udugumbara, Sri Lanka"
                      value={form.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      min={todayStr}
                      value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      min={form.startDate || todayStr}
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Meeting Point / Assembly Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Trailhead Parking Lot at 7:30 AM"
                    value={form.meetingPoint}
                    onChange={(e) => updateField('meetingPoint', e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                </div>
              </section>
            )}

            {/* SCREEN 3: PARTICIPANTS */}
            {step === 2 && (
              <section className="form-card space-y-4">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">Step 3: Invite Participants</h2>
                <p className="text-xs text-gray-500">
                  Invite campers by their registered email address. They will receive an invitation in their Notifications.
                </p>

                <form onSubmit={handleAddParticipantEmail} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="registered.camper@example.com"
                    value={form.invitedEmail}
                    onChange={(e) => updateField('invitedEmail', e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <FaPlus /> Add
                  </button>
                </form>

                {inviteStatus && (
                  <p className="text-xs text-emerald-800 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                    {inviteStatus}
                  </p>
                )}

                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold text-gray-700">Invited Campers ({form.invitedParticipants.length})</h3>
                  {form.invitedParticipants.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No campers added yet. You can also invite them later from the trip screen.</p>
                  ) : (
                    <div className="grid gap-2">
                      {form.invitedParticipants.map((email) => (
                        <div key={email} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
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
              <section className="form-card space-y-4">
                <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">Step 4: Gear & Equipment Checklist</h2>
                <p className="text-xs text-gray-500">Select items to include in the group equipment checklist for this trip.</p>

                <form onSubmit={handleAddCustomGear} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add custom gear item (e.g. Solar power bank)"
                    value={form.customGearInput}
                    onChange={(e) => updateField('customGearInput', e.target.value)}
                    className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs outline-none focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <FaPlus /> Add Custom
                  </button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
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
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep(s => Math.max(0, s - 1))}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
              >
                {loading ? 'Creating Trip...' : step === steps.length - 1 ? 'Finish & Create Trip ✓' : 'Continue Step →'}
              </button>
            </div>
          </div>

          {/* PROGRESSIVE TRIP SUMMARY SIDEBAR */}
          <aside className="summary-card h-fit space-y-4">
            <h2 className="text-sm font-bold text-gray-800 border-b border-emerald-900/10 pb-2">Trip Summary</h2>
            
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Trip Name</span>
                <b className="text-gray-800">{form.name || '(Not set yet)'}</b>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Destination</span>
                <b className="text-emerald-800">{form.location || '(Not selected)'}</b>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Dates</span>
                <p className="text-gray-700 font-semibold">{form.startDate} to {form.endDate}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Meeting Point</span>
                <p className="text-gray-600">{form.meetingPoint || 'Trailhead / Campsite area'}</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Invited Participants</span>
                <p className="text-gray-700 font-semibold">{form.invitedParticipants.length} camper(s) added</p>
              </div>

              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Equipment Items</span>
                <p className="text-gray-700 font-semibold">{form.selectedGear.length} item(s) selected</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ScreenLayout>
  )
}
