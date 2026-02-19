import { initializeApp } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import type { Auth, User } from 'firebase/auth'

// 開発環境かどうかを判定（Viteの組み込み変数を使用）
const isDevelopment = import.meta.env.DEV

// Firebase設定
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Firebase設定が完全かチェック（FirestoreはdatabaseURL不要）
const isFirebaseConfigured = () => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId
  )
}

// Firebaseアプリを初期化
let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

try {
  if (isFirebaseConfigured()) {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    console.log('[Firebase] 初期化成功')
  } else {
    if (isDevelopment) {
      console.warn('[Firebase] 環境変数が設定されていません。IndexedDBモードで動作します。')
    } else {
      throw new Error(
        'Firebase環境変数が設定されていません。本番環境ではFirebaseの設定が必須です。'
      )
    }
  }
} catch (error) {
  console.error('[Firebase] 初期化エラー:', error)
  if (!isDevelopment) {
    throw error
  }
}

export { db, auth }
export const isFirebaseAvailable = !!db
export const isProduction = !isDevelopment
export default app

export const login = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase認証が初期化されていません')
  return await signInWithEmailAndPassword(auth, email, password)
}

export const logout = async () => {
  if (!auth) throw new Error('Firebase認証が初期化されていません')
  return await signOut(auth)
}

export const onAuthChanged = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, callback)
}
