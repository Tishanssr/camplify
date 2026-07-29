import { useState } from 'react'
import { FaBell, FaPlus } from 'react-icons/fa'
import { FiLogOut, FiUser } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AppHeader({ title = 'Dashboard' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const userName = user?.name || 'Sumanapala'

  return (
    <header className="app-header relative">
      <h1>{title}</h1>
      <div className="header-actions">
        <Link to="/notifications" className="notification-button" aria-label="Notifications">
          <FaBell />
          <i />
        </Link>

        {/* User profile dropdown button */}
        <div className="relative">
          <button
            type="button"
            className="flex items-center gap-1.5 p-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 hover:bg-emerald-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User profile menu"
          >
            <span className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </span>
          </button>

          {menuOpen && (
            <div className="user-dropdown-menu absolute right-0 top-11 w-48 bg-white border border-emerald-950/10 shadow-xl rounded-xl p-1.5 z-50">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-bold text-gray-800">{userName}</p>
                <p className="text-[10px] text-gray-400">Trail Explorer</p>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 rounded-lg"
                onClick={() => setMenuOpen(false)}
              >
                <FiUser className="text-emerald-600" /> View Profile
              </Link>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg text-left"
                onClick={handleLogout}
              >
                <FiLogOut className="text-red-500" /> Log Out
              </button>
            </div>
          )}
        </div>

        <Link to="/trips/new" className="new-trip-button">
          <FaPlus /> New Trip
        </Link>
      </div>
    </header>
  )
}
