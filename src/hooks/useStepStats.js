import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

// Berekent statistieken op basis van een object { 'YYYY-MM-DD': stappen }
export function calculateStats(stepsMap) {
  const GOAL = 10000

  // Totaal aantal stappen
  const totalSteps = Object.values(stepsMap).reduce((sum, s) => sum + s, 0)

  // Aantal dagen dat het doel gehaald is
  const goalDays = Object.values(stepsMap).filter((s) => s >= GOAL).length

  // Streak berekenen — opeenvolgende dagen MET 10.000+ stappen tot en met vandaag
  // We lopen terug van vandaag en stoppen zodra een dag het doel niet haalt
  const today = new Date()
  let streak = 0
  let current = new Date(today)

  while (true) {
    const key = formatDate(current)
    const steps = stepsMap[key] ?? 0

    if (steps >= GOAL) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      // Geef één dag speling — als vandaag nog niet ingevoerd is,
      // kijk dan of gisteren een streak had
      if (formatDate(current) === formatDate(today) && streak === 0) {
        current.setDate(current.getDate() - 1)
        continue
      }
      break
    }
  }

  return { totalSteps, goalDays, streak }
}

// Formatteert een Date naar 'YYYY-MM-DD'
export function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// Hook — luistert realtime naar stappen van de ingelogde gebruiker
export function useStepStats(uid) {
  const [stepsMap, setStepsMap] = useState({})
  const [stats, setStats] = useState({ totalSteps: 0, goalDays: 0, streak: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) return

    // onSnapshot = realtime listener — update automatisch na stappen invoeren (#46 eis)
    const ref = collection(db, 'users', uid, 'steps')
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const map = {}
      snapshot.forEach((doc) => {
        // doc.id = datum 'YYYY-MM-DD', doc.data().steps = aantal stappen
        map[doc.id] = doc.data().steps ?? 0
      })
      setStepsMap(map)
      setStats(calculateStats(map))
      setLoading(false)
    })

    // Cleanup — stop de listener als de component unmount
    return () => unsubscribe()
  }, [uid])

  return { stepsMap, stats, loading }
}