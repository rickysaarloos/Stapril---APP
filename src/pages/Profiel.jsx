/**
 * Profielpagina voor gebruikersstatistieken en badges.
 * @returns {JSX.Element}
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

const BADGE_DEF = [
  { id: 'eerste-stap',      icon: '🥇', name: 'Eerste stap',      desc: 'Eerste keer stappen invoeren' },
  { id: 'dagdoel',          icon: '🎯', name: 'Dagdoel gehaald',   desc: '10.000+ stappen op één dag' },
  { id: 'week-op-rij',      icon: '🔥', name: 'Week op rij',       desc: '7 dagen achter elkaar dagdoel gehaald' },
  { id: 'halve-maand',      icon: '🌗', name: 'Halve maand',       desc: '15 dagen dagdoel gehaald in april' },
  { id: 'volmaakte-april',  icon: '🏆', name: 'Volmaakte april',   desc: 'Alle 30 dagen het dagdoel gehaald' },
]

/**
 * Streefwaarden voor milestones op Profiel pagina.
 * @type {number[]}
 */
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1_000_000]

/**
 * Berekent volgende milestone boven huidig aantal stappen.
 * @param {number} steps Totale stappen
 * @returns {number}
 */
function getNextMilestone(steps) {
  return MILESTONES.find(m => m > steps) ?? MILESTONES.at(-1)
}
/**
 * Berekent vorige milestone onder huidig aantal stappen.
 * @param {number} steps Totale stappen
 * @returns {number}
 */
function getPrevMilestone(steps) {
  const idx = MILESTONES.findIndex(m => m > steps)
  return idx <= 0 ? 0 : MILESTONES[idx - 1]
}

/**
 * Formatteert getallen voor Dutch locale.
 * @param {number} n Getal
 * @returns {string}
 */
function fmt(n) {
  return n.toLocaleString('nl-NL')
}

// ── Sub-components ─────────────────────────────────────────

/**
 * Sub-component voor één badge rij.
 * @param {{badge:object, unlocked:boolean}} props
 * @returns {JSX.Element}
 */
function BadgeRow({ badge, unlocked }) {
  return (
    <div className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors
      ${unlocked
        ? 'bg-[#84cc16]/[0.04] border-[#84cc16]/25'
        : 'bg-white/[0.02] border-white/[0.07] opacity-50'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
        ${unlocked ? 'bg-[#84cc16]/10' : 'bg-white/5'}`}
      >
        {badge.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{badge.name}</p>
        <p className="text-white/35 text-xs mt-0.5 truncate">{badge.desc}</p>
      </div>

      <div className="flex-shrink-0">
        {unlocked ? (
          <div className="w-5 h-5 rounded-full bg-[#84cc16] flex items-center justify-center">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none" stroke="#0a0a0a" strokeWidth="2.5">
              <polyline points="1,4 4,7 9,1" />
            </svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center">
            <svg className="w-2.5 h-2.5" viewBox="0 0 9 11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <rect x="1.5" y="4.5" width="6" height="5.5" rx="1" />
              <path d="M3 4.5V3a1.5 1.5 0 013 0v1.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────

/**
 * Profielpagina component toont totaalstappen, teaminformatie en badges.
 * @returns {JSX.Element}
 */
export default function Profiel() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

  const [totalSteps, setTotalSteps] = useState(0)
  const [badges, setBadges] = useState([])
  const [teamNaam, setTeamNaam] = useState('')
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    if (!user?.uid) return

    async function laadData() {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const data = snap.data() ?? {}

        setTotalSteps(data.totalSteps ?? 0)
        setBadges(data.badges ?? [])

        if (data.teamId) {
          const teamSnap = await getDoc(doc(db, 'teams', data.teamId))
          setTeamNaam(teamSnap.data()?.naam ?? '')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLaden(false)
      }
    }

    laadData()
  }, [user])

  const next = getNextMilestone(totalSteps)
  const prev = getPrevMilestone(totalSteps)
  const pct = next === prev ? 100 : Math.round(((totalSteps - prev) / (next - prev)) * 100)
  const earnedCount = BADGE_DEF.filter(b => badges.includes(b.id)).length
  const initials = (user?.displayName ?? user?.email ?? 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  if (laden) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#84cc16]/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-sm mx-auto px-5 pb-12">

        {/* Header */}
        <div className="flex items-center gap-4 pt-6 pb-5 border-b border-white/[0.08]">
          <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 flex items-center justify-center text-[#84cc16] font-black text-lg flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xl tracking-tight truncate">
              {user?.displayName ?? user?.email}
            </p>
            {teamNaam && (
              <div className="inline-flex items-center gap-1.5 mt-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-0.5">
                <span className="text-[#84cc16] text-[10px]">⬡</span>
                <span className="text-white/40 text-xs">{teamNaam}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total steps */}
        <div className="relative mt-5 p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          {/* glow blob */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#84cc16]/10 rounded-full blur-2xl pointer-events-none" />

          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-2 font-medium">
            Totale stappen aller tijden
          </p>
          <p className="text-white font-black text-5xl tracking-tighter leading-none">
            {fmt(totalSteps)}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16]" />
            <span className="text-white/35 text-xs">stappen geteld</span>
          </div>

          {/* Progress to next milestone */}
          <div className="mt-4 pt-4 border-t border-white/[0.07]">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>Volgende mijlpaal</span>
              <span className="text-white/50">{fmt(next)}</span>
            </div>
            <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#84cc16] rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-white font-black text-base tracking-tight">Badges</h2>
            <span className="text-white/30 text-xs">{earnedCount} / {BADGE_DEF.length} behaald</span>
          </div>

          <div className="space-y-2">
            {BADGE_DEF.map(badge => (
              <BadgeRow
                key={badge.id}
                badge={badge}
                unlocked={badges.includes(badge.id)}
              />
            ))}
          </div>
        </div>

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all duration-200"
        >
          ← Terug naar dashboard
        </button>

      </div>
    </div>
  )
}