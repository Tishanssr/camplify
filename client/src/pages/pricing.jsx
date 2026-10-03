import { useEffect, useState } from 'react'
import { FaCheck, FaCrown, FaShieldAlt, FaTimes } from 'react-icons/fa'
import { useSearchParams } from 'react-router-dom'
import ScreenLayout from '../components/layout/ScreenLayout'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

export default function Pricing() {
  const { user, isPremium, fetchUserData } = useAuth()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const paymentStatus = searchParams.get('status')

  useEffect(() => {
    if (paymentStatus === 'success') {
      setSuccess('🎉 Payment successful! Your Camplify Premium membership is active.')
      fetchUserData()
    } else if (paymentStatus === 'cancel') {
      setError('Payment checkout was cancelled.')
    }
  }, [paymentStatus])

  // Ensure PayHere JS SDK is loaded dynamically
  const loadPayHereScript = () => {
    return new Promise((resolve, reject) => {
      if (window.payhere) {
        resolve(window.payhere)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://www.payhere.lk/payhere.js'
      script.async = true
      script.onload = () => resolve(window.payhere)
      script.onerror = () => reject(new Error('Failed to load PayHere Payment SDK'))
      document.head.appendChild(script)
    })
  }

  const handleUpgrade = async () => {
    if (!user) {
      setError('Please log in to upgrade to Premium.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await api.post('/payments/initiate-checkout')
      if (!res.data.success || !res.data.payhereConfig) {
        setError(res.data.message || 'Failed to initialize payment session.')
        setLoading(false)
        return
      }

      const payhereConfig = res.data.payhereConfig
      const payhere = await loadPayHereScript()

      payhere.onCompleted = async function onCompleted(orderId) {
        console.log('[PayHere Checkout] Completed order:', orderId)
        setSuccess('🎉 Payment completed successfully! Activating your Premium membership...')
        await fetchUserData()
        setLoading(false)
      }

      payhere.onDismissed = function onDismissed() {
        console.log('[PayHere Checkout] Payment popup dismissed by user.')
        setLoading(false)
      }

      payhere.onError = function onError(errorMsg) {
        console.error('[PayHere Checkout] Error:', errorMsg)
        setError(`Payment Gateway Error: ${errorMsg}`)
        setLoading(false)
      }

      // Start PayHere popup checkout
      payhere.startPayment(payhereConfig)
    } catch (err) {
      console.error('Upgrade initiation error:', err)
      setError(err.response?.data?.message || err.message || 'Error connecting to payment gateway.')
      setLoading(false)
    }
  }

  const expiresDateStr = user?.premiumExpiresAt
    ? new Date(user.premiumExpiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <ScreenLayout title="Camplify Premium">
      <div className="screen-page pricing-page max-w-5xl mx-auto space-y-8 py-4">
        {/* Header Hero */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full border border-amber-200">
            <FaCrown className="text-amber-600" /> Unlock the Ultimate Camping Experience
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Organize unlimited camping trips, invite all your friends, build complete equipment checklists, and access offline campsite maps.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs font-semibold flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <FaTimes />
            </button>
          </div>
        )}

        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-emerald-700 hover:text-emerald-900">
              <FaTimes />
            </button>
          </div>
        )}

        {/* Active Premium Status Banner */}
        {isPremium && (
          <div className="p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 text-2xl shrink-0">
                <FaCrown />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Camplify Premium Active
                  <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-2 py-0.5 rounded-full uppercase">
                    1 Year Plan
                  </span>
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Your membership expires on <b>{expiresDateStr}</b>. You have full access to unlimited participants, unlimited checklist items, and offline campsite map downloads.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* FREE PLAN */}
          <article className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              <div>
                <small className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Starter
                </small>
                <h2 className="text-2xl font-black text-gray-900">Free Plan</h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900">LKR 0</span>
                  <span className="text-xs text-gray-500 font-semibold">/ forever</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Ideal for casual camping trips with small groups.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <ul className="space-y-3 text-xs font-semibold text-gray-700">
                  <li className="flex items-center gap-2.5">
                    <FaCheck className="text-emerald-600 shrink-0" />
                    <span>Up to 10 total participants per trip (including organizer)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FaCheck className="text-emerald-600 shrink-0" />
                    <span>Max 6 shared checklist items per trip</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FaCheck className="text-emerald-600 shrink-0" />
                    <span>5-Day Weather Forecasts</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FaCheck className="text-emerald-600 shrink-0" />
                    <span>Interactive Geoapify Route & Map</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-gray-400 line-through">
                    <FaTimes className="shrink-0" />
                    <span>No downloadable offline campsite maps</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                disabled
                className="w-full py-3 bg-gray-100 text-gray-500 font-bold text-xs rounded-2xl cursor-not-allowed"
              >
                {!isPremium ? 'Current Plan' : 'Free Tier'}
              </button>
            </div>
          </article>

          {/* PREMIUM PLAN */}
          <article className="bg-white border-2 border-emerald-600 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-700 text-white font-extrabold text-[10px] uppercase px-4 py-1.5 rounded-bl-2xl shadow-xs flex items-center gap-1">
              <FaCrown className="text-amber-300" /> Recommended
            </div>

            <div className="space-y-6">
              <div>
                <small className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider block mb-1">
                  Full Access
                </small>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  Camplify Premium
                </h2>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-emerald-800">LKR 2,990</span>
                  <span className="text-xs text-gray-500 font-semibold">/ year (one-time)</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  For active trip organizers & wilderness explorers.
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <ul className="space-y-3.5 text-xs font-bold text-gray-800">
                  <li className="flex items-center gap-2.5 text-emerald-950">
                    <FaCheck className="text-emerald-600 text-sm shrink-0" />
                    <span><b>Unlimited Participants</b> per trip</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-emerald-950">
                    <FaCheck className="text-emerald-600 text-sm shrink-0" />
                    <span><b>Unlimited Shared Checklist Items</b></span>
                  </li>
                  <li className="flex items-center gap-2.5 text-emerald-950">
                    <FaCheck className="text-emerald-600 text-sm shrink-0" />
                    <span><b>Downloadable Offline Campsite Maps</b> (PDF)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FaCheck className="text-emerald-600 shrink-0" />
                    <span>Organizer Premium unlocks features for ALL trip members</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <FaCheck className="text-emerald-600 shrink-0" />
                    <span>Secure PayHere Sandbox payment integration</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 space-y-2">
              <button
                onClick={handleUpgrade}
                disabled={loading || isPremium}
                className={`w-full py-3.5 px-4 font-extrabold text-xs rounded-2xl transition-all shadow-md text-center leading-snug ${
                  isPremium
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 hover:shadow-lg cursor-pointer disabled:opacity-60'
                }`}
              >
                {loading ? (
                  'Connecting to PayHere...'
                ) : isPremium ? (
                  '✓ Premium Active'
                ) : (
                  <span>
                    <FaCrown className="text-amber-300 inline-block align-text-bottom shrink-0 mr-1.5 text-sm" />
                    <span>Upgrade to Premium (LKR 2,990 / Year)</span>
                  </span>
                )}
              </button>
              <p className="text-[10px] text-center text-gray-400 leading-normal">
                <FaShieldAlt className="text-emerald-700 inline-block align-text-bottom shrink-0 mr-1 text-xs" />
                <span>Safe & encrypted Sandbox payment powered by PayHere</span>
              </p>
            </div>
          </article>
        </div>
      </div>
    </ScreenLayout>
  )
}
