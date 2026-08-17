import { useEffect, useState } from 'react'
import { FaCheck, FaRegUser, FaTimes, FaCamera } from 'react-icons/fa'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'

const PREFERENCE_OPTIONS = [
  'Mountain trails',
  'Forest camping',
  'Lakeside',
  'Wildlife photography',
  'Backcountry Hiking',
  'Stargazing & Astronomy',
  'River Kayaking & Canoeing',
  'Campfire Cooking',
]

export default function Profile() {
  const { user, fetchUserData } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [homeTown, setHomeTown] = useState('')
  const [bio, setBio] = useState('')
  const [preferences, setPreferences] = useState([])

  const [saving, setSaving] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setHomeTown(user.homeTown || '')
      setBio(user.bio || '')
      setPreferences(Array.isArray(user.preferences) ? user.preferences : ['Mountain trails', 'Forest camping'])
    }
  }, [user])

  const handleTogglePreference = (option) => {
    setPreferences(prev =>
      prev.includes(option) ? prev.filter(item => item !== option) : [...prev, option]
    )
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    setStatusMessage('')
    setErrorMessage('')

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        homeTown: homeTown.trim(),
        bio: bio.trim(),
        preferences,
      }

      const res = await authService.updateProfile(payload)
      if (res.success) {
        if (fetchUserData) await fetchUserData()
        setStatusMessage(res.message || 'Profile details updated successfully!')
        setTimeout(() => setStatusMessage(''), 4000)
      } else {
        setErrorMessage(res.message || 'Failed to update profile details.')
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Error saving profile details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenLayout title="Profile & Settings">
      <div className="settings-page">
        <aside className="settings-nav">
          <div className="settings-avatar">
            <FaRegUser />
            <button aria-label="Upload avatar"><FaCamera /></button>
          </div>
          <h2>{name || 'Adventurer'}</h2>
          <p>{user?.email || 'Camper'}</p>
          <div className="w-full pt-4 border-t border-gray-100">
            <button className="active w-full text-left font-bold text-xs py-2 text-emerald-800">
              Profile details
            </button>
          </div>
        </aside>

        <section className="settings-content">
          <h1>Profile details</h1>
          <p>Keep your profile up to date so your trip mates know who is joining the adventure.</p>

          {statusMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
              <span>✓ {statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="text-emerald-600 hover:text-emerald-800"><FaTimes /></button>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
              <span>⚠ {errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700"><FaTimes /></button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="form-grid">
              <label>Full name *
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>Email address
                <input value={email} type="email" readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
              </label>
              <label>Phone number
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                />
              </label>
              <label>Home town / Location
                <input
                  type="text"
                  value={homeTown}
                  onChange={(e) => setHomeTown(e.target.value)}
                  placeholder="e.g. Kandy, Sri Lanka"
                />
              </label>
              <label className="full-width">Bio
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your trip mates a little about your outdoor experience or favorite trails..."
                />
              </label>
            </div>

            <section className="preferences">
              <h2>Camping preferences</h2>
              <p className="text-xs text-gray-500 mb-3">Select the outdoor activities and trip styles you enjoy most:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PREFERENCE_OPTIONS.map((item) => {
                  const isSelected = preferences.includes(item)
                  return (
                    <label
                      key={item}
                      onClick={() => handleTogglePreference(item)}
                      className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isSelected ? <FaCheck className="text-emerald-700" /> : <span className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block" />}
                        {item}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>

            <button type="submit" disabled={saving} className="save-profile shadow-md disabled:opacity-50">
              {saving ? 'Saving changes...' : statusMessage ? 'Saved ✓' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>
    </ScreenLayout>
  )
}
