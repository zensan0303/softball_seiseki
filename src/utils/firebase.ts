import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'

// Firebase設定
// .envファイルまたは環境変数から読み込む
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Firebase設定が有効かチェック
function isFirebaseConfigValid(): boolean {
  const requiredFields = {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL,
  }

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  return missingFields.length === 0
}

// Firebase設定が有効な場合のみ初期化
let app: FirebaseApp | null = null
let database: Database | null = null

if (isFirebaseConfigValid()) {
  try {
    app = initializeApp(firebaseConfig)
    database = getDatabase(app)
    console.info('Firebase初期化成功: Realtime Databaseを使用します')
  } catch (error) {
    console.error('Firebase初期化エラー:', error)
  }
} else {
  console.warn(
    'Firebase設定が不完全です。IndexedDBをローカルストレージとして使用します。\n' +
    'Firebase Realtime Databaseを使用する場合は、.envファイルを作成して以下の環境変数を設定してください：\n' +
    '- VITE_FIREBASE_API_KEY\n' +
    '- VITE_FIREBASE_PROJECT_ID\n' +
    '- VITE_FIREBASE_DATABASE_URL'
  )
}

// データベースインスタンスをエクスポート（nullの可能性あり）
export { database }
export const isFirebaseEnabled = database !== null

export default app
