import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessage from '../components/auth/AuthMessage'
import api from '../lib/api'
import { validatePassword } from '../utils/validatePassword'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const location = useLocation()
  const [email, setEmail] = useState(params.get('email') || '')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')
  const [messageType, setMessageType] = useState(location.state?.type || '')
  const [complete, setComplete] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.isValid) {
      setMessage(passwordValidation.message)
      setMessageType('error')
      return
    }
    setLoading(true)
    setMessage('')
    setMessageType('')
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, newPassword })
      if (!data.success) throw new Error(data.message)
      setComplete(true)
      setMessage(data.message)
      setMessageType('success')
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Could not reset your password.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="recovery">
      <div className="card-icon">⌁</div>
      <h1>Choose a new password</h1>
      <p className="auth-subtitle">Enter the six-digit code we sent to your inbox.</p>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <AuthInput id="otp" label="Verification code" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" required />
        <AuthInput id="new-password" label="New password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 chars (1 letter & 1 number)" minLength="8" required />
        <AuthMessage message={message} type={messageType} />
        {complete ? <Link className="primary-button" to="/login">Sign in <FaArrowRight /></Link> : <button className="primary-button" disabled={loading}>{loading ? 'Updating…' : <>Update password <FaArrowRight /></>}</button>}
      </form>
    </AuthLayout>
  )
}
