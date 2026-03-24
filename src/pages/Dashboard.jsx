import { useAuthContext } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
 
const DAG_VAN_APRIL = () => {
  const nu = new Date()
  const start = new Date(nu.getFullYear(), 3, 1) // 1 april
  const diff = Math.floor((nu - start) / (1000 * 60 * 60 * 24)) + 1
  return Math.min(Math.max(diff, 1), 30)
}
 
const STATS = [
  { label: 'Dag', value: DAG_VAN_APRIL(), suffix: '/ 30' },
  { label: 'Doel', value: '10.000', suffix: 'stappen' },
  { label: 'Streak', value: '—', suffix: 'dagen' },
]
 
export default function Dashboard() {
  const { user, logout } = useAuthContext()
  const navigate = useNavigate()
 
  async function handleLogout() {
    await logout()
    navigate('/login')
  }
 
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
 
      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-xl leading-none">⬡</span>
          <span className="text-white font-bold tracking-widest uppercase text-sm">Stapril</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/40 text-sm hidden sm:block">{user?.email}</span>
          <button
            onClick={handleLogout}
            className="text-xs uppercase tracking-widest text-white/40 hover:text-white transition-colors border border-white/10 hover:border-white/30 rounded-lg px-3 py-1.5"
          >
            Uitloggen
          </button>
        </div>
      </header>
 
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
 
        {/* Welkom */}
        <div>
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-2">welkom terug</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            {user?.naam || 'Deelnemer'}
          </h1>
          <p className="text-white/30 text-sm mt-2">
            Rol: <span className="text-white/50 capitalize">{user?.role || 'deelnemer'}</span>
            {user?.teamId && (
              <> · Team: <span className="text-white/50">{user.teamId}</span></>
            )}
            {!user?.teamId && (
              <> · <span className="text-white/30">Geen team gekoppeld</span></>
            )}
          </p>
        </div>
 
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {STATS.map(({ label, value, suffix }) => (
            <div
              key={label}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex flex-col gap-1"
            >
              <span className="text-white/30 text-xs uppercase tracking-widest">{label}</span>
              <span className="text-white text-3xl font-black leading-none">{value}</span>
              <span className="text-white/20 text-xs">{suffix}</span>
            </div>
          ))}
        </div>
 
        {/* Stappen invoer (placeholder) */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Stappen vandaag</h2>
              <p className="text-white/30 text-sm">Voer je stappen in voor vandaag</p>
            </div>
            <span className="text-[#84cc16] text-2xl">👟</span>
          </div>
 
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="bijv. 8.450"
              className="flex-1 bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              disabled
            />
            <button
              disabled
              className="bg-[#84cc16] text-[#0a0a0a] font-bold text-sm rounded-lg px-5 py-3 opacity-40 cursor-not-allowed"
            >
              Opslaan
            </button>
          </div>
          <p className="text-white/20 text-xs">Stappen invoeren komt binnenkort beschikbaar.</p>
        </div>
 
        {/* Progress bar richting doel */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">Challenge voortgang</h2>
            <span className="text-white/30 text-xs uppercase tracking-widest">april 2025</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2">
            <div
              className="bg-[#84cc16] h-2 rounded-full transition-all"
              style={{ width: `${(DAG_VAN_APRIL() / 30) * 100}%` }}
            />
          </div>
          <p className="text-white/30 text-xs">
            Dag {DAG_VAN_APRIL()} van 30 · {30 - DAG_VAN_APRIL()} dagen resterend
          </p>
        </div>
 
        {/* Team placeholder */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold">Team</h2>
            <p className="text-white/30 text-sm mt-0.5">
              {user?.teamId ? `Je zit in team ${user.teamId}` : 'Je bent nog niet in een team'}
            </p>
          </div>
          <button
            disabled
            className="text-xs uppercase tracking-widest border border-white/10 text-white/30 rounded-lg px-4 py-2 cursor-not-allowed"
          >
            {user?.teamId ? 'Bekijken' : 'Aanmaken'}
          </button>
        </div>
 
      </main>
    </div>
  )
}
 