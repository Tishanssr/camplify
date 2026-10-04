import { Navigate, Route, Routes } from 'react-router-dom'
import Register from './pages/register'
import Login from './pages/login'
import ForgotPassword from './pages/forgot-password'
import ResetPassword from './pages/reset-password'
import VerifyEmail from './pages/verify-email'
import Home from './pages/home'
import Dashboard from './pages/dashboard'
import Explore from './pages/explore'
import Trips from './pages/trips'
import Notifications from './pages/notifications'
import Pricing from './pages/pricing'
import TripDetail from './pages/trip-detail'
import CreateTrip from './pages/create-trip'
import CampsiteDetail from './pages/campsite-detail'
import Profile from './pages/profile'
import PublicProfile from './pages/PublicProfile'
import Invitation from './pages/invitation'
import AdminCampsites from './pages/admin-campsites'
import AdminRoute from './components/AdminRoute'
import { ProtectedRoute, PublicOnlyRoute, UserOnlyRoute } from './components/auth/ProtectedRoute'

const App = () => {
  return (
    <Routes>
      {/* Public User Pages (guests & regular users only, admins redirected to portal) */}
      <Route element={<UserOnlyRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/invite/:inviteCode" element={<Invitation />} />
      </Route>

      {/* Guest Only Pages (redirects to /dashboard or /admin/campsites if already logged in) */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      {/* Verification Page */}
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected Pages (requires logged in; redirects to /login if NOT logged in, redirects to /admin/campsites if admin) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/:campsiteId" element={<CampsiteDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/new" element={<CreateTrip />} />
        <Route path="/trips/:tripId/:tab?" element={<TripDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<PublicProfile />} />
      </Route>

      {/* Admin Pages (requires logged in + admin role) */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/campsites" element={<AdminCampsites />} />
      </Route>

      {/* Catch-all Fallback */}
      <Route element={<UserOnlyRoute />}>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
