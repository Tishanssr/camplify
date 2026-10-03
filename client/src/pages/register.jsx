import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import AuthInput from '../components/auth/AuthInput'
import AuthLayout from '../components/auth/AuthLayout'
import AuthMessage from '../components/auth/AuthMessage'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../utils/validatePassword'
import logo from '../assets/camplify_ico.svg'

export default function Register() {
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { register } = useAuth()

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const passwordValidation = validatePassword(form.password)
    if (!passwordValidation.isValid) {
      setMessage(passwordValidation.message)
      setMessageType('error')
      return
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.')
      setMessageType('error')
      return
    }
    setLoading(true); setMessage(''); setMessageType('')
    try {
      const data = await register({ name: form.name, email: form.email, password: form.password })
      if (!data.success) throw new Error(data.message)
      if (redirect) {
        navigate(redirect, { replace: true })
      } else {
        navigate('/verify-email', { state: { message: data.message || 'Account created. Please verify your email.', type: 'success' } })
      }
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || 'Could not create your account.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout variant="register">
      <div className="card-icon"><img src={logo} alt="Camplify" /></div>
      <h1>Create account</h1>
      <p className="auth-subtitle">Join outdoor adventurers on Camplify</p>
      <form className="auth-form" onSubmit={submit}>
        <AuthInput id="name" name="name" label="Full Name" value={form.name} onChange={update} placeholder="Alex Johnson" required />
        <AuthInput id="email" name="email" label="Email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required />
        <AuthInput id="password" name="password" label="Password" type="password" value={form.password} onChange={update} placeholder="Min. 8 chars (1 letter & 1 number)" minLength="8" required />
        <AuthInput id="confirm-password" name="confirmPassword" label="Confirm Password" type="password" value={form.confirmPassword} onChange={update} placeholder="Repeat your password" required />
        <AuthMessage message={message} type={messageType} />
        <button className="primary-button" disabled={loading}>{loading ? 'Creating account…' : <>Create Account <FaArrowRight /></>}</button>
      </form>
      <p className="switch-copy">Already have an account? <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}>Sign in</Link></p>
    </AuthLayout>
  )
}
