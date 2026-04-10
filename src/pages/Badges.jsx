/**
 * Pagina voor gebruikersbadges en voortgang.
 * @returns {JSX.Element}
 */
import { useAuthContext } from '../context/AuthContext'
import { useBadges, ALLE_BADGES } from '../hooks/useBadges'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
 
// Categorie labels & iconen
const CATEGORIE_INFO = {
  begin:      { label: 'Eerste stappen', icoon: '🌱' },
  afstand:    { label: 'Afstand & volume', icoon: '📏' },
  streak:     { label: 'Streaks & consistentie', icoon: '🔥' },
  mijlpaal:   { label: 'Mijlpalen', icoon: '🏁' },
  sociaal:    { label: 'Sociaal & team', icoon: '👥' },
  ontdekken:  { label: 'App ontdekken', icoon: '🔍' },
}
 
// Groepeer badges per categorie (behoud volgorde van ALLE_BADGES)
const BADGES_PER_CATEGORIE = ALLE_BADGES.reduce((acc, badge) => {
  if (!acc[badge.categorie]) acc[badge.categorie] = []
  acc[badge.categorie].push(badge)
  return acc
}, {})
 
function BadgeKaart({ badge, isVerdiend, isNieuw, data }) {
  return (
    <div
      className={`
        relative rounded-2xl p-4 border transition-all duration-300 cursor-default
        ${isVerdiend
          ? isNieuw
            ? 'bg-[#84cc16]/15 border-[#84cc16]/60 scale-[1.02] shadow-lg shadow-[#84cc16]/10'
            : 'bg-[#84cc16]/[0.06] border-[#84cc16]/25 hover:bg-[#84cc16]/[0.10] hover:border-[#84cc16]/40 hover:scale-[1.01]'
          : 'bg-white/[0.02] border-white/5 opacity-45 hover:opacity-65 hover:bg-white/[0.04]'
        }
      `}
    >
      {/* Ping animatie voor nieuw verdiende badge */}
      {isNieuw && (
        <>
          <div className="absolute inset-0 rounded-2xl border-2 border-[#84cc16] animate-ping opacity-30 pointer-events-none" />
          <div className="absolute -inset-0.5 rounded-2xl bg-[#84cc16]/20 blur-sm animate-pulse pointer-events-none" />
        </>
      )}
 
      <div className="flex items-start gap-3.5">
        {/* Icoon */}
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform duration-200
          ${isVerdiend ? 'bg-[#84cc16]/20 hover:scale-110' : 'bg-white/5 grayscale'}
        `}>
          {badge.icoon}
        </div>
 
        {/* Tekst */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold text-sm ${isVerdiend ? 'text-white' : 'text-white/40'}`}>
              {badge.naam}
            </h3>
            {isNieuw && (
              <span className="animate-fade-in text-[10px] font-black uppercase tracking-widest bg-[#84cc16] text-[#0a0a0a] px-2 py-0.5 rounded-full">
                Nieuw!
              </span>
            )}
          </div>
          <p className={`text-xs mt-0.5 leading-relaxed ${isVerdiend ? 'text-white/40' : 'text-white/20'}`}>
            {badge.beschrijving}
          </p>
          {isVerdiend && data?.verdiendOp && (
            <p className="text-[10px] text-[#84cc16]/50 mt-1.5">
              Verdiend op{' '}
              {data.verdiendOp?.toDate?.()?.toLocaleDateString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric',
              }) ?? '…'}
            </p>
          )}
        </div>

        {/* Vinkje / slot */}
        {isVerdiend ? (
          <div className="w-5 h-5 rounded-full bg-[#84cc16] flex items-center justify-center shrink-0 animate-fade-in">
            <svg viewBox="0 0 12 12" fill="none" width="10" height="10">
              <path d="M2 6l3 3 5-5" stroke="#0a0a0a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center shrink-0">
            <svg className="w-2.5 h-2.5" viewBox="0 0 9 11" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.8">
              <rect x="1.5" y="4.5" width="6" height="5.5" rx="1" />
              <path d="M3 4.5V3a1.5 1.5 0 013 0v1.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
 
export default function BadgesPage() {
  const { user } = useAuthContext()
  const { verdiendeBadges, loading } = useBadges(user?.uid)
  const navigate = useNavigate()
  const [nieuwVerdiend, setNieuwVerdiend] = useState(null)
  const [actieveCategorie, setActieveCategorie] = useState('alle')
 
  useEffect(() => {
    const nieuw = localStorage.getItem('nieuw_badge')
    if (nieuw) {
      setNieuwVerdiend(nieuw)
      localStorage.removeItem('nieuw_badge')
      // Scroll naar de juiste categorie als de badge er een heeft
      const badge = ALLE_BADGES.find(b => b.id === nieuw)
      if (badge) setActieveCategorie(badge.categorie)
      setTimeout(() => setNieuwVerdiend(null), 4000)
    }
  }, [])
 
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-white/10 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }
 
  const aantalVerdiend = Object.keys(verdiendeBadges).length
  const totaalBadges   = ALLE_BADGES.length
  const voortgangPct   = Math.round((aantalVerdiend / totaalBadges) * 100)
 
  // Filter badges op actieve categorie
  const getoondeBadgesPerCat = actieveCategorie === 'alle'
    ? BADGES_PER_CATEGORIE
    : { [actieveCategorie]: BADGES_PER_CATEGORIE[actieveCategorie] ?? [] }
 
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
 
      {/* Navbar */}
      <header className="animate-slide-down border-b border-white/5 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-30">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
        >
          ← Dashboard
        </button>
      </header>
 
      <main className="max-w-2xl mx-auto px-5 py-10 space-y-8">
 
        {/* Hero sectie */}
        <div className="animate-fade-in space-y-4">
          <div>
            <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">jouw prestaties</p>
            <h1 className="text-4xl font-black tracking-tight">Badges</h1>
          </div>
 
          {/* Voortgang kaart */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white font-black text-3xl tracking-tight">{aantalVerdiend}</span>
                <span className="text-white/30 text-lg"> / {totaalBadges}</span>
              </div>
              <div className="text-right">
                <span className="text-[#84cc16] font-black text-xl">{voortgangPct}%</span>
                <p className="text-white/30 text-xs mt-0.5">voltooid</p>
              </div>
            </div>
            <div className="w-full bg-white/[0.08] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#84cc16] h-2 rounded-full transition-all duration-700 shadow-sm shadow-[#84cc16]/50"
                style={{ width: `${voortgangPct}%` }}
              />
            </div>
            <p className="text-white/25 text-xs">
              {totaalBadges - aantalVerdiend} badges nog te behalen
            </p>
          </div>
        </div>
 
        {/* Categorie filter tabs */}
<div className="animate-fade-in-delay-1">
  <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActieveCategorie('alle')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
                ${actieveCategorie === 'alle'
                  ? 'bg-[#84cc16]/15 border border-[#84cc16]/40 text-[#84cc16]'
                  : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20'
                }`}
            >
              Alle badges
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${actieveCategorie === 'alle' ? 'bg-[#84cc16]/20 text-[#84cc16]' : 'bg-white/5 text-white/30'}`}>
                {totaalBadges}
              </span>
            </button>
            {Object.entries(CATEGORIE_INFO).map(([key, info]) => {
              const categorieBadges = BADGES_PER_CATEGORIE[key] ?? []
              const verdiendInCat  = categorieBadges.filter(b => verdiendeBadges[b.id]).length
              const isActief       = actieveCategorie === key
              return (
                <button
                  key={key}
                  onClick={() => setActieveCategorie(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap
                    ${isActief
                      ? 'bg-[#84cc16]/15 border border-[#84cc16]/40 text-[#84cc16]'
                      : 'bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20'
                    }`}
                >
                  <span>{info.icoon}</span>
                  <span className="hidden sm:inline">{info.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${isActief ? 'bg-[#84cc16]/20 text-[#84cc16]' : 'bg-white/5 text-white/30'}`}>
                    {verdiendInCat}/{categorieBadges.length}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
 
        {/* Badge secties */}
        <div className="animate-fade-in-delay-2 space-y-8">
          {Object.entries(getoondeBadgesPerCat).map(([catKey, badges]) => {
            const info           = CATEGORIE_INFO[catKey]
            const verdiendInCat  = badges.filter(b => verdiendeBadges[b.id]).length
 
            return (
              <section key={catKey} className="space-y-3">
                {/* Sectie header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{info.icoon}</span>
                    <h2 className="text-white font-bold text-sm tracking-tight">{info.label}</h2>
                  </div>
                  <span className="text-white/25 text-xs">{verdiendInCat}/{badges.length}</span>
                </div>
 
                {/* Badge kaarten */}
                <div className="space-y-2">
                  {badges.map(badge => (
                    <BadgeKaart
                      key={badge.id}
                      badge={badge}
                      isVerdiend={!!verdiendeBadges[badge.id]}
                      isNieuw={nieuwVerdiend === badge.id}
                      data={verdiendeBadges[badge.id]}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
 
      </main>
 
      {/* Toast notificatie */}
      {nieuwVerdiend && (() => {
        const badge = ALLE_BADGES.find(b => b.id === nieuwVerdiend)
        return (
          <div className="animate-slide-up fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#111] border border-[#84cc16]/30 rounded-2xl px-5 py-3.5 shadow-xl shadow-black/50 z-50 whitespace-nowrap">
            <span className="text-2xl">{badge?.icoon ?? '🎖️'}</span>
            <div>
              <p className="text-[#84cc16] font-bold text-sm">Nieuwe badge verdiend!</p>
              <p className="text-white/50 text-xs">{badge?.naam}</p>
            </div>
          </div>
        )
      })()}
 
    </div>
  )
}