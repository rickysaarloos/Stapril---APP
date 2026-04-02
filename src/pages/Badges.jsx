import { useAuthContext } from '../context/AuthContext' // Eigen hook om huidige gebruiker op te halen
import { useBadges, ALLE_BADGES } from '../hooks/useBadges' // Hook en constante voor alle badges
import { useNavigate } from 'react-router-dom' // Hook voor navigatie tussen pagina's
import { useState, useEffect } from 'react' // React hooks voor state en lifecycle

export default function BadgesPage() {
  const { user } = useAuthContext() // Huidige ingelogde gebruiker ophalen
  const { verdiendeBadges, loading } = useBadges(user?.uid) // Haal badges van gebruiker op; loading flag
  const navigate = useNavigate() // Functie om te navigeren
  const [nieuwVerdiend, setNieuwVerdiend] = useState(null) // State voor animatie van net verdiende badge

  // Animatie triggeren voor nieuw verdiende badge
  useEffect(() => {
    const nieuw = localStorage.getItem('nieuw_badge') // Check of dashboard iets in localStorage heeft gezet
    if (nieuw) {
      setNieuwVerdiend(nieuw) // trigger animatie
      localStorage.removeItem('nieuw_badge') // reset localStorage
      setTimeout(() => setNieuwVerdiend(null), 3000) // stop animatie na 3 seconden
    }
  }, [])

  // Loading state tonen als badges nog niet geladen zijn
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/10 border-t-[#84cc16] rounded-full animate-spin" />
        {/* Spinner: ronde cirkel die draait */}
      </div>
    )
  }

  // Hoofd render
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span> 
          {/* Logo/icoon */}
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span> 
          {/* App naam */}
        </div>
        <button
          onClick={() => navigate('/dashboard')} // Ga terug naar dashboard
          className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
        >
          ← Dashboard
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">

        {/* Header */}
        <div>
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">jouw prestaties</p>
          <h1 className="text-4xl font-black tracking-tight">Badges</h1>
          <p className="text-white/30 text-sm mt-2">
            {Object.keys(verdiendeBadges).length} van {ALLE_BADGES.length} badges verdiend
          </p>
        </div>

        {/* Voortgangsbalk */}
        <div className="w-full bg-white/5 rounded-full h-1.5">
          <div
            className="bg-[#84cc16] h-1.5 rounded-full transition-all duration-700"
            style={{ width: `${(Object.keys(verdiendeBadges).length / ALLE_BADGES.length) * 100}%` }}
          />
          {/* Breedte proportioneel aan aantal verdiende badges */}
        </div>

        {/* Grid van badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALLE_BADGES.map((badge) => {
            const isVerdiend = !!verdiendeBadges[badge.id] // True als gebruiker badge heeft
            const isNieuw = nieuwVerdiend === badge.id // True als dit de nieuw verdiende badge is
            const data = verdiendeBadges[badge.id] // Data van deze badge

            return (
              <div
                key={badge.id}
                className={`
                  relative rounded-2xl p-5 border transition-all duration-500
                  ${isVerdiend
                    ? isNieuw
                      ? 'bg-[#84cc16]/15 border-[#84cc16]/60 scale-[1.02] shadow-lg shadow-[#84cc16]/10'
                      : 'bg-[#84cc16]/[0.06] border-[#84cc16]/25'
                    : 'bg-white/[0.02] border-white/5 opacity-50'
                  }
                `}
              >
                {/* Nieuw verdiend animatie */}
                {isNieuw && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-[#84cc16] animate-ping opacity-30 pointer-events-none" />
                )}

                <div className="flex items-start gap-4">

                  {/* Icoon */}
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0
                    ${isVerdiend ? 'bg-[#84cc16]/20' : 'bg-white/5 grayscale'}
                  `}>
                    {badge.icoon} {/* Emoji of icoon */}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${isVerdiend ? 'text-white' : 'text-white/40'}`}>
                        {badge.naam}
                      </h3>
                      {isNieuw && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-[#84cc16] text-[#0a0a0a] px-2 py-0.5 rounded-full">
                          Nieuw!
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 ${isVerdiend ? 'text-white/40' : 'text-white/20'}`}>
                      {badge.beschrijving}
                    </p>
                    {isVerdiend && data?.verdiendOp && (
                      <p className="text-[10px] text-[#84cc16]/50 mt-1.5">
                        Verdiend op{' '}
                        {data.verdiendOp?.toDate?.()?.toLocaleDateString('nl-NL', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        }) ?? '…'}
                      </p>
                    )}
                  </div>

                  {/* Vinkje */}
                  {isVerdiend && (
                    <div className="w-6 h-6 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 12 12" fill="none" width="12" height="12">
                        <path d="M2 6l3 3 5-5" stroke="#0a0a0a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}