import { useState } from 'react'
import { FaCampground, FaRegBell, FaRegCompass, FaRegMap, FaRegUser } from 'react-icons/fa'
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiGrid, FiLogOut, FiMoreVertical, FiUser } from 'react-icons/fi'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: FiGrid },
  { label: 'Explore', to: '/explore', icon: FaRegCompass },
  { label: 'My Trips', to: '/trips', icon: FaRegMap },
  { label: 'My Checklist', to: '/my-checklist', icon: FiGrid },
  { label: 'Notifications', to: '/notifications', icon: FaRegBell, count: 3 },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const userName = user?.name || 'Sumanapala'

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top flex items-center justify-between">
        <Link className="app-logo flex items-center" to="/dashboard" aria-label="Camplify Dashboard">
          <span className="logo-icon"><FaCampground /></span>
        </Link>
        <button
          className="collapse-button"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {!collapsed && <p className="side-label">Navigation</p>}
      <nav className="side-nav">
        {navigation.map(({ label, to, icon: Icon, count }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon />
            {!collapsed && <span>{label}</span>}
            {!collapsed && count && <b>{count}</b>}
          </NavLink>
        ))}
        <NavLink to="/pricing" className="side-link pro-link" title={collapsed ? "Go Pro" : undefined}>
          <FiCreditCard />
          {!collapsed && <span>Go Pro</span>}
          {!collapsed && <span>☀</span>}
        </NavLink>
      </nav>

      <div className="sidebar-profile-container relative mt-auto">
        <div className="sidebar-profile cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="profile-avatar"><FaRegUser /></span>
          {!collapsed && (
            <span>
              <b>{userName}</b>
              <small>Trail Explorer</small>
            </span>
          )}
          <button
            type="button"
            className="menu-three-dots ml-auto text-gray-400 hover:text-emerald-700"
            aria-label="User menu"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
          >
            <FiMoreVertical />
          </button>
        </div>

        {menuOpen && (
          <div className="user-dropdown-menu absolute bottom-14 right-2 w-48 bg-white dark:bg-emerald-950 border border-emerald-900/20 shadow-xl rounded-xl p-1 z-50">
            <Link
              to="/profile"
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 rounded-lg"
              onClick={() => setMenuOpen(false)}
            >
              <FiUser /> View Profile
            </Link>
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg text-left"
              onClick={handleLogout}
            >
              <FiLogOut /> Log Out
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
