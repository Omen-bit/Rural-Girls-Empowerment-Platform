"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { initializeApp, getApps, getApp } from "firebase/app"
import {
  getAuth,
  onAuthStateChanged,
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type RecaptchaVerifier,
} from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getFunctions } from "firebase/functions"

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase only if credentials are available
let app
let auth
let db
let storage
let functions
let googleProvider

const isConfigValid =
  typeof window !== "undefined" && firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "undefined"

if (isConfigValid) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    functions = getFunctions(app)
    googleProvider = new GoogleAuthProvider()
  } catch (error) {
    console.error("Firebase initialization error:", error)
  }
}

// Define context type
type FirebaseContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string) => Promise<User>
  signInWithGoogle: () => Promise<User>
  signInWithPhone: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<any>
  signOut: () => Promise<void>
  auth: any
  db: any
  storage: any
  functions: any
  isInitialized: boolean
}

const FirebaseContext = createContext<FirebaseContextType | null>(null)

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(isConfigValid)

  useEffect(() => {
    if (!isInitialized) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [isInitialized])

  const signIn = async (email: string, password: string) => {
    if (!isInitialized) throw new Error("Firebase is not initialized. Please check your environment variables.")
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  }

  const signUp = async (email: string, password: string) => {
    if (!isInitialized) throw new Error("Firebase is not initialized. Please check your environment variables.")
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  }

  const signInWithGoogle = async () => {
    if (!isInitialized) throw new Error("Firebase is not initialized. Please check your environment variables.")
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  }

  const signInWithPhone = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    if (!isInitialized) throw new Error("Firebase is not initialized. Please check your environment variables.")
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier)
  }

  const signOut = async () => {
    if (!isInitialized) return
    await firebaseSignOut(auth)
  }

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithPhone,
        signOut,
        auth,
        db,
        storage,
        functions,
        isInitialized,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  )
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext)
  if (!context) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}
