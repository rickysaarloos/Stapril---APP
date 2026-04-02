import { useState } from 'react' // useState wordt gebruikt om interne state bij te houden, zoals formulierwaarden

import { useNavigate, Link } from 'react-router-dom' // useNavigate voor programmatic navigation, Link voor interne navigatie links

import { useAuthContext } from '../context/AuthContext' // custom hook om auth functies te gebruiken, zoals registreer en ingelogde gebruiker ophalen

// Validatie object voor alle velden
const validate = {
  naam(v) { // functie om naam te valideren
    if (!v.trim()) return 'Vul je naam in' // checkt of veld leeg is
    return null // geen fout
  },
  email(v) { // functie om e-mail te valideren
    if (!v.trim()) return 'Vul je e-mailadres in' // check leeg
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Ongeldig e-mailadres' // regex check
    return null // geen fout
  },
  password(v) { // functie om wachtwoord te valideren
    if (v.length < 8) return 'Minimaal 8 tekens' // minimaal 8 tekens
    if (!/[A-Z]/.test(v)) return 'Minimaal één hoofdletter' // minimaal 1 hoofdletter
    if (!/[0-9]/.test(v)) return 'Minimaal één cijfer' // minimaal 1 cijfer
    return null // geen fout
  },
}

// Hoofdcomponent voor registratiepagina
export default function RegisterPage() {
  const navigate = useNavigate() // functie om programmatic naar een andere pagina te navigeren
  const { registreer } = useAuthContext() // registreer functie uit auth context

  // state variabelen
  const [fields, setFields] = useState({ naam: '', email: '', password: '' }) // houdt de invoer van de gebruiker bij
  const [errors, setErrors] = useState({}) // houdt validatiefouten per veld bij
  const [touched, setTouched] = useState({}) // trackt welke velden al zijn aangeraakt
  const [firebaseError, setFirebaseError] = useState(null) // foutmelding van Firebase
  const [submitting, setSubmitting] = useState(false) // of het formulier bezig is met verzenden

  // handler voor verandering in een veld
  const handleChange = (field) => (e) => {
    const value = e.target.value // haalt de nieuwe waarde op
    setFields((prev) => ({ ...prev, [field]: value })) // update de juiste veldwaarde in state
    if (touched[field]) { // als veld al is aangeraakt
      setErrors((prev) => ({ ...prev, [field]: validate[field](value) })) // valideer live
    }
  }

  // handler voor blur (veld verlaten)
  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true })) // markeer veld als aangeraakt
    setErrors((prev) => ({ ...prev, [field]: validate[field](fields[field]) })) // voer validatie uit
  }

  // handler bij formulier submit
  const handleSubmit = async (e) => {
    e.preventDefault() // voorkom default reload
    setFirebaseError(null) // reset eventuele vorige Firebase fout

    // valideer alle velden
    const newErrors = {
      naam: validate.naam(fields.naam), // valideer naam
      email: validate.email(fields.email), // valideer email
      password: validate.password(fields.password), // valideer password
    }
    setErrors(newErrors) // update errors state
    setTouched({ naam: true, email: true, password: true }) // markeer alles als aangeraakt

    if (Object.values(newErrors).some(Boolean)) return // stop als er fouten zijn

    setSubmitting(true) // zet submitting state aan (disable button / toon loader)

    try {
      // probeer gebruiker te registreren via auth context
      await registreer(fields.naam.trim(), fields.email.trim(), fields.password) 
      navigate('/dashboard') // navigeer naar dashboard bij succes
    } catch (err) { // bij fout
      if (err.code === 'auth/email-already-in-use') { // specifiek foutcode
        setFirebaseError('Dit e-mailadres is al in gebruik.') // toon foutmelding
      } else {
        setFirebaseError('Er ging iets mis. Probeer het opnieuw.') // algemene foutmelding
      }
    } finally {
      setSubmitting(false) // reset submitting status
    }
  }

  // JSX
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-10 relative overflow-x-hidden">
      {/* Achtergrond decoratieve cirkels */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-0 w-[500px] h-[400px] bg-lime-400 opacity-[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-lime-400 opacity-[0.03] rounded-full blur-3xl" />
      </div>

      {/* Container voor inhoud */}
      <div className="relative z-10 w-full max-w-md animate-[fadeUp_0.45s_ease_both]">

        {/* Logo / merk */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 bg-lime-400 rounded-xl flex items-center justify-center text-zinc-950 shrink-0">
            <FootstepsIcon /> {/* icoon */}
          </div>
          <span className="font-black text-3xl tracking-widest text-zinc-100 uppercase">
            Stap<span className="text-lime-400">ril</span> {/* merknaam */}
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

        {/* Kaart met formulier */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7">

          {/* Firebase foutmelding */}
          {firebaseError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-5">
              <AlertIcon />
              <span>{firebaseError}</span>
            </div>
          )}

          {/* Formulier */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Naam veld */}
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

            {/* Email veld */}
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

            {/* Wachtwoord veld */}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting} // disable button tijdens submit
              className="w-full mt-1 bg-lime-400 hover:bg-lime-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-black text-sm uppercase tracking-widest rounded-xl py-3.5 flex items-center justify-center transition-all duration-150 min-h-[48px]"
            >
              {submitting ? ( // toon loader als submitting
                <span className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Registreren →'
              )}
            </button>
          </form>

          {/* Link naar login pagina */}
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

      {/* Animatie voor fade up */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// Component voor individuele input velden
function Field({ label, id, type, value, placeholder, error, icon, onChange, onBlur }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1.5">
        {label} {/* veldlabel */}
      </label>
      <div className={`relative flex items-center rounded-xl border bg-zinc-950 transition-all ${
        error
          ? 'border-red-500 ring-2 ring-red-500/20' // rode rand bij fout
          : 'border-zinc-800 focus-within:border-lime-400 focus-within:ring-2 focus-within:ring-lime-400/20'
      }`}>
        <span className="absolute left-3.5 text-zinc-600 pointer-events-none">{icon}</span> {/* icoon */}
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
      {error && ( // toon foutmelding
        <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400">
          <AlertIcon /> {error}
        </p>
      )}
    </div>
  )
}