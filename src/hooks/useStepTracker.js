import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { vandaagISO, stappenDocId } from '../utils/datum'

const THRESHOLD = 12
const COOLDOWN_MS = 400
const DAGDOEL = 10000

export function useStepTracker(uid) {
  const [stappen, setStappen] = useState(0)
  const [status, setStatus] = useState('idle')

  const lastStapRef = useRef(0)
  const lastValRef = useRef([])
  const listenerRef = useRef(null)
  const pendingRef = useRef(0)
  const syncTimerRef = useRef(null)

  // Laad vandaag's stappen uit stappen collectie bij mount
  useEffect(() => {
    if (!uid) return
    async function laadVandaag() {
      try {
        const id = stappenDocId(uid)
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

  // Schrijf naar BEIDE collecties
  const syncNaarFirestore = useCallback((aantalNieuw) => {
    if (!uid || aantalNieuw <= 0) return
    clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(async () => {
      const toWrite = pendingRef.current
      if (toWrite <= 0) return
      pendingRef.current = 0

      const datum = vandaagISO()
      const id = stappenDocId(uid, datum)

      try {
        // Lees huidige waarde uit stappen collectie
        const snap = await getDoc(doc(db, 'stappen', id))
        const huidig = snap.exists() ? (snap.data().stappen ?? 0) : 0
        const nieuwTotaal = huidig + toWrite

        // Schrijf naar stappen collectie
        await setDoc(doc(db, 'stappen', id), {
          uid,
          datum,
          stappen: nieuwTotaal,
          bijgewerktOp: new Date().toISOString(),
        })

        // Schrijf ook naar users/totalSteps
        await updateDoc(doc(db, 'users', uid), {
          totalSteps: increment(toWrite),
        })
      } catch (e) {
        console.error('Fout bij opslaan stappen:', e)
        pendingRef.current += toWrite
      }
    }, 3000)
  }, [uid])

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

  const stopTracking = useCallback(async () => {
    if (listenerRef.current) {
      window.removeEventListener('devicemotion', listenerRef.current)
      listenerRef.current = null
    }

    clearTimeout(syncTimerRef.current)

    if (uid && pendingRef.current > 0) {
      const toWrite = pendingRef.current
      pendingRef.current = 0

      const datum = vandaagISO()
      const id = stappenDocId(uid, datum)

      try {
        const snap = await getDoc(doc(db, 'stappen', id))
        const huidig = snap.exists() ? (snap.data().stappen ?? 0) : 0
        const nieuwTotaal = huidig + toWrite

        await setDoc(doc(db, 'stappen', id), {
          uid,
          datum,
          stappen: nieuwTotaal,
          bijgewerktOp: new Date().toISOString(),
        })

        await updateDoc(doc(db, 'users', uid), {
          totalSteps: increment(toWrite),
        })
      } catch (e) {
        console.error('Fout bij finaal opslaan:', e)
      }
    }

    setStatus('idle')
  }, [uid])

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