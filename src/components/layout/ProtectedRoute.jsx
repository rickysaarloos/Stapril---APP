/**
 * Beveiligde route component met loading- en role-check.
 * @param {{children: React.ReactNode, adminOnly?: boolean}} props
 * @returns {JSX.Element}
 */
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuthContext()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f1010',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid #2a2d2d',
          borderTopColor: '#c8f135',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />

  // ✅ Gewoon children teruggeven. De StepTrackerProvider zit nu in App.jsx
  // zodat deze NIET unmount bij navigatie en de teller gewoon doorloopt.
  return children
}