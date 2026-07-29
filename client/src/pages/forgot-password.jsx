import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessage from '../components/auth/AuthMessage'
import api from '../lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { data } = await api.post('/auth/send-reset-otp', { email })
      if (!data.success) throw new Error(data.message)
      navigate(`/reset-password?email=${encodeURIComponent(email)}`, { state: { message: data.message } })
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Could not send a reset code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="recovery">
      <div className="card-icon">✉</div>
      <h1>Reset your password</h1>
      <p className="auth-subtitle">We’ll send a verification code to your email.</p>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <AuthMessage message={message} />
        <button className="primary-button" disabled={loading}>{loading ? 'Sending…' : <>Send reset code <FaArrowRight /></>}</button>
      </form>
      <p className="switch-copy"><Link to="/login">Back to sign in</Link></p>
    </AuthLayout>
  )
}
