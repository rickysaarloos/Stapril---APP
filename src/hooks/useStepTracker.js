import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
 
const THRESHOLD = 12        // Minimale versnellingskracht voor een stap (m/s²)
const COOLDOWN_MS = 400     // Minimale tijd tussen twee stappen (voorkomt dubbele counts)
const DAGDOEL = 10000
 
/**
 * Hook die via DeviceMotion stappen detecteert en opslaat in Firestore.
 * Stappen worden gesynchroniseerd naar users/{uid} als `stappenVandaag` en `totalSteps`.
 *
 * @param {string|null} uid Firebase gebruikers-uid
 * @returns {{
 *   stappen: number,
 *   status: 'idle'|'requesting'|'tracking'|'unsupported'|'denied',
 *   startTracking: function,
 *   stopTracking: function,
 *   pct: number,
 * }}
 */
export function useStepTracker(uid) {
  const [stappen, setStappen] = useState(0)
  const [status, setStatus] = useState('idle') // idle | requesting | tracking | unsupported | denied
 
  const lastStapRef = useRef(0)       // timestamp van laatste stap
  const lastValRef = useRef([])       // rolling window van magnitudes
  const listenerRef = useRef(null)    // opgeslagen event listener referentie
  const vandaagRef = useRef(getTodayKey())
  const pendingRef = useRef(0)        // stappen nog niet naar Firestore geschreven
  const syncTimerRef = useRef(null)   // debounce timer voor Firestore writes
 
  // Laad vandaag's stappen uit Firestore bij mount
  useEffect(() => {
    if (!uid) return
    async function laadVandaag() {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        const data = snap.data() ?? {}
        const key = getTodayKey()
        // Als er al stappen zijn opgeslagen voor vandaag, begin daar
        const saved = data.stappenPerDag?.[key] ?? 0
        setStappen(saved)
      } catch (e) {
        console.error('Fout bij laden stappen:', e)
      }
    }
    laadVandaag()
  }, [uid])
 
  // Stuur pending stappen naar Firestore (gedebounced, max 1x per 3 sec)
  const syncNaarFirestore = useCallback((aantalNieuw) => {
    if (!uid || aantalNieuw <= 0) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      const toWrite = pendingRef.current
      if (toWrite <= 0) return
      pendingRef.current = 0
      const key = vandaagRef.current
      try {
        await updateDoc(doc(db, 'users', uid), {
          [`stappenPerDag.${key}`]: increment(toWrite),
          totalSteps: increment(toWrite),
        })
      } catch (e) {
        console.error('Fout bij opslaan stappen:', e)
        // Zet pending terug als write faalt
        pendingRef.current += toWrite
      }
    }, 3000)
  }, [uid])
 
  // Stap-detectie via versnellingsmeter
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity
    if (!acc) return
 
    const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2)
 
    // Rolling window van 4 waarden voor smoothing
    lastValRef.current.push(mag)
    if (lastValRef.current.length > 4) lastValRef.current.shift()
 
    const gemiddeld = lastValRef.current.reduce((a, b) => a + b, 0) / lastValRef.current.length
    const nu = Date.now()
 
    // Piek-detectie: magnitude boven drempel én cooldown voorbij
    if (gemiddeld > THRESHOLD && nu - lastStapRef.current > COOLDOWN_MS) {
      lastStapRef.current = nu
      setStappen(prev => {
        const nieuw = prev + 1
        pendingRef.current += 1
        syncNaarFirestore(pendingRef.current)
        return nieuw
      })
    }
  }, [syncNaarFirestore])
 
  const startTracking = useCallback(async () => {
    if (!window.DeviceMotionEvent) {
      setStatus('unsupported')
      return
    }
 
    // iOS vereist expliciete toestemming
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      setStatus('requesting')
      try {
        const result = await DeviceMotionEvent.requestPermission()
        if (result !== 'granted') {
          setStatus('denied')
          return
        }
      } catch {
        setStatus('denied')
        return
      }
    }
 
    listenerRef.current = handleMotion
    window.addEventListener('devicemotion', listenerRef.current)
    setStatus('tracking')
  }, [handleMotion])
 
  const stopTracking = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current)
      listenerRef.current = null
    }
    // Schrijf resterende pending stappen direct weg
    clearTimeout(syncTimerRef.current)
    if (uid && pendingRef.current > 0) {
      const toWrite = pendingRef.current
      pendingRef.current = 0
      const key = vandaagRef.current
      updateDoc(doc(db, 'users', uid), {
        [`stappenPerDag.${key}`]: increment(toWrite),
        totalSteps: increment(toWrite),
      }).catch(console.error)
    }
    setStatus('idle')
  }, [uid])
 
  // Cleanup bij unmount
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('devicemotion', listenerRef.current)
      }
      clearTimeout(syncTimerRef.current)
    }
  }, [])
 
  const pct = Math.min(Math.round((stappen / DAGDOEL) * 100), 100)
 
  return { stappen, status, startTracking, stopTracking, pct }
}

/**
 * Geeft de datum-sleutel van vandaag als string (bijv. "2026-04-07").
 * @returns {string}
 */
function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}