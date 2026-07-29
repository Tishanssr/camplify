import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessage from '../components/auth/AuthMessage'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', acceptedTerms: false })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    if (form.password !== form.confirmPassword) return setMessage('Passwords do not match.')
    if (!form.acceptedTerms) return setMessage('Please accept the Terms of Service and Privacy Policy.')
    setLoading(true); setMessage('')
    try {
      const data = await register({ name: form.name, email: form.email, password: form.password })
      if (!data.success) throw new Error(data.message)
      navigate('/verify-email', { state: { message: 'Account created. Please verify your email.' } })
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Could not create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="register">
      <div className="card-icon">⛺</div>
      <h1>Create account</h1>
      <p className="auth-subtitle">Join outdoor adventurers on Camplify</p>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput id="name" name="name" label="Full Name" value={form.name} onChange={update} placeholder="Alex Johnson" required />
        <AuthInput id="email" name="email" label="Email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required />
        <AuthInput id="password" name="password" label="Password" type="password" value={form.password} onChange={update} placeholder="Min. 8 characters" minLength="8" required />
        <AuthInput id="confirm-password" name="confirmPassword" label="Confirm Password" type="password" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" required />
        <label className="terms"><input name="acceptedTerms" type="checkbox" checked={form.acceptedTerms} onChange={update} /> <span>I agree to Camplify's Terms of Service and Privacy Policy</span></label>
        <AuthMessage message={message} />
        <button className="primary-button" disabled={loading}>{loading ? 'Creating account…' : <>Create Account <FaArrowRight /></>}</button>
      </form>
      <p className="switch-copy">Already have an account? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  )
}
