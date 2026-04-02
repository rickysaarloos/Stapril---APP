import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

/**
 * Validatie voor registratievelden.
 * @type {{naam:(v:string)=>string|null,email:(v:string)=>string|null,password:(v:string)=>string|null}}
 */
const validate = {
  naam(v) {
    if (!v.trim()) return 'Vul je naam in'
    return null
  },
  email(v) {
    if (!v.trim()) return 'Vul je e-mailadres in'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ongeldig e-mailadres'
    return null
  },
  password(v) {
    if (v.length < 8) return 'Minimaal 8 tekens'
    if (!/[A-Z]/.test(v)) return 'Minimaal één hoofdletter'
    if (!/[0-9]/.test(v)) return 'Minimaal één cijfer'
    return null
  },
}

/**
 * Registratiepagina voor nieuwe gebruikers.
 * @returns {JSX.Element}
 */
export default function RegisterPage() {
  const navigate = useNavigate()
  const { registreer } = useAuthContext()

  const [fields, setFields] = useState({ naam: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [firebaseError, setFirebaseError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setFields((prev) => ({ ...prev, [field]: value }))
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validate[field](value) }))
    }
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validate[field](fields[field]) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFirebaseError(null)

    const newErrors = {
      naam: validate.naam(fields.naam),
      email: validate.email(fields.email),
      password: validate.password(fields.password),
    }
    setErrors(newErrors)
    setTouched({ naam: true, email: true, password: true })
    if (Object.values(newErrors).some(Boolean)) return

    setSubmitting(true)

    try {
      await registreer(fields.naam.trim(), fields.email.trim(), fields.password)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setFirebaseError('Dit e-mailadres is al in gebruik.')
      } else {
        setFirebaseError('Er ging iets mis. Probeer het opnieuw.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-10 relative overflow-x-hidden">

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-lime-400 opacity-[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-lime-400 opacity-[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-[fadeUp_0.45s_ease_both]">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-950 shrink-0">
            <FootstepsIcon />
          </div>
          <span className="font-black text-3xl tracking-widest text-zinc-100 uppercase">
            Stap<span className="text-lime-400">ril</span>
          </span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-4xl font-black tracking-tight text-zinc-100 leading-tight">
            Maak een <span className="text-lime-400">account</span>
          </h1>
          <p className="mt-2 text-zinc-500 text-sm leading-relaxed">
            Start jouw stappenchallenge vandaag.
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">

          {firebaseError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-5">
              <AlertIcon />
              <span>{firebaseError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            <Field
              label="Naam"
              id="naam"
              type="text"
              value={fields.naam}
              placeholder="Jouw naam"
              error={errors.naam}
              icon={<UserIcon />}
              onChange={handleChange('naam')}
              onBlur={handleBlur('naam')}
            />

            <Field
              label="E-mailadres"
              id="email"
              type="email"
              value={fields.email}
              placeholder="jan@bedrijf.nl"
              error={errors.email}
              icon={<MailIcon />}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
            />

            <Field
              label="Wachtwoord"
              id="password"
              type="password"
              value={fields.password}
              placeholder="Sterk wachtwoord"
              error={errors.password}
              icon={<LockIcon />}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
            />

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 bg-lime-400 hover:bg-lime-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black text-sm uppercase tracking-widest rounded-xl py-3.5 flex items-center justify-center transition-all duration-150 min-h-[48px]"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Registreren →'
              )}
            </button>
          </form>

          <p className="text-center mt-5 text-sm text-zinc-500">
            Al een account?{' '}
            <Link to="/login" className="text-lime-400 font-semibold hover:opacity-75 transition-opacity">
              Inloggen
            </Link>
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 justify-center mt-5">
          <span className="w-2 h-2 rounded-full bg-lime-400 scale-125" />
          <span className="w-2 h-2 rounded-full bg-zinc-700" />
          <span className="w-2 h-2 rounded-full bg-zinc-700" />
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

function Field({ label, id, type, value, placeholder, error, icon, onChange, onBlur }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
        {label}
      </label>
      <div className={`relative flex items-center rounded-xl border bg-zinc-950 transition-all ${
        error
          ? 'border-red-500 ring-2 ring-red-500/20'
          : 'border-zinc-800 focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-400/20'
      }`}>
        <span className="absolute left-3.5 text-zinc-600 pointer-events-none">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          className="w-full bg-transparent text-zinc-100 text-sm pl-10 pr-4 py-3 outline-none placeholder:text-zinc-700 rounded-xl"
          onChange={onChange}
          onBlur={onBlur}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
          <AlertIcon /> {error}
        </p>
      )}
    </div>
  )
}

function FootstepsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
      <circle cx="10" cy="5" r="2" fill="currentColor"/>
      <path d="M7 8l1 5h4l1-5H7z" fill="currentColor"/>
      <path d="M6 13l1 6h5l1-6H6z" fill="currentColor" opacity=".6"/>
      <circle cx="16" cy="9" r="2" fill="currentColor"/>
      <path d="M13 12l1 5h4l1-5h-6z" fill="currentColor"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3 12-3 12 0" />
    </svg>
  )
}
function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3" width="14" height="10" rx="2"/>
      <path d="M1 5l7 5 7-5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5"/>
      <path d="M5 7V5a3 3 0 016 0v2" strokeLinecap="round"/>
    </svg>
  )
}
function AlertIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" width="12" height="12" className="shrink-0">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 4v3M6 8.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}