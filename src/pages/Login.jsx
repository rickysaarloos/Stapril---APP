import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuthContext()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', wachtwoord: '' })
  const [serverFout, setServerFout] = useState('')
  const [laden, setLaden] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setServerFout('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.wachtwoord) {
      setServerFout('Vul alle velden in.')
      return
    }
    setLaden(true)
    try {
      await login(form.email.trim(), form.wachtwoord)
      navigate('/dashboard')
    } catch (err) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setServerFout('E-mailadres of wachtwoord klopt niet.')
      } else {
        setServerFout('Er ging iets mis. Probeer het opnieuw.')
      }
    } finally {
      setLaden(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] grid md:grid-cols-2">

      {/* Left panel */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-[#0f0f0f] border-r border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-[#84cc16] text-2xl leading-none">⬡</span>
          <span className="text-white text-xl font-bold tracking-widest uppercase">Stapril</span>
        </div>
        <div>
          <p className="text-[#84cc16] text-xs tracking-[0.2em] uppercase mb-4">april challenge</p>
          <h1 className="text-white font-black leading-[0.9] text-[clamp(4rem,7vw,7rem)] tracking-tight">
            10.000<br />stappen.<br />Elke dag.
          </h1>
        </div>
        <div className="flex items-center gap-8 pt-8 border-t border-white/5">
          {[['30', 'dagen'], ['5', 'badges'], ['∞', 'teams']].map(([num, lbl]) => (
            <div key={lbl}>
              <div className="text-white text-3xl font-black leading-none">{num}</div>
              <div className="text-white/30 text-xs uppercase tracking-widest mt-1">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <span className="text-[#84cc16] text-xl leading-none">⬡</span>
            <span className="text-white text-lg font-bold tracking-widest uppercase">Stapril</span>
          </div>

          <h2 className="text-white text-2xl font-bold tracking-tight mb-1">Inloggen</h2>
          <p className="text-white/30 text-sm mb-8">
            Nog geen account?{' '}
            <Link to="/register" className="text-[#84cc16] hover:underline">Registreren</Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-white/40 text-xs uppercase tracking-widest" htmlFor="email">
                E-mailadres
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jan@bedrijf.nl"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-lg px-3.5 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-white/40 text-xs uppercase tracking-widest" htmlFor="wachtwoord">
                Wachtwoord
              </label>
              <input
                id="wachtwoord"
                name="wachtwoord"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.wachtwoord}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-lg px-3.5 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              />
            </div>

            {serverFout && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
                {serverFout}
              </div>
            )}

            <button
              type="submit"
              disabled={laden}
              className="w-full bg-[#84cc16] hover:bg-[#95d926] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                text-[#0a0a0a] font-bold text-sm rounded-lg py-3 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {laden && (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />
              )}
              {laden ? 'Inloggen...' : 'Inloggen'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}