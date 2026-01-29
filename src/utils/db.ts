import type { IDBAdapter } from './dbAdapter'
import { FirebaseDBAdapter } from './firebaseDBAdapter'
import { IndexedDBAdapter } from './indexedDBAdapter'

// 環境変数からDB種別を取得（デフォルトはindexedDB）
const DB_TYPE = import.meta.env.VITE_DB_TYPE || 'indexeddb'

// DBアダプターのシングルトンインスタンス
let dbInstance: IDBAdapter | null = null

// DBアダプターを取得
export function getDB(): IDBAdapter {
  if (dbInstance) {
    return dbInstance
  }

  switch (DB_TYPE.toLowerCase()) {
    case 'firebase':
      console.log('🔥 Using Firebase Realtime Database')
      dbInstance = new FirebaseDBAdapter()
      break
    case 'indexeddb':
    default:
      console.log('💾 Using IndexedDB (Local Storage)')
      dbInstance = new IndexedDBAdapter()
      break
  }

  return dbInstance
}

// 便利な関数をエクスポート
export const {
  getAllMembers,
  saveMember,
  saveAllMembers,
  deleteMember,
  watchMembers,
  getAllMatches,
  saveMatch,
  deleteMatch,
  watchMatches,
} = new Proxy({} as IDBAdapter, {
  get: (_, prop: string) => {
    const db = getDB()
    return (db as any)[prop].bind(db)
  },
})

export default getDB
