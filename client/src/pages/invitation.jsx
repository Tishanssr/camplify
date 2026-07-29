import { useEffect, useState } from 'react'
import { FaCampground, FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaCheck, FaTimes } from 'react-icons/fa'
import { useNavigate, useParams } from 'react-router-dom'
import { invitationService } from '../services/invitationService'

export default function Invitation() {
  const { inviteCode } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  const handleRespond = async (accept) => {
    setLoading(true)
    setStatusMessage('')
    try {
      if (inviteCode) {
        if (accept) {
          const res = await invitationService.acceptByCode(inviteCode)
          if (res.success) {
            setIsSuccess(true)
            setStatusMessage(res.message || 'Invitation accepted! Redirecting to your trips...')
            setTimeout(() => {
              navigate(res.tripId ? `/trips/${res.tripId}` : '/trips')
            }, 1500)
          } else {
            setStatusMessage(res.message || 'Failed to accept invitation.')
          }
        } else {
          setStatusMessage('Invitation declined.')
        }
      }
    } catch (err) {
      console.error('Failed to respond to invitation:', err)
      if (accept) {
        navigate('/trips')
      } else {
        setStatusMessage('Invitation response recorded.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="invite-page min-h-screen flex items-center justify-center p-4 bg-emerald-950/20">
      <section className="invite-card bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 relative border border-emerald-900/10">
        <span className="invite-logo inline-flex p-3 bg-emerald-100 text-emerald-800 rounded-2xl text-2xl mb-2">
          <FaCampground />
        </span>
        <h2 className="text-xl font-bold text-gray-800">You're Invited to a Camping Trip!</h2>
        <img
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=85"
          alt="Camping"
          className="w-full h-44 object-cover rounded-2xl"
        />

        <div className="invite-details flex justify-center gap-6 py-2 border-y border-gray-100 text-xs text-gray-600">
          <span><FaCalendarAlt className="inline mr-1 text-emerald-600" /> Upcoming Trip</span>
          <span><FaUsers className="inline mr-1 text-emerald-600" /> Group Adventure</span>
        </div>

        <p className="invite-copy text-xs text-gray-500 leading-relaxed">
          Join your friends on this outdoor camping adventure. Claim equipment, view shared checklists, and explore trails together.
        </p>

        {statusMessage ? (
          <div className={`p-3 rounded-xl text-xs font-semibold ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-700'}`}>
            {statusMessage}
          </div>
        ) : (
          <div className="invite-actions flex gap-3 pt-2">
            <button
              onClick={() => handleRespond(true)}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-1.5"
            >
              <FaCheck /> {loading ? 'Accepting...' : 'Accept Invitation'}
            </button>
            <button
              onClick={() => handleRespond(false)}
              disabled={loading}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <FaTimes /> Decline
            </button>
          </div>
        )}

        <small className="block text-[10px] text-gray-400">
          By accepting, you will be added to the trip participants list and shared gear checklist.
        </small>
      </section>
    </main>
  )
}
