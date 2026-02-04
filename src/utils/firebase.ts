import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

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

// Firebase設定の検証
function validateFirebaseConfig() {
  const requiredFields = {
    apiKey: firebaseConfig.apiKey,
    projectId: firebaseConfig.projectId,
    databaseURL: firebaseConfig.databaseURL,
  }

  const missingFields = Object.entries(requiredFields)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingFields.length > 0) {
    const message = `Firebase設定エラー: 以下の環境変数が設定されていません: ${missingFields.join(', ')}\n\n` +
      `.envファイルを作成し、以下の変数を設定してください:\n` +
      `VITE_FIREBASE_API_KEY\n` +
      `VITE_FIREBASE_PROJECT_ID\n` +
      `VITE_FIREBASE_DATABASE_URL\n\n` +
      `詳細は.env.exampleを参照してください。`
    
    console.error(message)
    throw new Error(message)
  }
}

// 設定を検証
validateFirebaseConfig()

// Firebaseアプリを初期化
const app = initializeApp(firebaseConfig)

// Realtime Databaseのインスタンスを取得
export const database = getDatabase(app)

export default app
