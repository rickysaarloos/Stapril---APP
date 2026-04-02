import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

export function useStappenGrafiek(uid, refresh = 0) {
  const [data, setData] = useState([])
  const [laden, setLaden] = useState(true)

  useEffect(() => {
    if (!uid) return

    async function laad() {
      try {
        const q = query(collection(db, 'stappen'), where('uid', '==', uid))
        const snap = await getDocs(q)

        const map = {}
        snap.forEach(doc => {
          const { datum, stappen } = doc.data()
          map[datum] = stappen
        })

        const nu = new Date()
        const jaar = nu.getFullYear()
        const maand = nu.getMonth()
        const aantalDagen = new Date(jaar, maand + 1, 0).getDate()

        const dagen = Array.from({ length: aantalDagen }, (_, i) => {
          const dag = i + 1
          const datum = `${jaar}-${String(maand + 1).padStart(2, '0')}-${String(dag).padStart(2, '0')}`
          return {
            dag,
            datum,
            stappen: map[datum] ?? null,
          }
        })

        setData(dagen)
      } catch (e) {
        console.error(e)
      } finally {
        setLaden(false)
      }
    }

    laad()
  }, [uid, refresh])

  return { data, laden }
}