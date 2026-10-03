import { useState } from 'react'
import { FaRegBell, FaRegCompass, FaRegMap } from 'react-icons/fa'
import { FiChevronLeft, FiChevronRight, FiCreditCard, FiGrid, FiShield } from 'react-icons/fi'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/camplify_ico.svg'

const navigation = [
  { label: 'Dashboard', to: '/dashboard', icon: FiGrid },
  { label: 'Explore', to: '/explore', icon: FaRegCompass },
  { label: 'My Trips', to: '/trips', icon: FaRegMap },
  { label: 'Notifications', to: '/notifications', icon: FaRegBell },
]

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { isAdmin } = useAuth()

  const adminNavigation = [
    { label: 'Campsite Portal', to: '/admin/campsites', icon: FiShield },
  ]
  const navItems = isAdmin ? adminNavigation : navigation

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-top flex items-center justify-between">
        <Link className="app-logo flex items-center" to={isAdmin ? "/admin/campsites" : "/dashboard"} aria-label="Camplify">
          <span className="logo-icon"><img src={logo} alt="Camplify" /></span>
        </Link>
        <button
          className="collapse-button"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </button>
      </div>

      {!collapsed && <p className="side-label">{isAdmin ? "Admin Controls" : "Navigation"}</p>}
      <nav className="side-nav">
        {navItems.map(({ label, to, icon: Icon, count }) => (
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
        {!isAdmin && (
          <NavLink to="/pricing" className="side-link pro-link" title={collapsed ? "Go Pro" : undefined}>
            <FiCreditCard />
            {!collapsed && <span>Go Pro</span>}
            {!collapsed && <span>☀</span>}
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
