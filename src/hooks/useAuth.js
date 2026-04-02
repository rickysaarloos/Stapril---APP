import { useState, useEffect } from 'react' // React hooks voor state en lifecycle
import {
  createUserWithEmailAndPassword, // Firebase functie om gebruiker te registreren
  signInWithEmailAndPassword, // Firebase functie om in te loggen
  signOut, // Firebase functie om uit te loggen
  onAuthStateChanged, // Listener voor auth status (ingelogd/uitgelogd)
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore' // Firestore functies voor database interactie
import { auth, db } from '../firebase' // Jouw Firebase configuratie (auth + database)

const STORAGE_KEY = 'stapril_user' // Sleutel voor localStorage

export function useAuth() { // Custom hook voor alle auth logica
  const [user, setUser] = useState(() => { // State voor gebruiker (met lazy init)
    try {
      const saved = localStorage.getItem(STORAGE_KEY) // Haal opgeslagen user op
      return saved ? JSON.parse(saved) : null // Parse JSON of return null
    } catch {
      return null // Fallback bij error
    }
  })

  const [loading, setLoading] = useState(true) // State om loading bij te houden

  useEffect(() => { // Wordt uitgevoerd bij mount
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => { // Luistert naar auth veranderingen
      if (firebaseUser) { // Als gebruiker is ingelogd
        const docRef = doc(db, 'users', firebaseUser.uid) // Referentie naar user document
        const docSnap = await getDoc(docRef) // Haal document op uit Firestore

        const userData = { // Maak eigen user object
          uid: firebaseUser.uid, // Unieke ID
          email: firebaseUser.email, // Email
          naam: docSnap.exists() ? docSnap.data().naam : '', // Naam uit DB of leeg
          role: docSnap.exists() ? docSnap.data().role : 'deelnemer', // Rol of default
          teamId: docSnap.exists() ? (docSnap.data().teamId ?? null) : null, // Team ID of null
        }

        setUser(userData) // Zet user in state
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData)) // Sla user lokaal op
      } else { // Als gebruiker is uitgelogd
        setUser(null) // Reset user state
        localStorage.removeItem(STORAGE_KEY) // Verwijder uit localStorage
      }

      setLoading(false) // Loading klaar
    })

    return () => unsub() // Cleanup: stop listener bij unmount
  }, [])

  async function registreer(naam, email, wachtwoord) { // Functie om nieuwe gebruiker te registreren
    const result = await createUserWithEmailAndPassword(auth, email, wachtwoord) // Maak account in Firebase Auth

    await setDoc(doc(db, 'users', result.user.uid), { // Maak user document in Firestore
      naam, // Naam van gebruiker
      email, // Email
      role: 'deelnemer', // Standaard rol
      teamId: null, // Nog geen team
      aangemeldOp: new Date().toISOString(), // Datum van registratie
    })

    return result.user // Geef Firebase user terug
  }

  async function login(email, wachtwoord) { // Login functie
    return signInWithEmailAndPassword(auth, email, wachtwoord) // Firebase login
  }

  async function logout() { // Logout functie
    await signOut(auth) // Firebase logout
  }

  return { user, loading, registreer, login, logout } // Alles wat de hook beschikbaar maakt
}