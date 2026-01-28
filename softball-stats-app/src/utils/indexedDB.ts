import type { Member, Match } from '../types'

const DB_NAME = 'JSBSoftballStatsDB'
const DB_VERSION = 1
const MEMBERS_STORE = 'members'
const MATCHES_STORE = 'matches'

let db: IDBDatabase | null = null

// IndexedDBの初期化
export async function initDB(): Promise<IDBDatabase> {
  if (db) return db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result

      // membersストアを作成
      if (!database.objectStoreNames.contains(MEMBERS_STORE)) {
        database.createObjectStore(MEMBERS_STORE, { keyPath: 'id' })
      }

      // matchesストアを作成
      if (!database.objectStoreNames.contains(MATCHES_STORE)) {
        database.createObjectStore(MATCHES_STORE, { keyPath: 'id' })
      }
    }
  })
}

// メンバーを保存
export async function saveMember(member: Member): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MEMBERS_STORE], 'readwrite')
    const store = transaction.objectStore(MEMBERS_STORE)
    const request = store.put(member)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// 複数のメンバーを保存
export async function saveAllMembers(members: Member[]): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MEMBERS_STORE], 'readwrite')
    const store = transaction.objectStore(MEMBERS_STORE)

    // 既存のデータをクリア
    const clearRequest = store.clear()
    clearRequest.onerror = () => reject(clearRequest.error)

    clearRequest.onsuccess = () => {
      // 新しいデータを追加
      members.forEach((member) => {
        store.put(member)
      })

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()
    }
  })
}

// すべてのメンバーを取得
export async function getAllMembers(): Promise<Member[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MEMBERS_STORE], 'readonly')
    const store = transaction.objectStore(MEMBERS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      resolve(request.result as Member[])
    }
  })
}

// メンバーを削除
export async function deleteMember(memberId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MEMBERS_STORE], 'readwrite')
    const store = transaction.objectStore(MEMBERS_STORE)
    const request = store.delete(memberId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// マッチを保存
export async function saveMatch(match: Match): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MATCHES_STORE], 'readwrite')
    const store = transaction.objectStore(MATCHES_STORE)
    
    // Mapをオブジェクトに変換
    const matchData = {
      ...match,
      stats: Object.fromEntries(match.stats),
    }
    
    const request = store.put(matchData)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// すべてのマッチを取得
export async function getAllMatches(): Promise<Match[]> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MATCHES_STORE], 'readonly')
    const store = transaction.objectStore(MATCHES_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const matches = request.result.map((match: any) => ({
        ...match,
        stats: new Map(Object.entries(match.stats || {})),
      }))
      resolve(matches as Match[])
    }
  })
}

// マッチを削除
export async function deleteMatch(matchId: string): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MATCHES_STORE], 'readwrite')
    const store = transaction.objectStore(MATCHES_STORE)
    const request = store.delete(matchId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// すべてのデータをクリア（リセット用）
export async function clearAllData(): Promise<void> {
  const database = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([MEMBERS_STORE, MATCHES_STORE], 'readwrite')
    
    transaction.objectStore(MEMBERS_STORE).clear()
    transaction.objectStore(MATCHES_STORE).clear()

    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => resolve()
  })
}
