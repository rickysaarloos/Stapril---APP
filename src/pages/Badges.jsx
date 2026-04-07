/**
 * Pagina voor gebruikersbadges en voortgang.
 * @returns {JSX.Element}
 */
import { useAuthContext } from '../context/AuthContext'
import { useBadges, ALLE_BADGES } from '../hooks/useBadges'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function BadgesPage() {
  const { user } = useAuthContext()
  const { verdiendeBadges, loading } = useBadges(user?.uid)
  const navigate = useNavigate()
  const [nieuwVerdiend, setNieuwVerdiend] = useState(null)

  // Animatie triggeren als een badge net verdiend is
  useEffect(() => {
    const nieuw = localStorage.getItem('nieuw_badge')
    if (nieuw) {
      setNieuwVerdiend(nieuw)
      localStorage.removeItem('nieuw_badge')
      setTimeout(() => setNieuwVerdiend(null), 3000)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/10 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar — slide-down animatie */}
      <header className="animate-slide-down border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
        >
          ← Dashboard
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">

        {/* Titel sectie — fade-in */}
        <div className="animate-fade-in">
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">jouw prestaties</p>
          <h1 className="text-4xl font-black tracking-tight">Badges</h1>
          <p className="text-white/30 text-sm mt-2">
            {Object.keys(verdiendeBadges).length} van {ALLE_BADGES.length} badges verdiend
          </p>
        </div>

        {/* Voortgangsbalk — fade-in-delay-1 + glow */}
        <div className="animate-fade-in-delay-1 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-[#84cc16] h-1.5 rounded-full transition-all duration-700 shadow-sm shadow-[#84cc16]/50"
            style={{ width: `${(Object.keys(verdiendeBadges).length / ALLE_BADGES.length) * 100}%` }}
          />
        </div>

        {/* Badge grid — fade-in-delay-2 */}
        <div className="animate-fade-in-delay-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ALLE_BADGES.map((badge) => {
            const isVerdiend = !!verdiendeBadges[badge.id]
            const isNieuw = nieuwVerdiend === badge.id
            const data = verdiendeBadges[badge.id]

            return (
              <div
                key={badge.id}
                className={`
                  relative rounded-2xl p-5 border transition-all duration-300 cursor-default
                  ${isVerdiend
                    ? isNieuw
                      ? 'bg-[#84cc16]/15 border-[#84cc16]/60 scale-[1.02] shadow-lg shadow-[#84cc16]/10'
                      : 'bg-[#84cc16]/[0.06] border-[#84cc16]/25 hover:bg-[#84cc16]/[0.10] hover:border-[#84cc16]/40 hover:scale-[1.01]'
                    : 'bg-white/[0.02] border-white/5 opacity-50 hover:opacity-70 hover:bg-white/[0.04]'
                  }
                `}
              >
                {/* Nieuw verdiend animatie — ping + fade */}
                {isNieuw && (
                  <>
                    <div className="absolute inset-0 rounded-2xl border-2 border-[#84cc16] animate-ping opacity-30 pointer-events-none" />
                    <div className="absolute -inset-0.5 rounded-2xl bg-[#84cc16]/20 blur-sm animate-pulse pointer-events-none" />
                  </>
                )}

                <div className="flex items-start gap-4">
                  {/* Icoon — hover lift */}
                  <div className={`
                    w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-200
                    ${isVerdiend ? 'bg-[#84cc16]/20 hover:scale-110' : 'bg-white/5 grayscale'}
                  `}>
                    {badge.icoon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm transition-colors ${isVerdiend ? 'text-white' : 'text-white/40'}`}>
                        {badge.naam}
                      </h3>
                      {isNieuw && (
                        <span className="animate-fade-in text-[10px] font-black uppercase tracking-widest bg-[#84cc16] text-[#0a0a0a] px-2 py-0.5 rounded-full">
                          Nieuw!
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 transition-colors ${isVerdiend ? 'text-white/40' : 'text-white/20'}`}>
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

                  {/* Vinkje — pop-in animatie */}
                  {isVerdiend && (
                    <div className="w-6 h-6 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0 animate-fade-in">
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

        {/* Optional: toast notificatie als badge net verdiend is */}
        {nieuwVerdiend && (
          <div className="animate-slide-up fixed bottom-6 right-6 bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-lg px-4 py-3 text-[#84cc16] text-sm shadow-lg shadow-[#84cc16]/10 z-50">
            🎉 Nieuwe badge verdiend!
          </div>
        )}
      </main>
    </div>
  )
}