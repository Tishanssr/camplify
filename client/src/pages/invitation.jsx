import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaCheck, FaTimes, FaUserCheck, FaUserPlus } from 'react-icons/fa'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { invitationService } from '../services/invitationService'
import logo from '../assets/camplify_ico.svg'

export default function Invitation() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [inviteData, setInviteData] = useState(null)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    async function loadInviteDetails() {
      if (!inviteCode) {
        setFetchError('No invite code provided.')
        setLoading(false)
        return
      }
      try {
        const res = await invitationService.getInviteByCode(inviteCode)
        if (res.success) {
          setInviteData(res)
        } else {
          setFetchError(res.message || 'Invalid or expired invitation code.')
        }
      } catch (err) {
        console.error('Error fetching invitation details:', err)
        setFetchError(err.response?.data?.message || 'Could not load invitation details.')
      } finally {
        setLoading(false)
      }
    }
    loadInviteDetails()
  }, [inviteCode])

  const handleRespond = async (accept) => {
    setActionLoading(true)
    setStatusMessage('')
    try {
      if (accept) {
        const res = await invitationService.acceptByCode(inviteCode)
        if (res.success) {
          setIsSuccess(true)
          setStatusMessage(res.message || 'Invitation accepted! Redirecting to your trip...')
          setTimeout(() => {
            navigate(res.tripId ? `/trips/${res.tripId}` : '/trips')
          }, 1500)
        } else {
          setStatusMessage(res.message || 'Failed to accept invitation.')
        }
      } else {
        setStatusMessage('Invitation declined.')
      }
    } catch (err) {
      console.error('Failed to respond to invitation:', err)
      if (accept) {
        navigate('/trips')
      } else {
        setStatusMessage('Invitation response recorded.')
      }
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <main className="invite-page min-h-screen flex items-center justify-center p-4 bg-emerald-950/20">
        <section className="invite-card bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 border border-emerald-900/10">
          <div className="flex justify-center my-6">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
          </div>
          <p className="text-xs text-gray-500 font-medium">Loading invitation details…</p>
        </section>
      </main>
    )
  }

  if (fetchError) {
    return (
      <main className="invite-page min-h-screen flex items-center justify-center p-4 bg-emerald-950/20">
        <section className="invite-card bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 border border-emerald-900/10">
          <span className="invite-logo inline-flex p-3 bg-red-100 text-red-700 rounded-2xl text-2xl mb-2">
            <FaTimes />
          </span>
          <h2 className="text-xl font-bold text-gray-800">Invitation Not Found</h2>
          <p className="text-xs text-gray-500 leading-relaxed">{fetchError}</p>
          <div className="pt-2">
            <Link to="/explore" className="inline-block py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors">
              Explore Campsites
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const { trip, invitation, userState } = inviteData || {}
  const organizerName = trip?.organizer?.name || invitation?.invitedBy?.name || 'A fellow camper'

  return (
    <main className="invite-page min-h-screen flex items-center justify-center p-4 bg-emerald-950/20">
      <section className="invite-card bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 relative border border-emerald-900/10">
        {/* Camplify Branding Badge */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src={logo} alt="Camplify" className="w-6 h-6 object-contain" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
            Invited via Camplify
          </span>
        </div>

        {/* Inviter & Trip Title Header */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">
            <b className="text-gray-900 font-bold">{organizerName}</b> invited you to join:
          </p>
          <h1 className="text-2xl font-extrabold text-emerald-800 tracking-tight">
            {trip?.name}
          </h1>
          {trip?.location && (
            <p className="text-xs font-semibold text-gray-600 flex items-center justify-center gap-1.5 pt-0.5">
              <FaMapMarkerAlt className="shrink-0 text-emerald-600" /> <span>{trip.location}</span>
            </p>
          )}
        </div>

        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"
          alt={trip?.name || 'Camping Trip'}
          className="w-full h-44 object-cover rounded-2xl"
        />

        {trip?.startDate && (
          <div className="flex items-center justify-center gap-2 py-3.5 px-4 border border-emerald-100 bg-emerald-50/50 rounded-2xl text-xs font-semibold text-emerald-800 shadow-sm">
            <FaCalendarAlt className="text-emerald-600 text-sm" />
            <span className="font-bold text-gray-800">{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
          </div>
        )}

        <p className="text-xs text-gray-600 leading-relaxed font-normal py-1">
          {trip?.description || 'Join your friends on this outdoor camping adventure. Claim equipment, view shared checklists, and explore trails together.'}
        </p>

        {statusMessage ? (
          <div className={`p-3 rounded-xl text-xs font-semibold ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700'}`}>
            {statusMessage}
          </div>
        ) : userState?.isAlreadyParticipant ? (
          <div className="space-y-3 pt-2">
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
              <FaUserCheck className="text-emerald-600 text-sm" />
              <span>You are already a participant on this trip!</span>
            </div>
            <Link
              to={`/trips/${trip._id}`}
              className="block w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
            >
              View Trip Details
            </Link>
          </div>
        ) : !userState?.isLoggedIn ? (
          <div className="space-y-3 pt-2">
            <Link
              to={`/register?redirect=${encodeURIComponent(`/invite/${inviteCode}`)}`}
              className="block w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-900/20 text-center flex items-center justify-center gap-2"
            >
              <FaUserPlus /> Create Account to Join Trip
            </Link>
            <p className="text-[11px] text-gray-500 text-center">
              Already have a Camplify account?{' '}
              <Link
                to={`/login?redirect=${encodeURIComponent(`/invite/${inviteCode}`)}`}
                className="text-emerald-700 font-bold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="invite-actions flex gap-3 pt-2">
            <button
              onClick={() => handleRespond(true)}
              disabled={actionLoading}
              className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5"
            >
              <FaCheck /> {actionLoading ? 'Accepting…' : 'Accept Invitation'}
            </button>
            <button
              onClick={() => handleRespond(false)}
              disabled={actionLoading}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <FaTimes /> Decline
            </button>
          </div>
        )}

        <small className="block text-[10px] text-gray-400 pt-1">
          By accepting, you will be added to the trip participants list and shared gear checklist.
        </small>
      </section>
    </main>
  )
}
