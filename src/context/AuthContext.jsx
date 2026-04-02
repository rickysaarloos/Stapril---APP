import { createContext, useContext } from 'react' // Importeert React functies voor context API
import { useAuth } from '../hooks/useAuth' // Custom hook die alle auth logica bevat

const AuthContext = createContext(null) // Maakt een context aan met standaardwaarde null

export function AuthProvider({ children }) { // Provider component die auth data beschikbaar maakt
  const auth = useAuth() // Roept de useAuth hook aan (bijv. user, login, logout, loading)

  return (
    <AuthContext.Provider value={auth}> {/* Geeft auth data door aan alle child components */}
      {children} {/* Render alle child components binnen deze provider */}
    </AuthContext.Provider>
  )
}

export function useAuthContext() { // Custom hook om makkelijk bij de context te komen
  const ctx = useContext(AuthContext) // Haalt de huidige context waarde op

  if (!ctx) throw new Error('useAuthContext moet binnen <AuthProvider> worden gebruikt') 
  // Als er geen provider is → gooi error (beschermt tegen verkeerd gebruik)

  return ctx // Geeft de context (auth data) terug
}