import { useState } from 'react'
import { FaBell, FaPlus } from 'react-icons/fa'
import { FiLogOut, FiShield, FiUser } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'

export default function AppHeader({ title = 'Dashboard' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, isAdmin, logout } = useAuth()
  const { unreadCount } = useNotification()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const userName = user?.name || 'No found user'

  return (
    <header className="app-header relative">
      <h1>{title}</h1>
      <div className="header-actions">
        {!isAdmin && (
          <Link to="/notifications" className="notification-button relative" aria-label="Notifications">
            <FaBell />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Link>
        )}

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
                <p className="text-[10px] text-emerald-600 font-semibold">{isAdmin ? 'System Admin' : 'Trail Explorer'}</p>
              </div>
              {isAdmin ? (
                <Link
                  to="/admin/campsites"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg mb-1"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiShield className="text-emerald-600" /> Admin Portal
                </Link>
              ) : (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 rounded-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  <FiUser className="text-emerald-600" /> View Profile
                </Link>
              )}
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

        {!isAdmin && (
          <Link to="/trips/new" className="new-trip-button">
            <FaPlus /> New Trip
          </Link>
        )}
      </div>
    </header>
  )
}
