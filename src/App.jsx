import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import AdminHandleiding from './pages/AdminHandleiding'
import Team from './pages/Team'
import Profiel from './pages/Profiel'
import BadgesPage from './pages/Badges'

/**
 * Route wrapper die ingelogde gebruikers doorstuurt naar dashboard.
 * @param {{children: React.ReactNode}} props
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuthContext()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

/**
 * Definieert alle applicatieroutes met beveiliging.
 * @returns {JSX.Element}
 */
function AppRoutes() {
  return (
    <Routes>

      {/* Publieke routes */}
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />

      {/* Beschermde routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/team" element={
        <ProtectedRoute><Team /></ProtectedRoute>
      } />

      <Route path="/profiel" element={
        <ProtectedRoute><Profiel /></ProtectedRoute>
      } />

      <Route path="/badges" element={
        <ProtectedRoute><BadgesPage /></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
      } />

      <Route path="/admin/handleiding" element={
        <ProtectedRoute adminOnly><AdminHandleiding /></ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}

/**
 * Root component met router en authprovider.
 * @returns {JSX.Element}
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}