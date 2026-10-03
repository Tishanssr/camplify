import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export const ProtectedRoute = () => {
  const { user, isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1c12] text-white text-xs font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (user && user.isAccountVerified === false) {
    return <Navigate to="/verify-email" replace />
  }

  if (user && user.role === 'admin') {
    return <Navigate to="/admin/campsites" replace />
  }

  return <Outlet />
}

export const UserOnlyRoute = () => {
  const { user, isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1c12] text-white text-xs font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    )
  }

  if (isLoggedIn && user?.role === 'admin') {
    return <Navigate to="/admin/campsites" replace />
  }

  return <Outlet />
}

export const PublicOnlyRoute = () => {
  const { user, isLoggedIn, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0c1c12] text-white text-xs font-semibold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying authentication...</span>
        </div>
      </div>
    )
  }

  if (isLoggedIn) {
    if (user && user.isAccountVerified === false) {
      return <Navigate to="/verify-email" replace />
    }
    if (user && user.role === 'admin') {
      return <Navigate to="/admin/campsites" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}

