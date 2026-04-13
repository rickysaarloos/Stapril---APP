import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import { StepTrackerProvider } from './context/StepTrackerContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import TrackingIndicator from './components/TrackingIndicator'

import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import AdminHandleiding from './pages/AdminHandleiding'
import Team from './pages/Team'
import Profiel from './pages/Profiel'
import BadgesPage from './pages/Badges'

function PublicRoute({ children }) {
  const { user, loading } = useAuthContext()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/profiel" element={<ProtectedRoute><Profiel /></ProtectedRoute>} />
      <Route path="/badges" element={<ProtectedRoute><BadgesPage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
      <Route path="/admin/handleiding" element={<ProtectedRoute adminOnly><AdminHandleiding /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

/**
 * Houdt de StepTrackerProvider & Indicator altijd gemount zolang de user ingelogd is.
 * Dit voorkomt context-fouten én zorgt dat tracking NIET stopt bij navigatie.
 */
function AppContent() {
  const { user, loading } = useAuthContext()
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }

  const routes = <AppRoutes />

  if (user) {
    return (
      <StepTrackerProvider uid={user.uid}>
        <TrackingIndicator />
        {routes}
      </StepTrackerProvider>
    )
  }

  return routes
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}