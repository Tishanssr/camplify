import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessage from '../components/auth/AuthMessage'
import api from '../lib/api'

export default function VerifyEmail() {
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [verified, setVerified] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendCode = async () => {
    setLoading(true); setMessage('')
    try {
      const { data } = await api.post('/auth/send-verify-otp')
      if (!data.success) throw new Error(data.message)
      setMessage(data.message)
    } catch (error) { setMessage(error.response?.data?.message || error.message) } finally { setLoading(false) }
  }
  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setMessage('')
    try {
      const { data } = await api.post('/auth/verify-account', { otp })
      if (!data.success) throw new Error(data.message)
      setVerified(true); setMessage(data.message)
    } catch (error) { setMessage(error.response?.data?.message || error.message) } finally { setLoading(false) }
  }

  return (
    <AuthLayout variant="recovery">
      <div className="card-icon">✓</div>
      <h1>Verify your email</h1>
      <p className="auth-subtitle">Confirm your account with the six-digit code from your email.</p>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput id="otp" label="Verification code" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
        <AuthMessage message={message} />
        {verified ? <Link className="primary-button" to="/dashboard">Continue <FaArrowRight /></Link> : <button className="primary-button" disabled={loading}>{loading ? 'Verifying…' : <>Verify account <FaArrowRight /></>}</button>}
      </form>
      {!verified && <button type="button" className="text-button" onClick={sendCode} disabled={loading}>Send a new code</button>}
    </AuthLayout>
  )
}
