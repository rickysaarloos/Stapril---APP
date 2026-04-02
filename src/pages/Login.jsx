import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

/* -------------------------
  Validatie functies
------------------------- */
const validate = {
  email(v) {
    if (!v.trim()) return 'Vul je e-mailadres in'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ongeldig e-mailadres'
    return null
  },
  password(v) {
    if (!v) return 'Vul je wachtwoord in'
    return null
  },
}

/* -------------------------
  Hoofdcomponent
------------------------- */
export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthContext()  // Login functie van context

  /* -------------------------
    State hooks
  ------------------------- */
  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [firebaseError, setFirebaseError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  /* -------------------------
    Input handlers
  ------------------------- */
  const handleChange = (field) => (e) => {
    const value = e.target.value
    setFields(prev => ({ ...prev, [field]: value }))
    if (touched[field]) setErrors(prev => ({ ...prev, [field]: validate[field](value) }))
  }

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(prev => ({ ...prev, [field]: validate[field](fields[field]) }))
  }

  /* -------------------------
    Form submit
  ------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setFirebaseError(null)

    const newErrors = {
      email: validate.email(fields.email),
      password: validate.password(fields.password),
    }
    setErrors(newErrors)
    setTouched({ email: true, password: true })

    if (Object.values(newErrors).some(Boolean)) return

    setSubmitting(true)
    try {
      await login(fields.email.trim(), fields.password)
      navigate('/dashboard')
    } catch (err) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setFirebaseError('E-mailadres of wachtwoord klopt niet.')
      } else {
        setFirebaseError('Er ging iets mis. Probeer het opnieuw.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* -------------------------
    JSX
  ------------------------- */
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-10 relative overflow-x-hidden">

      {/* Achtergrond blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-lime-400 opacity-[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-lime-400 opacity-[0.03] rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-[fadeUp_0.45s_ease_both]">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-950 shrink-0">
            <FootstepsIcon />
          </div>
          <span className="font-black text-3xl tracking-widest text-zinc-100 uppercase">
            Stap<span className="text-lime-400">ril</span>
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black text-zinc-100 mb-2">Welkom <span className="text-lime-400">terug</span></h1>
        <p className="text-zinc-500 text-sm mb-5">Log in en ga verder met je stappenchallenge.</p>

        {/* Card Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">

          {/* Firebase foutmelding */}
          {firebaseError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-5">
              <AlertIcon />
              <span>{firebaseError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* E-mail */}
            <Field
              label="E-mailadres"
              id="email"
              type="email"
              value={fields.email}
              placeholder="jan@bedrijf.nl"
              autoComplete="email"
              error={errors.email}
              icon={<MailIcon />}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
            />

            {/* Wachtwoord */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
                Wachtwoord
              </label>
              <div className={`relative flex items-center rounded-xl border bg-zinc-950 transition-all ${
                errors.password
                  ? 'border-red-500 ring-2 ring-red-500/20'
                  : 'border-zinc-800 focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-400/20'
              }`}>
                <span className="absolute left-3.5 text-zinc-600 pointer-events-none"><LockIcon /></span>
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={fields.password}
                  placeholder="Jouw wachtwoord"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-zinc-100 text-sm pl-10 pr-10 py-3 outline-none placeholder:text-zinc-700 rounded-xl"
                  onChange={handleChange('password')}
                  onBlur={handleBlur('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400" role="alert">
                  <AlertIcon /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 bg-lime-400 hover:bg-lime-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black text-sm uppercase tracking-widest rounded-xl py-3.5 flex items-center justify-center transition-all duration-150 min-h-[48px]"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : 'Inloggen →'}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-zinc-500">
            Nog geen account? <Link to="/register" className="text-lime-400 font-semibold hover:opacity-75 transition-opacity">Registreren</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* -------------------------
  Herbruikbaar Field component
------------------------- */
function Field({ label, id, type, value, placeholder, autoComplete, error, icon, onChange, onBlur }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">{label}</label>
      <div className={`relative flex items-center rounded-xl border bg-zinc-950 transition-all ${
        error ? 'border-red-500 ring-2 ring-red-500/20'
              : 'border-zinc-800 focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-400/20'
      }`}>
        <span className="absolute left-3.5 text-zinc-600 pointer-events-none">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full bg-transparent text-zinc-100 text-sm pl-10 pr-4 py-3 outline-none placeholder:text-zinc-700 rounded-xl"
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!error}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400" role="alert">
          <AlertIcon /> {error}
        </p>
      )}
    </div>
  )
}

/* -------------------------
  Icon componenten
------------------------- */
function FootstepsIcon() { return <svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="10" cy="5" r="2" fill="currentColor"/><path d="M7 8l1 5h4l1-5H7z" fill="currentColor"/><path d="M6 13l1 6h5l1-6H6z" fill="currentColor" opacity=".6"/><circle cx="16" cy="9" r="2" fill="currentColor"/><path d="M13 12l1 5h4l1-5h-6z" fill="currentColor"/></svg> }
function MailIcon() { return <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10" rx="2"/><path d="M1 5l7 5 7-5" strokeLinecap="round" strokeLinejoin="round"/></svg> }
function LockIcon() { return <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/></svg> }
function EyeIcon() { return <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" strokeLinecap="round"/><circle cx="8" cy="8" r="2"/></svg> }
function EyeOffIcon() { return <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5"><path d="M2 2l12 12M6.5 6.6A3 3 0 0011.4 11" strokeLinecap="round"/><path d="M1 8s2.5-5 7-5c1.2 0 2.3.3 3.3.8M15 8s-.8 1.5-2.3 2.8" strokeLinecap="round"/></svg> }
function AlertIcon() { return <svg viewBox="0 0 12 12" fill="none" width="12" height="12" className="shrink-0"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg> }