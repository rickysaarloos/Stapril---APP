import { Navigate } from 'react-router-dom' // Importeert Navigate om gebruikers te kunnen doorsturen naar een andere route
import { useAuthContext } from '../../context/AuthContext' // Importeert een custom hook om de ingelogde gebruiker en laadstatus op te halen

export default function ProtectedRoute({ children, adminOnly = false }) { // Definieert een component dat routes beschermt, met optioneel admin-check
  const { user, loading } = useAuthContext() // Haalt de huidige gebruiker en loading-status uit de context

  if (loading) { // Controleert of de authenticatie nog aan het laden is
    return (
      <div style={{ // Container voor een fullscreen laadscherm
        minHeight: '100vh', // Zorgt dat het scherm de volledige hoogte inneemt
        background: '#0f1010', // Donkere achtergrondkleur
        display: 'flex', // Flexbox layout
        alignItems: 'center', // Verticaal centreren
        justifyContent: 'center', // Horizontaal centreren
      }}>
        <div style={{ // Spinner (laadicoon)
          width: 32, // Breedte van de spinner
          height: 32, // Hoogte van de spinner
          border: '3px solid #2a2d2d', // Grijze rand
          borderTopColor: '#c8f135', // Bovenste rand heeft een andere kleur (voor animatie-effect)
          borderRadius: '50%', // Maakt het een cirkel
          animation: 'spin 0.7s linear infinite', // Laat de spinner continu draaien
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style> {/* CSS animatie voor draaien */}
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace /> // Als er geen gebruiker is → stuur naar loginpagina
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace /> // Als admin vereist is maar gebruiker geen admin is → stuur naar dashboard

  return children // Als alles goed is → toon de beveiligde content
}