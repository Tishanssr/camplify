import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight, FaCampground } from 'react-icons/fa'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessage from '../components/auth/AuthMessage'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const data = await login({ email, password })
      if (!data.success) throw new Error(data.message || 'Login failed')
      navigate('/dashboard')
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="login">
      <div className="card-icon"><FaCampground /></div>
      <h1>Welcome back</h1>
      <p className="auth-subtitle">Sign in to plan your next adventure</p>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput id="email" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        <div className="label-row"><span>Password</span><Link to="/forgot-password">Forgot password?</Link></div>
        <AuthInput id="password" label="" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        <AuthMessage message={message} />
        <button className="primary-button" disabled={loading}>{loading ? 'Signing in…' : <>Sign In <FaArrowRight /></>}</button>
      </form>
      <div className="divider"><span>or continue with</span></div>
      <p className="switch-copy">New to Camplify? <Link to="/register">Create account</Link></p>
    </AuthLayout>
  )
}
