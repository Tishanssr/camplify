import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { FaArrowLeft, FaRegUser, FaMapMarkerAlt, FaPhone, FaEnvelope, FaLock } from 'react-icons/fa'
import ScreenLayout from '../components/layout/ScreenLayout'
import { authService } from '../services/authService'
import { getImageUrl } from '../utils/imageUtils'

function AvatarDisplay({ url, name, size = 80 }) {
  const initials = name ? name.charAt(0).toUpperCase() : 'U'
  if (url) {
    return (
      <img
        src={getImageUrl(url)}
        alt={name}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid #d1fae5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #065f46, #34d399)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff',
      border: '3px solid #d1fae5',
      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div style={{ padding: '2rem', maxWidth: 520, margin: '0 auto' }}>
      {[80, 200, 120, 160].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 80 : 18,
          width: i === 0 ? 80 : `${w}px`,
          background: '#e5e7eb',
          borderRadius: i === 0 ? '50%' : 8,
          marginBottom: 16,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

export default function PublicProfile() {
  const { userId } = useParams()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [isSelf, setIsSelf] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await authService.getPublicProfile(userId)
        if (res.success) {
          setProfile(res.profile)
          setIsSelf(res.isSelf || false)
        } else {
          if (res.message?.toLowerCase().includes('access denied')) {
            setAccessDenied(true)
          } else {
            setError(res.message || 'Could not load profile.')
          }
        }
      } catch {
        setError('Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId])

  const renderContent = () => {
    if (loading) return <ProfileSkeleton />

    if (accessDenied) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '3rem 1.5rem', gap: '1rem', textAlign: 'center',
        }}>
          <FaLock size={36} style={{ color: '#9ca3af' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#374151', margin: 0 }}>
            Profile not accessible
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', maxWidth: 340, margin: 0 }}>
            You can only view profiles of people who share a confirmed trip with you.
          </p>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: '0.5rem', padding: '8px 20px',
              background: '#065f46', color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Go back
          </button>
        </div>
      )
    }

    if (error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626', fontSize: '0.85rem' }}>
          {error}
        </div>
      )
    }

    if (!profile) return null

    const hiddenFields = profile.hiddenFields || []

    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#065f46', fontSize: '0.78rem', fontWeight: 600,
            marginBottom: '1.5rem', padding: 0,
          }}
        >
          <FaArrowLeft size={12} /> Back
        </button>

        {/* Profile card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}>
          {/* Header band */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 60%, #059669 100%)',
            height: 72,
          }} />

          {/* Avatar + name */}
          <div style={{ padding: '0 1.5rem 1.5rem', marginTop: -40 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
              <AvatarDisplay url={profile.profilePicture} name={profile.name} size={76} />
              <div style={{ paddingBottom: 4 }}>
                <h1 style={{
                  fontSize: '1.1rem', fontWeight: 800, color: '#111827',
                  margin: 0, lineHeight: 1.2,
                }}>
                  {profile.name}
                </h1>
                {isSelf && (
                  <Link
                    to="/profile"
                    style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Edit your profile
                  </Link>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p style={{
                fontSize: '0.82rem', color: '#4b5563', lineHeight: 1.6,
                margin: '0 0 1rem', padding: '0.75rem', background: '#f9fafb',
                borderRadius: 10, border: '1px solid #f3f4f6',
              }}>
                {profile.bio}
              </p>
            ) : hiddenFields.includes('bio') ? (
              <PrivateField label="Bio" />
            ) : null}

            {/* Info rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {profile.homeTown ? (
                <InfoRow icon={<FaMapMarkerAlt size={12} />} value={profile.homeTown} />
              ) : hiddenFields.includes('homeTown') ? (
                <PrivateField label="Home town" />
              ) : null}

              {profile.phone && (
                <InfoRow icon={<FaPhone size={12} />} value={profile.phone} />
              )}

              {profile.email && (
                <InfoRow icon={<FaEnvelope size={12} />} value={profile.email} />
              )}
            </div>

            {hiddenFields.length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.6rem 0.85rem',
                background: '#fafafa',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <FaLock size={10} style={{ color: '#9ca3af', flexShrink: 0 }} />
                <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
                  Some information is kept private by this user.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ScreenLayout title={profile ? `${profile.name}'s Profile` : 'Profile'}>
      {renderContent()}
    </ScreenLayout>
  )
}

function InfoRow({ icon, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#059669', flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', color: '#374151' }}>{value}</span>
    </div>
  )
}

function PrivateField({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <FaLock size={10} style={{ color: '#d1d5db', flexShrink: 0 }} />
      <span style={{ fontSize: '0.75rem', color: '#d1d5db', fontStyle: 'italic' }}>{label} is private</span>
    </div>
  )
}
