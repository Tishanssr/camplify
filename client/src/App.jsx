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
import Invitation from './pages/invitation'
import PersonalChecklist from './pages/personal-checklist'

const App = () => {
  return (
    <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/home" element={<Home />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/explore/:campsiteId" element={<CampsiteDetail />} />
      <Route path="/trips" element={<Trips />} />
      <Route path="/trips/new" element={<CreateTrip />} />
      <Route path="/trips/:tripId/:tab?" element={<TripDetail />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/invite/:inviteCode" element={<Invitation />} />
      <Route path="/my-checklist" element={<PersonalChecklist />} />
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  )
}

export default App
