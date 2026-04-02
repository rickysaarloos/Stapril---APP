import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// Importeer routing-componenten van react-router-dom
import { AuthProvider, useAuthContext } from './context/AuthContext'
// Importeer de contextprovider voor authenticatie en hook voor user state
import ProtectedRoute from './components/layout/ProtectedRoute'
// Importeer component dat beschermde routes checkt

import Register from './pages/Register'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import Team from './pages/Team'
import Profiel from './pages/Profiel'
import BadgesPage from './pages/Badges'
// Importeer de verschillende pagina-componenten

// ── Publieke route wrapper ────────────────────────────────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuthContext()
  // Haal user en loading state uit context
  if (loading) return null 
  // Wacht tot auth geladen is
  return user ? <Navigate to="/dashboard" replace /> : children
  // Als user ingelogd is, redirect naar dashboard, anders render children
}

// ── Routes definitie ─────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>

      {/* Publieke routes */}
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />
      {/* Alleen toegankelijk als niet ingelogd, anders redirect */}

      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      {/* Alleen toegankelijk als niet ingelogd, anders redirect */}

      {/* Beschermde routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      {/* Alleen toegankelijk als ingelogd */}

      <Route path="/team" element={
        <ProtectedRoute><Team /></ProtectedRoute>
      } />
      {/* Alleen toegankelijk als ingelogd */}

      <Route path="/profiel" element={
        <ProtectedRoute><Profiel /></ProtectedRoute>
      } />
      {/* Alleen toegankelijk als ingelogd */}

      <Route path="/badges" element={
        <ProtectedRoute><BadgesPage /></ProtectedRoute>
      } />
      {/* Alleen toegankelijk als ingelogd */}

      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
      } />
      {/* Alleen toegankelijk als ingelogd én admin */}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      {/* Alle andere routes redirecten naar login */}

    </Routes>
  )
}

// ── Hoofd App component ───────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      {/* BrowserRouter houdt de URL state bij */}
      <AuthProvider>
        {/* Context provider voor authenticatie */}
        <AppRoutes />
        {/* Laad alle routes */}
      </AuthProvider>
    </BrowserRouter>
  )
}