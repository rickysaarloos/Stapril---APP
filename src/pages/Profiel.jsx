/**
 * Profielpagina voor gebruikersstatistieken en badges.
 * @returns {JSX.Element}
 */
<<<<<<< Updated upstream
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore'
=======
import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { doc, getDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
>>>>>>> Stashed changes
import { db } from '../firebase'
import { useStepTracker } from '../hooks/useStepTracker'
import { useBadges, ALLE_BADGES } from '../hooks/useBadges'
import { useStats } from '../hooks/useStepStats' // ✅ NIEUW: gebruik dezelfde hook als Dashboard
 
const BADGE_DEF = ALLE_BADGES.map(b => ({
  id: b.id,
  icon: b.icoon,
  name: b.naam,
  desc: b.beschrijving,
}))
 
const MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1_000_000]
 
const STATUS_LABELS = {
  idle:        null,
  requesting:  'Toestemming vragen...',
  tracking:    'Live aan het tellen',
  unsupported: 'Niet ondersteund op dit apparaat',
  denied:      'Toestemming geweigerd',
}
 
const DEFAULT_DAGDOEL = 10000

// 👇 NIEUW: Firebase Storage instance
const storage = getStorage()
 
// ── Helper functies voor mijlpalen ─────────────────────────────
function getNextMilestone(steps) {
  return MILESTONES.find(m => m > steps) ?? MILESTONES.at(-1)
}

function getPrevMilestone(steps) {
  const idx = MILESTONES.findIndex(m => m > steps)
  return idx <= 0 ? 0 : MILESTONES[idx - 1]
}

function fmt(n) {
  return n?.toLocaleString('nl-NL') ?? '0'
}

function calculateMilestoneProgress(steps) {
  const next = getNextMilestone(steps)
  const prev = getPrevMilestone(steps)
  if (next === prev) return steps >= next ? 100 : 0
  return Math.min(100, Math.max(0, Math.round(((steps - prev) / (next - prev)) * 100)))
}

// ── Helper: update totalSteps in Firestore ─────────────────────
export async function voegStappenToeAanTotaal(uid, aantal) {
  if (!uid || !aantal || aantal <= 0) return
  try {
    await updateDoc(doc(db, 'users', uid), {
      totalSteps: increment(aantal),
      lastStepUpdate: new Date().toISOString()
    })
  } catch (err) {
    console.error('Fout bij updaten totalSteps:', err)
  }
}

// 👇 NIEUW: Helper - afbeelding comprimeren naar max 512x512
async function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    img.onload = () => {
      let { width, height } = img
      const MAX_SIZE = 512
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height
          height = MAX_SIZE
        }
      }
      
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
        'image/jpeg',
        0.8
      )
    }
    img.src = URL.createObjectURL(file)
  })
}

// 👇 NIEUW: Helper - profielfoto uploaden naar Firebase Storage
export async function uploadProfielfoto(uid, file) {
  if (!uid || !file) return null
  
  // Validatie
  if (!file.type.startsWith('image/')) {
    throw new Error('Alleen afbeeldingen zijn toegestaan')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Afbeelding mag maximaal 5MB zijn')
  }
  
  try {
    // Comprimeer afbeelding
    const compressed = await compressImage(file)
    
    // Upload naar Firebase Storage
    const storageRef = ref(storage, `profile-photos/${uid}.jpg`)
    await uploadBytes(storageRef, compressed)
    
    // Haal download URL op
    return await getDownloadURL(storageRef)
  } catch (err) {
    console.error('Fout bij uploaden profielfoto:', err)
    throw err
  }
}

// 👇 NIEUW: Helper - profielfoto verwijderen
export async function verwijderProfielfoto(uid, currentPhotoUrl) {
  if (!uid || !currentPhotoUrl) return
  
  try {
    // Verwijder uit Storage
    const storageRef = ref(storage, `profile-photos/${uid}.jpg`)
    await deleteObject(storageRef)
    
    // Verwijder URL uit Firestore
    await updateDoc(doc(db, 'users', uid), { profielFoto: null })
  } catch (err) {
    console.error('Fout bij verwijderen profielfoto:', err)
    throw err
  }
}
 
// ── Modals ─────────────────────────────────────────────────────
function BewerkModal({ huidigeNaam, onOpslaan, onSluiten, laden }) {
  const [naam, setNaam] = useState(huidigeNaam)
  const [fout, setFout] = useState('')
 
  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = naam.trim()
    if (!trimmed) { setFout('Naam mag niet leeg zijn.'); return }
    if (trimmed.length < 2) { setFout('Naam moet minstens 2 tekens zijn.'); return }
    setFout('')
    await onOpslaan(trimmed)
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSluiten} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Profiel bewerken</h3>
          <button onClick={onSluiten} className="text-white/30 hover:text-white transition-colors text-xl leading-none">x</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Gebruikersnaam</label>
            <input
              type="text"
              value={naam}
              onChange={e => { setNaam(e.target.value); setFout('') }}
              className="w-full bg-white/5 border border-white/10 focus:border-[#84cc16]/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              placeholder="Jouw naam"
              autoFocus
            />
            {fout && <p className="text-red-400 text-xs">{fout}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onSluiten} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all">
              Annuleren
            </button>
            <button type="submit" disabled={laden} className="flex-1 py-2.5 bg-[#84cc16] hover:bg-[#95d926] disabled:opacity-50 text-[#0a0a0a] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
              {laden && <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />}
              {laden ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
 
function VerwijderModal({ onBevestigen, onSluiten, laden }) {
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState('')
 
  async function handleSubmit(e) {
    e.preventDefault()
    if (!wachtwoord) { setFout('Vul je wachtwoord in.'); return }
    setFout('')
    try {
      await onBevestigen(wachtwoord)
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setFout('Wachtwoord is onjuist.')
      } else {
        setFout('Er ging iets mis. Probeer het opnieuw.')
      }
    }
  }
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onSluiten} />
      <div className="relative w-full max-w-sm bg-[#111] border border-red-500/20 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Account verwijderen</h3>
          <button onClick={onSluiten} className="text-white/30 hover:text-white transition-colors text-xl leading-none">x</button>
        </div>
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl px-4 py-3 space-y-1">
          <p className="text-red-400 text-sm font-semibold">Dit kan niet ongedaan gemaakt worden</p>
          <p className="text-white/40 text-xs">Je stappen, badges en teamlidmaatschap worden permanent verwijderd.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Bevestig met wachtwoord</label>
            <input
              type="password"
              value={wachtwoord}
              onChange={e => { setWachtwoord(e.target.value); setFout('') }}
              className="w-full bg-white/5 border border-white/10 focus:border-red-500/60 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none transition-colors"
              placeholder="Jouw wachtwoord"
              autoFocus
            />
            {fout && <p className="text-red-400 text-xs">{fout}</p>}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onSluiten} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all">
              Annuleren
            </button>
            <button type="submit" disabled={laden} className="flex-1 py-2.5 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2">
              {laden && <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />}
              {laden ? 'Verwijderen...' : 'Verwijderen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 👇 NIEUW: Modal voor profielfoto wijzigen
function FotoModal({ huidigeFoto, uid, onOpslaan, onSluiten, laden, fout: uploadFout }) {
  const fileInputRef = useRef(null)
  const [preview, setPreview] = useState(huidigeFoto)
  const [selectedFile, setSelectedFile] = useState(null)
  const [localFout, setLocalFout] = useState('')
 
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validatie
    if (!file.type.startsWith('image/')) {
      setLocalFout('Alleen afbeeldingen zijn toegestaan')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setLocalFout('Afbeelding mag maximaal 5MB zijn')
      return
    }
    
    setLocalFout('')
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }
 
  async function handleSubmit() {
    if (!selectedFile) return
    try {
      await onOpslaan(selectedFile)
      onSluiten()
    } catch (err) {
      // Fout wordt door parent afgehandeld
    }
  }
 
  function handleRemove() {
    setPreview(null)
    setSelectedFile(null)
    setLocalFout('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
 
  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onSluiten} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-black text-lg">Profielfoto wijzigen</h3>
          <button onClick={onSluiten} className="text-white/30 hover:text-white transition-colors text-xl leading-none">x</button>
        </div>
        
        {/* Preview */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#84cc16] font-black text-2xl">
                {(uid || 'U').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/70 hover:text-white text-xs font-medium rounded-xl transition-all"
            >
              Kies afbeelding
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl transition-all"
              >
                Wissen
              </button>
            )}
          </div>
          
          {(localFout || uploadFout) && (
            <p className="text-red-400 text-xs text-center">{localFout || uploadFout}</p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onSluiten} className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all">
            Annuleren
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={laden || !selectedFile}
            className="flex-1 py-2.5 bg-[#84cc16] hover:bg-[#95d926] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {laden && <span className="w-3.5 h-3.5 border-2 border-black/20 border-t-black/70 rounded-full animate-spin" />}
            {laden ? 'Uploaden...' : 'Opslaan'}
          </button>
        </div>
      </div>
    </div>
  )
}
 
function BadgeRow({ badge, unlocked }) {
  return (
    <div className={`flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border transition-colors ${unlocked ? 'bg-[#84cc16]/[0.04] border-[#84cc16]/25' : 'bg-white/[0.02] border-white/[0.07] opacity-50'}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${unlocked ? 'bg-[#84cc16]/10' : 'bg-white/5'}`}>
        {badge.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold truncate">{badge.name}</p>
        <p className="text-white/35 text-xs mt-0.5 truncate">{badge.desc}</p>
      </div>
      <div className="flex-shrink-0">
        {unlocked ? (
          <div className="w-5 h-5 rounded-full bg-[#84cc16] flex items-center justify-center">
            <svg className="w-2.5 h-2.5" viewBox="0 0 10 8" fill="none" stroke="#0a0a0a" strokeWidth="2.5"><polyline points="1,4 4,7 9,1" /></svg>
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center">
            <svg className="w-2.5 h-2.5" viewBox="0 0 9 11" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
              <rect x="1.5" y="4.5" width="6" height="5.5" rx="1" /><path d="M3 4.5V3a1.5 1.5 0 013 0v1.5" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
 
// ── LiveStappenCard Component ──────────────────────────────────
function LiveStappenCard({ uid, dagdoel, onStappenCommit }) {
  const { stappen, status, startTracking, stopTracking, resetStappen } = useStepTracker(uid)
  const isTracking = status === 'tracking'
  const isError = status === 'unsupported' || status === 'denied'
 
  const pct = dagdoel > 0 ? Math.min(Math.round((stappen / dagdoel) * 100), 100) : 0
 
  const handleStopTracking = useCallback(() => {
    if (stappen > 0 && onStappenCommit) {
      onStappenCommit(stappen)
    }
    stopTracking()
  }, [stappen, onStappenCommit, stopTracking])
 
  return (
    <div className="relative mt-5 p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
      {isTracking && <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#84cc16]/15 rounded-full blur-2xl pointer-events-none animate-pulse" />}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/35 text-[10px] uppercase tracking-widest font-medium">Stappen vandaag</p>
          <p className="text-white font-black text-4xl tracking-tighter leading-none mt-1">{fmt(stappen)}</p>
          {STATUS_LABELS[status] && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {isTracking && <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-pulse" />}
              <span className={`text-xs ${isError ? 'text-red-400' : 'text-white/35'}`}>{STATUS_LABELS[status]}</span>
            </div>
          )}
        </div>
        {!isError && (
          <button
            onClick={isTracking ? handleStopTracking : startTracking}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${isTracking ? 'bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20' : 'bg-[#84cc16]/10 border border-[#84cc16]/25 text-[#84cc16] hover:bg-[#84cc16]/20'}`}
          >
            {isTracking ? <><span className="w-2 h-2 rounded-sm bg-red-400" />Opslaan</> : <><span className="w-2 h-2 rounded-full bg-[#84cc16]" />Start</>}
          </button>
        )}
      </div>
      <div>
        <div className="flex justify-between text-xs text-white/30 mb-2">
          <span>Dagdoel</span>
          <span className="text-white/50">{pct}% van {fmt(dagdoel)}</span>
        </div>
        <div className="h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
          <div className="h-full bg-[#84cc16] rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
      {isError && (
        <p className="mt-3 text-xs text-red-400/70 bg-red-500/5 border border-red-500/15 rounded-xl px-3 py-2">
          {status === 'unsupported' ? 'Je apparaat ondersteunt geen bewegingssensor via de browser.' : 'Geef toestemming voor de bewegingssensor in je browserinstellingen.'}
        </p>
      )}
    </div>
  )
}
 
// ── MAIN COMPONENT ─────────────────────────────────────────────
export default function Profiel() {
  const { user, updateNaam, verwijderAccount } = useAuthContext()
  const navigate = useNavigate()
 
<<<<<<< Updated upstream
  // ✅ Gebruik useStats hook (zelfde als Dashboard) voor consistente data
  const { totaalStappen, dagdoel: statsDagdoel, laden: statsLaden } = useStats(user?.uid)
=======
  const [totalSteps, setTotalSteps] = useState(0)
  const [teamNaam, setTeamNaam] = useState('')
  const [dagdoel, setDagdoel] = useState(DEFAULT_DAGDOEL)
  const [profielFoto, setProfielFoto] = useState(null) // 👇 NIEUW
  const [laden, setLaden] = useState(true)
>>>>>>> Stashed changes
  const { verdiendeBadges, loading: badgesLaden } = useBadges(user?.uid)
 
  // Lokale state voor UI interacties
  const [teamNaam, setTeamNaam] = useState('')
  const [dagdoel, setDagdoel] = useState(DEFAULT_DAGDOEL)
  const [bewerkOpen, setBewerkOpen] = useState(false)
  const [verwijderOpen, setVerwijderOpen] = useState(false)
  const [fotoOpen, setFotoOpen] = useState(false) // 👇 NIEUW
  const [bewerkLaden, setBewerkLaden] = useState(false)
  const [verwijderLaden, setVerwijderLaden] = useState(false)
  const [fotoLaden, setFotoLaden] = useState(false) // 👇 NIEUW
  const [fotoFout, setFotoFout] = useState('') // 👇 NIEUW
 
  // ── Sync dagdoel vanuit useStats ─────────────────────────────
  useEffect(() => {
    if (statsDagdoel) {
      setDagdoel(statsDagdoel)
    }
  }, [statsDagdoel])
 
  // ── Laad teamnaam eenmalig ───────────────────────────────────
  useEffect(() => {
    if (!user?.teamId || teamNaam) return
    const loadTeam = async () => {
      try {
<<<<<<< Updated upstream
        const teamSnap = await getDoc(doc(db, 'teams', user.teamId))
        if (teamSnap.exists()) {
          setTeamNaam(teamSnap.data().naam ?? '')
=======
        const data = snap.data() ?? {}
        
        // Robuuste fallback voor totalSteps
        const steps = data.totalSteps
        setTotalSteps(typeof steps === 'number' ? steps : 0)
        
        setDagdoel(data.dagdoel ?? DEFAULT_DAGDOEL)
        setProfielFoto(data.profielFoto ?? null) // 👇 NIEUW
        
        if (data.teamId && !teamNaam) {
          try {
            const teamSnap = await getDoc(doc(db, 'teams', data.teamId))
            setTeamNaam(teamSnap.data()?.naam ?? '')
          } catch (e) {
            console.warn('Kon teamnaam niet laden:', e)
          }
>>>>>>> Stashed changes
        }
      } catch (e) {
        console.warn('Kon teamnaam niet laden:', e)
      }
    }
    loadTeam()
  }, [user?.teamId, teamNaam])
 
  // ── Commit steps to total (live tracker) ─────────────────────
  const handleStappenCommit = useCallback(async (aantal) => {
    if (!user?.uid || !aantal || aantal <= 0) return
    try {
      await voegStappenToeAanTotaal(user.uid, aantal)
      // useStats luistert automatisch via onSnapshot → auto-update
    } catch (err) {
      console.error('Fout bij committen stappen:', err)
    }
  }, [user?.uid])

  // 👇 NIEUW: Profielfoto uploaden
  async function handleFotoUpload(file) {
    if (!user?.uid) return
    setFotoLaden(true)
    setFotoFout('')
    try {
      const url = await uploadProfielfoto(user.uid, file)
      await updateDoc(doc(db, 'users', user.uid), { profielFoto: url })
      setProfielFoto(url)
    } catch (err) {
      setFotoFout(err.message || 'Upload mislukt')
      throw err
    } finally {
      setFotoLaden(false)
    }
  }

  // 👇 NIEUW: Profielfoto verwijderen
  async function handleFotoVerwijderen() {
    if (!user?.uid || !profielFoto) return
    setFotoLaden(true)
    setFotoFout('')
    try {
      await verwijderProfielfoto(user.uid, profielFoto)
      setProfielFoto(null)
    } catch (err) {
      setFotoFout(err.message || 'Verwijderen mislukt')
      throw err
    } finally {
      setFotoLaden(false)
    }
  }
 
  // ── Handlers ─────────────────────────────────────────────────
  async function handleNaamOpslaan(nieuweNaam) {
    setBewerkLaden(true)
    try {
      await updateNaam(nieuweNaam)
      setBewerkOpen(false)
    } catch {
    } finally {
      setBewerkLaden(false)
    }
  }
 
  async function handleVerwijderen(wachtwoord) {
    setVerwijderLaden(true)
    try {
      await verwijderAccount(wachtwoord)
      navigate('/login')
    } finally {
      setVerwijderLaden(false)
    }
  }
 
  // ── Calculations ─────────────────────────────────────────────
  const nextMilestone = getNextMilestone(totaalStappen)
  const milestonePct = calculateMilestoneProgress(totaalStappen)
  const earnedCount = BADGE_DEF.filter(b => verdiendeBadges[b.id]).length
  const initials = (user?.naam ?? user?.email ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
 
  // ── Loading state ────────────────────────────────────────────
  if (statsLaden || badgesLaden) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#84cc16]/30 border-t-[#84cc16] rounded-full animate-spin" />
      </div>
    )
  }
 
  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {bewerkOpen && <BewerkModal huidigeNaam={user?.naam ?? ''} onOpslaan={handleNaamOpslaan} onSluiten={() => setBewerkOpen(false)} laden={bewerkLaden} />}
      {verwijderOpen && <VerwijderModal onBevestigen={handleVerwijderen} onSluiten={() => setVerwijderOpen(false)} laden={verwijderLaden} />}
      {fotoOpen && <FotoModal huidigeFoto={profielFoto} uid={user?.uid} onOpslaan={handleFotoUpload} onSluiten={() => setFotoOpen(false)} laden={fotoLaden} fout={fotoFout} />} {/* 👇 NIEUW */}
 
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#84cc16]/[0.04] rounded-full blur-3xl" />
      </div>
 
      <div className="relative max-w-sm mx-auto px-5 pb-12">
 
        {/* Header */}
        <div className="flex items-center gap-4 pt-6 pb-5 border-b border-white/[0.08]">
          {/* 👇 NIEUW: Avatar met foto of initialen + edit knop */}
          <div className="relative group">
            <div className="w-14 h-14 rounded-2xl bg-[#84cc16]/10 border border-[#84cc16]/25 flex items-center justify-center overflow-hidden flex-shrink-0">
              {profielFoto ? (
                <img src={profielFoto} alt={user?.naam} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#84cc16] font-black text-lg">{initials}</span>
              )}
            </div>
            <button
              onClick={() => setFotoOpen(true)}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl text-white/90 text-xs font-medium"
              aria-label="Wijzig profielfoto"
            >
              {fotoLaden ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '✎'
              )}
            </button>
            {profielFoto && (
              <button
                onClick={(e) => { e.stopPropagation(); handleFotoVerwijderen() }}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0a0a0a] flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="Verwijder profielfoto"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-xl tracking-tight truncate">{user?.naam ?? user?.email}</p>
            {teamNaam && (
              <div className="inline-flex items-center gap-1.5 mt-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-0.5">
                <span className="text-[#84cc16] text-[10px]">Team</span>
                <span className="text-white/40 text-xs">{teamNaam}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setBewerkOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-white/40 hover:text-white text-xs font-medium transition-all duration-200"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" />
            </svg>
            Bewerken
          </button>
        </div>
 
        {/* Live stappen — met commit callback */}
        <LiveStappenCard uid={user?.uid} dagdoel={dagdoel} onStappenCommit={handleStappenCommit} />
 
        {/* ✅ Total steps — NU VIA useStats (consistent met Dashboard) */}
        <div className="relative mt-4 p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#84cc16]/10 rounded-full blur-2xl pointer-events-none" />
          <p className="text-white/35 text-[10px] uppercase tracking-widest mb-2 font-medium">Totale stappen aller tijden</p>
          <p className="text-white font-black text-5xl tracking-tighter leading-none">
            {totaalStappen > 0 ? fmt(totaalStappen) : <span className="text-white/20">Nog geen stappen</span>}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16]" />
            <span className="text-white/35 text-xs">stappen geteld</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.07]">
            <div className="flex justify-between text-xs text-white/30 mb-2">
              <span>Volgende mijlpaal</span>
              <span className="text-white/50">{fmt(nextMilestone)}</span>
            </div>
            <div className="h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#84cc16] rounded-full transition-all duration-700 ease-out" 
                style={{ width: `${milestonePct}%` }} 
              />
            </div>
          </div>
        </div>
 
        {/* Huidig dagdoel weergave */}
        <div className="mt-4 px-4 py-3.5 bg-white/[0.02] border border-white/[0.07] rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🎯</span>
            <span className="text-white/50 text-sm">Persoonlijk dagdoel</span>
          </div>
          <span className="text-white/80 text-sm font-bold">{fmt(dagdoel)} stappen</span>
        </div>
 
        {/* Badges */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-white font-black text-base tracking-tight">Badges</h2>
            <span className="text-white/30 text-xs">{earnedCount} / {BADGE_DEF.length} behaald</span>
          </div>
          <div className="space-y-2">
            {BADGE_DEF.map(badge => (
              <BadgeRow key={badge.id} badge={badge} unlocked={!!verdiendeBadges[badge.id]} />
            ))}
          </div>
        </div>
 
        {/* Instellingen */}
        <div className="mt-6 bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.07]">
            <p className="text-white/30 text-[10px] uppercase tracking-widest font-medium">Instellingen</p>
          </div>
          <button onClick={() => setBewerkOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left">
            <span className="text-white/70 text-sm">Naam wijzigen</span>
            <span className="text-white/20 text-xs">-&gt;</span>
          </button>
          <div className="border-t border-white/[0.07]" />
          <button onClick={() => setFotoOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.03] transition-colors text-left">
            <span className="text-white/70 text-sm">Profielfoto wijzigen</span>
            <span className="text-white/20 text-xs">-&gt;</span>
          </button>
          <div className="border-t border-white/[0.07]" />
          <button onClick={() => setVerwijderOpen(true)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-red-500/[0.04] transition-colors text-left">
            <span className="text-red-400/70 text-sm">Account verwijderen</span>
            <span className="text-red-400/20 text-xs">-&gt;</span>
          </button>
        </div>
 
        <button onClick={() => navigate('/dashboard')} className="mt-4 w-full py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white text-sm font-medium rounded-xl transition-all duration-200">
          terug naar dashboard
        </button>
 
      </div>
    </div>
  )
}