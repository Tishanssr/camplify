import { useEffect, useRef, useState } from 'react'
import { FaRegUser, FaTimes, FaCamera, FaLock, FaUnlock } from 'react-icons/fa'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import { getImageUrl } from '../utils/imageUtils'

const LIMITS = { name: 80, bio: 500, phone: 20, homeTown: 100 }

const privacyFields = [
  { key: 'showBio',      label: 'Bio',       description: 'Show your bio to trip members' },
  { key: 'showHomeTown', label: 'Home Town',  description: 'Show your home town to trip members' },
  { key: 'showPhone',    label: 'Phone',      description: 'Show your phone number to trip members' },
  { key: 'showEmail',    label: 'Email',      description: 'Show your email to trip members' },
]

export default function Profile() {
  const { user, fetchUserData } = useAuth()
  const fileInputRef = useRef(null)

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [phone, setPhone]       = useState('')
  const [homeTown, setHomeTown] = useState('')
  const [bio, setBio]           = useState('')
  const [privacy, setPrivacy]   = useState({
    showBio: true, showHomeTown: true, showPhone: false, showEmail: false,
  })
  const [avatarUrl, setAvatarUrl] = useState('')

  const [saving, setSaving]           = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [statusMessage, setStatusMessage]     = useState('')
  const [errorMessage, setErrorMessage]       = useState('')

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhone(user.phone || '')
      setHomeTown(user.homeTown || '')
      setBio(user.bio || '')
      setAvatarUrl(user.profilePicture || '')
      if (user.privacySettings) {
        setPrivacy({
          showBio:      user.privacySettings.showBio      ?? true,
          showHomeTown: user.privacySettings.showHomeTown ?? true,
          showPhone:    user.privacySettings.showPhone    ?? false,
          showEmail:    user.privacySettings.showEmail    ?? false,
        })
      }
    }
  }, [user])

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)
    setStatusMessage('')
    setErrorMessage('')
    try {
      const res = await authService.updateProfile({
        name:            name.trim(),
        phone:           phone.trim(),
        homeTown:        homeTown.trim(),
        bio:             bio.trim(),
        privacySettings: privacy,
      })
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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setErrorMessage('')
    try {
      const res = await authService.uploadAvatar(file)
      if (res.success) {
        setAvatarUrl(res.profilePicture)
        if (fetchUserData) await fetchUserData()
        setStatusMessage('Profile picture updated!')
        setTimeout(() => setStatusMessage(''), 4000)
      } else {
        setErrorMessage(res.message || 'Failed to upload avatar.')
      }
    } catch {
      setErrorMessage('Error uploading profile picture.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const togglePrivacy = (key) => {
    setPrivacy((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <ScreenLayout title="Profile & Settings">
      <div className="settings-page">
        <aside className="settings-nav">
          <div className="settings-avatar" style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img
                src={getImageUrl(avatarUrl)}
                alt={name || 'Avatar'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <FaRegUser />
            )}
            <button
              type="button"
              aria-label="Upload avatar"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              style={{ opacity: avatarUploading ? 0.6 : 1 }}
            >
              <FaCamera />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <h2>{name || 'Adventurer'}</h2>
          <p>{user?.email || 'Camper'}</p>
        </aside>

        <section className="settings-content">
          <p className="mb-6">Keep your profile up to date so your trip mates know who is joining the adventure.</p>

          {avatarUploading && (
            <div className="bg-blue-50 text-blue-800 border border-blue-200 p-3 rounded-2xl text-xs font-semibold">
              Uploading profile picture...
            </div>
          )}

          {statusMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
              <span>&#x2713; {statusMessage}</span>
              <button onClick={() => setStatusMessage('')} className="text-emerald-600 hover:text-emerald-800"><FaTimes /></button>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between">
              <span>&#x26a0; {errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700"><FaTimes /></button>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="form-grid">
              <label>Full name *
                <input
                  type="text"
                  required
                  maxLength={LIMITS.name}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
                <small style={{ color: name.length > LIMITS.name * 0.9 ? '#dc2626' : '#9ca3af', fontSize: '10px' }}>
                  {name.length}/{LIMITS.name}
                </small>
              </label>
              <label>Email address
                <input value={email} type="email" readOnly className="bg-gray-50 text-gray-500 cursor-not-allowed" />
              </label>
              <label>Phone number
                <input
                  type="tel"
                  maxLength={LIMITS.phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +94 77 123 4567"
                />
              </label>
              <label>Home town / Location
                <input
                  type="text"
                  maxLength={LIMITS.homeTown}
                  value={homeTown}
                  onChange={(e) => setHomeTown(e.target.value)}
                  placeholder="e.g. Kandy, Sri Lanka"
                />
              </label>
              <label className="full-width">Bio
                <textarea
                  rows={3}
                  maxLength={LIMITS.bio}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your trip mates a little about your outdoor experience or favourite trails..."
                />
                <small style={{ color: bio.length > LIMITS.bio * 0.9 ? '#dc2626' : '#9ca3af', fontSize: '10px' }}>
                  {bio.length}/{LIMITS.bio}
                </small>
              </label>
            </div>

            {/* Membership & Plan Section */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
                Membership & Plan
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '1rem' }}>
                Manage your subscription status and unlocked camping features.
              </p>

              <div className={`p-4 rounded-2xl border ${user?.isPremium ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}>
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${user?.isPremium ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-200 text-gray-700'}`}>
                    {user?.isPremium ? '👑 Camplify Premium' : 'Free Plan'}
                  </span>
                  <p className="text-xs font-semibold text-gray-700 mt-2">
                    {user?.isPremium
                      ? `Active until ${new Date(user.premiumExpiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
                      : 'Free Plan (Limited to 10 participants & 6 shared checklist items)'}
                  </p>
                </div>

                <a
                  href="/pricing"
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs ${user?.isPremium ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                  style={{ textDecoration: 'none' }}
                >
                  {user?.isPremium ? 'Manage Membership' : 'Upgrade to Premium →'}
                </a>
              </div>
            </div>

            {/* Privacy Settings */}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>

              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.25rem' }}>
                Privacy Settings
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '1rem' }}>
                Control what trip members can see on your profile. Name and profile picture are always visible.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {privacyFields.map(({ key, label, description }) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      border: '1px solid #e5e7eb',
                      background: privacy[key] ? '#f0fdf4' : '#fafafa',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>{label}</span>
                      <p style={{ fontSize: '0.68rem', color: '#9ca3af', margin: 0 }}>{description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePrivacy(key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: privacy[key] ? '#065f46' : '#e5e7eb',
                        color: privacy[key] ? '#ffffff' : '#6b7280',
                        transition: 'all 0.2s',
                      }}
                    >
                      {privacy[key] ? <FaUnlock size={10} /> : <FaLock size={10} />}
                      {privacy[key] ? 'Visible' : 'Hidden'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={saving} className="save-profile shadow-md disabled:opacity-50">
              {saving ? 'Saving changes...' : statusMessage ? 'Saved' : 'Save changes'}
            </button>
          </form>
        </section>
      </div>
    </ScreenLayout>
  )
}
