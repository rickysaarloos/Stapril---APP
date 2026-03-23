import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RegisterPage from './pages/RegisterPage'

const LoginPage  = () => <div style={{color:'#fff',padding:'2rem'}}>Login (komt nog)</div>
const Dashboard  = () => <div style={{color:'#fff',padding:'2rem'}}>Dashboard (komt nog)</div>
const AdminPanel = () => <div style={{color:'#fff',padding:'2rem'}}>Admin (komt nog)</div>

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}