import { useState, useEffect } from 'react'
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
 
/**
 * Hook die individueel lopersklassement realtime bijhoudt.
 * Groepeert stappen per uid en haalt namen op uit users collectie.
 * @returns {{lopers:Array, laden:boolean}}
 */
export function useLopers() {
  const [lopers, setLopers] = useState([])
  const [laden, setLaden] = useState(true)
 
  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'stappen')), async (snap) => {
      try {
        // Groepeer stappen per uid
        const perUid = {}
        snap.docs.forEach(d => {
          const { uid, stappen, datum } = d.data()
          if (!uid) return
          if (!perUid[uid]) perUid[uid] = { totaal: 0, dagen: new Set() }
          perUid[uid].totaal += stappen ?? 0
          perUid[uid].dagen.add(datum)
        })
 
        // Haal namen op uit users collectie
        const usersSnap = await getDocs(collection(db, 'users'))
        const namen = {}
        usersSnap.forEach(d => {
          namen[d.id] = d.data().naam ?? d.data().email ?? 'Onbekend'
        })
 
        const lijst = Object.entries(perUid).map(([uid, data]) => ({
          uid,
          naam: namen[uid] ?? 'Onbekend',
          totaalStappen: data.totaal,
          aantalDagen: data.dagen.size,
          gemiddeldPerDag: data.dagen.size > 0
            ? Math.round(data.totaal / data.dagen.size)
            : 0,
        }))
 
        lijst.sort((a, b) => b.totaalStappen - a.totaalStappen)
        setLopers(lijst)
      } catch (e) {
        console.error('Lopers laden fout:', e)
      } finally {
        setLaden(false)
      }
    })
 
    return () => unsub()
  }, [])
 
  return { lopers, laden }
}