import { useState } from 'react'
import { FaBell, FaRegCompass, FaRegMap, FaRegUser } from 'react-icons/fa'
import { FiGrid, FiLogOut, FiUser } from 'react-icons/fi'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function MobileNav() {
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    setProfileOpen(false)
    await logout()
    navigate('/login')
  }

  const userName = user?.name || 'Sumanapala'

  return (
    <>
      <nav className="mobile-nav">
        <NavLink to="/dashboard">
          <FiGrid />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/explore">
          <FaRegCompass />
          <span>Explore</span>
        </NavLink>
        <NavLink to="/trips">
          <FaRegMap />
          <span>Trips</span>
        </NavLink>
        <NavLink to="/notifications">
          <FaBell />
          <span>Alerts</span>
        </NavLink>
        <button
          type="button"
          className="flex flex-col items-center gap-0.5 text-gray-500 text-[9px] font-semibold"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <FaRegUser className="text-base" />
          <span>Profile</span>
        </button>
      </nav>

      {/* Mobile Profile Bottom Sheet / Modal */}
      {profileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4 animate-fade-in"
          onClick={() => setProfileOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-4 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800">{userName}</h3>
                <p className="text-xs text-gray-400">Trail Explorer</p>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-emerald-50 rounded-xl"
              onClick={() => {
                setProfileOpen(false)
                navigate('/profile')
              }}
            >
              <FiUser className="text-emerald-600 text-base" /> View Profile & Settings
            </button>

            <button
              type="button"
              className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl"
              onClick={handleLogout}
            >
              <FiLogOut className="text-red-500 text-base" /> Log Out
            </button>

            <button
              type="button"
              className="w-full text-center py-2 text-xs font-medium text-gray-400"
              onClick={() => setProfileOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
