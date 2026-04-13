// src/context/StepTrackerContext.jsx
import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { vandaagISO, stappenDocId } from '../utils/datum'

const StepTrackerContext = createContext(null)

const THRESHOLD = 12
const COOLDOWN_MS = 400

export function StepTrackerProvider({ children, uid }) {
  const [stappen, setStappen] = useState(0)
  const [status, setStatus] = useState('idle') // idle | requesting | tracking | unsupported | denied

  const lastStapRef = useRef(0)
  const lastValRef = useRef([])
  const listenerRef = useRef(null)
  const pendingRef = useRef(0)
  const syncTimerRef = useRef(null)
  const uidRef = useRef(uid)

  // Update uid ref zonder re-trigger van effects
  useEffect(() => {
    uidRef.current = uid
  }, [uid])

  // Laad vandaag's stappen bij mount of uid change
  useEffect(() => {
    if (!uidRef.current) return
    async function laadVandaag() {
      try {
        const id = stappenDocId(uidRef.current)
        const snap = await getDoc(doc(db, 'stappen', id))
        if (snap.exists()) {
          setStappen(snap.data().stappen ?? 0)
        }
      } catch (e) {
        console.error('Fout bij laden stappen:', e)
      }
    }
    laadVandaag()
  }, [uid])

  // Sync naar Firestore (debounced)
  const syncNaarFirestore = useCallback((aantalNieuw) => {
    const currentUid = uidRef.current
    if (!currentUid || aantalNieuw <= 0) return
    
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      const toWrite = pendingRef.current
      if (toWrite <= 0) return
      pendingRef.current = 0

      const datum = vandaagISO()
      const id = stappenDocId(currentUid, datum)

      try {
        const snap = await getDoc(doc(db, 'stappen', id))
        const huidig = snap.exists() ? (snap.data().stappen ?? 0) : 0
        const nieuwTotaal = huidig + toWrite

        await setDoc(doc(db, 'stappen', id), {
          uid: currentUid,
          datum,
          stappen: nieuwTotaal,
          bijgewerktOp: new Date().toISOString(),
        })

        await updateDoc(doc(db, 'users', currentUid), {
          totalSteps: increment(toWrite),
        })
      } catch (e) {
        console.error('Fout bij opslaan stappen:', e)
        pendingRef.current += toWrite
      }
    }, 3000)
  }, [])

  // Motion handler
  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity
    if (!acc) return

    const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2)
    lastValRef.current.push(mag)
    if (lastValRef.current.length > 4) lastValRef.current.shift()

    const gemiddeld = lastValRef.current.reduce((a, b) => a + b, 0) / lastValRef.current.length
    const nu = Date.now()

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

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!window.DeviceMotionEvent) {
      setStatus('unsupported')
      return
    }

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

  // Stop tracking (met finale sync)
  const stopTracking = useCallback(async () => {
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current)
      listenerRef.current = null
    }

    clearTimeout(syncTimerRef.current)

    // Finale sync van pending steps
    if (uidRef.current && pendingRef.current > 0) {
      const toWrite = pendingRef.current
      pendingRef.current = 0
      const datum = vandaagISO()
      const id = stappenDocId(uidRef.current, datum)

      try {
        const snap = await getDoc(doc(db, 'stappen', id))
        const huidig = snap.exists() ? (snap.data().stappen ?? 0) : 0
        const nieuwTotaal = huidig + toWrite

        await setDoc(doc(db, 'stappen', id), {
          uid: uidRef.current,
          datum,
          stappen: nieuwTotaal,
          bijgewerktOp: new Date().toISOString(),
        })

        await updateDoc(doc(db, 'users', uidRef.current), {
          totalSteps: increment(toWrite),
        })
      } catch (e) {
        console.error('Fout bij finaal opslaan:', e)
      }
    }

    setStatus('idle')
  }, [])

  // Reset teller (optioneel, bijv. na opslaan)
  const resetStappen = useCallback(() => {
    setStappen(0)
    pendingRef.current = 0
  }, [])

  // Cleanup bij unmount van provider (alleen bij logout)
  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        window.removeEventListener('devicemotion', listenerRef.current)
      }
      clearTimeout(syncTimerRef.current)
    }
  }, [])

  const pct = Math.min(Math.round((stappen / 10000) * 100), 100)

  const value = {
    stappen,
    status,
    startTracking,
    stopTracking,
    resetStappen,
    pct,
    isTracking: status === 'tracking',
  }

  return (
    <StepTrackerContext.Provider value={value}>
      {children}
    </StepTrackerContext.Provider>
  )
}

export function useStepTrackerContext() {
  const ctx = useContext(StepTrackerContext)
  if (!ctx) {
    throw new Error('useStepTrackerContext must be used within StepTrackerProvider')
  }
  return ctx
}