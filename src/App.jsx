import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'

import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}