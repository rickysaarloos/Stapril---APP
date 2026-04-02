import { createContext, useContext } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * React context voor authenticatiegegevens.
 */
const AuthContext = createContext(null)

/**
 * Provider voor AuthContext om useAuth hook te delen.
 * @param {{children:any}} props
 */
export function AuthProvider({ children }) {
  const auth = useAuth()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * Hook om authcontext te gebruiken, error als buiten provider.
 * @returns {object}
 */
export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext moet binnen <AuthProvider> worden gebruikt')
  return ctx
}