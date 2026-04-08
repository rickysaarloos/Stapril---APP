import { useState, useEffect } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth'
import {
  doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, where,
  arrayRemove, deleteDoc, writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../firebase'
 
/**
 * Key voor localStorage waar ingelogde gebruikersdata wordt bewaard.
 * @type {string}
 */
const STORAGE_KEY = 'stapril_user'
 
/**
 * Custom React hook voor authenticatie (Firebase) met lokale opslag.
 * @returns {{ user, loading, registreer, login, logout, updateNaam, verwijderAccount }}
 */
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
 
  /**
   * Registreert een nieuwe gebruiker in Firebase Auth + Firestore.
   */
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
 
  /**
   * Logt een gebruiker in met email en wachtwoord.
   */
  async function login(email, wachtwoord) {
    return signInWithEmailAndPassword(auth, email, wachtwoord)
  }
 
  /**
   * Logt de huidige gebruiker uit.
   */
  async function logout() {
    await signOut(auth)
  }
 
  /**
   * Werkt de gebruikersnaam bij in Firestore en localStorage.
   * @param {string} nieuweNaam
   */
  async function updateNaam(nieuweNaam) {
    if (!auth.currentUser) throw new Error('Niet ingelogd')
    const uid = auth.currentUser.uid
    await updateDoc(doc(db, 'users', uid), { naam: nieuweNaam })
    const bijgewerkt = { ...user, naam: nieuweNaam }
    setUser(bijgewerkt)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bijgewerkt))
  }
 
  /**
   * Verwijdert het account volledig na wachtwoordbevestiging.
   * Ruimt op: stappen docs, uid uit teams.leden, users doc, Firebase Auth account.
   * @param {string} wachtwoord Wachtwoord ter bevestiging
   */
  async function verwijderAccount(wachtwoord) {
    const firebaseUser = auth.currentUser
    if (!firebaseUser) throw new Error('Niet ingelogd')
 
    // 1. Re-authenticatie vereist door Firebase voor gevoelige acties
    const credential = EmailAuthProvider.credential(firebaseUser.email, wachtwoord)
    await reauthenticateWithCredential(firebaseUser, credential)
 
    const uid = firebaseUser.uid
    const batch = writeBatch(db)
 
    // 2. Verwijder alle stappen docs van deze gebruiker
    const stappenSnap = await getDocs(
      query(collection(db, 'stappen'), where('uid', '==', uid))
    )
    stappenSnap.forEach(d => batch.delete(d.ref))
 
    // 3. Verwijder uid uit teams.leden arrays
    const teamsSnap = await getDocs(
      query(collection(db, 'teams'), where('leden', 'array-contains', uid))
    )
    teamsSnap.forEach(d => {
      batch.update(d.ref, { leden: arrayRemove(uid) })
    })
 
    // 4. Verwijder users doc
    batch.delete(doc(db, 'users', uid))
 
    // 5. Schrijf alles in één keer weg
    await batch.commit()
 
    // 6. Verwijder Firebase Auth account
    await deleteUser(firebaseUser)
 
    // 7. Ruim localStorage op
    localStorage.removeItem(STORAGE_KEY)
  }
 
  return { user, loading, registreer, login, logout, updateNaam, verwijderAccount }
}