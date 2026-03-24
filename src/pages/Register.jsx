import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

function valideerWachtwoord(w) {
  if (w.length < 8) return 'Minimaal 8 tekens'
  if (!/[A-Z]/.test(w)) return 'Minimaal één hoofdletter'
  if (!/[0-9]/.test(w)) return 'Minimaal één cijfer'
  return null
}

function valideerEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? null : 'Ongeldig e-mailadres'
}

export default function Register() {
  const { registreer } = useAuthContext()
  const navigate = useNavigate()

  const [form, setForm] = useState({ naam: '', email: '', wachtwoord: '' })
  const [fouten, setFouten] = useState({})
  const [serverFout, setServerFout] = useState('')
  const [laden, setLaden] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setFouten((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  function valideer() {
    const nieuw = {}
    if (!form.naam.trim()) nieuw.naam = 'Vul je naam in'
    const emailFout = valideerEmail(form.email)
    if (emailFout) nieuw.email = emailFout
    const wachtwoordFout = valideerWachtwoord(form.wachtwoord)
    if (wachtwoordFout) nieuw.wachtwoord = wachtwoordFout
    return nieuw
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const nieuweFouten = valideer()
    if (Object.keys(nieuweFouten).length > 0) {
      setFouten(nieuweFouten)
      return
    }
    setLaden(true)
    setServerFout('')
    try {
      await registreer(form.naam.trim(), form.email.trim(), form.wachtwoord)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setServerFout('Dit e-mailadres is al in gebruik.')
      } else {
        setServerFout('Er ging iets mis. Probeer het opnieuw.')
      }
    } finally {
      setLaden(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="hidden md:flex w-1/2 bg-black text-white flex-col justify-between p-10">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span>⬡</span>
          <span>Stapril</span>
        </div>

        <div>
          <p className="uppercase text-sm text-gray-400">april challenge</p>
          <h1 className="text-5xl font-bold leading-tight mt-2">
            10.000<br />stappen.<br />Elke dag.
          </h1>
        </div>

        <div className="flex items-center gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">30</p>
            <p className="text-sm text-gray-400">dagen</p>
          </div>
          <div className="h-8 w-px bg-gray-600" />
          <div>
            <p className="text-2xl font-bold">5</p>
            <p className="text-sm text-gray-400">badges</p>
          </div>
          <div className="h-8 w-px bg-gray-600" />
          <div>
            <p className="text-2xl font-bold">∞</p>
            <p className="text-sm text-gray-400">teams</p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Account aanmaken</h2>
            <p className="text-sm text-gray-500 mt-1">
              Al een account?{' '}
              <Link to="/login" className="text-black font-medium hover:underline">
                Inloggen
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Naam */}
            <div>
              <label className="block text-sm font-medium mb-1">Naam</label>
              <input
                name="naam"
                type="text"
                value={form.naam}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fouten.naam ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fouten.naam && (
                <p className="text-red-500 text-sm mt-1">{fouten.naam}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">E-mailadres</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fouten.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fouten.email && (
                <p className="text-red-500 text-sm mt-1">{fouten.email}</p>
              )}
            </div>

            {/* Wachtwoord */}
            <div>
              <label className="block text-sm font-medium mb-1">Wachtwoord</label>
              <input
                name="wachtwoord"
                type="password"
                value={form.wachtwoord}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                  fouten.wachtwoord ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fouten.wachtwoord && (
                <p className="text-red-500 text-sm mt-1">{fouten.wachtwoord}</p>
              )}
            </div>

            {/* Server fout */}
            {serverFout && (
              <div className="text-red-600 text-sm">{serverFout}</div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={laden}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
            >
              {laden ? 'Account aanmaken...' : 'Registreren'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}