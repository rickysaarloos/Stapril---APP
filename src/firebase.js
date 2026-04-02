import { initializeApp } from "firebase/app";
// Importeer de functie om de Firebase-app te initialiseren

import { getAuth } from "firebase/auth";
// Importeer de functie om Firebase Authentication te gebruiken

import { getFirestore } from "firebase/firestore";
// Importeer de functie om Firestore (database) te gebruiken

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
// Firebase-configuratieobject met alle benodigde credentials
// De waarden komen uit environment variables (veilig voor productie)

const app = initializeApp(firebaseConfig);
// Initialiseert de Firebase-app met de opgegeven configuratie

export const auth = getAuth(app);
// Exporteert een auth-object om in de app in te loggen, registreren, enz.

export const db = getFirestore(app);
// Exporteert een Firestore database-object om data in op te slaan en op te halen