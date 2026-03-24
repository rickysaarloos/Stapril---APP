import { useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const STORAGE_KEY = 'stapril_user'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid)
        const docSnap = await getDoc(docRef)

        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          naam: docSnap.exists() ? docSnap.data().naam : '',
          role: docSnap.exists() ? docSnap.data().role : 'deelnemer',
          teamId: docSnap.exists() ? (docSnap.data().teamId ?? null) : null,
        }

        setUser(userData)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      } else {
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      }
      setLoading(false)
    })

    return () => unsub()
  }, [])

  async function registreer(naam, email, wachtwoord) {
    const result = await createUserWithEmailAndPassword(auth, email, wachtwoord)
    await setDoc(doc(db, 'users', result.user.uid), {
      naam,
      email,
      role: 'deelnemer',
      teamId: null,
      aangemeldOp: new Date().toISOString(),
    })
    return result.user
  }

  async function login(email, wachtwoord) {
    return signInWithEmailAndPassword(auth, email, wachtwoord)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, loading, registreer, login, logout }
}