import { FaCampground } from 'react-icons/fa'

const backgrounds = {
  register:
    'linear-gradient(115deg, rgba(20, 10, 4, .62), rgba(20, 38, 23, .42)), url(https://images.unsplash.com/photo-1504851149312-7a075b496cc7?auto=format&fit=crop&w=1800&q=85)',
  login:
    'linear-gradient(115deg, rgba(8, 19, 32, .62), rgba(12, 30, 17, .48)), url(https://images.unsplash.com/photo-1475483768296-6163e08872a1?auto=format&fit=crop&w=1800&q=85)',
  recovery:
    'linear-gradient(115deg, rgba(19, 31, 21, .72), rgba(31, 20, 10, .5)), url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85)',
}

export default function AuthLayout({ children, variant = 'login' }) {
  return (
    <main className="auth-page">
      <section
        className="auth-scene"
        style={{ backgroundImage: backgrounds[variant] || backgrounds.login }}
      >
        <a className="brand" href="/login" aria-label="Camplify home">
          <span className="brand-mark"><FaCampground /></span>
          <span>Camplify</span>
        </a>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  )
}
