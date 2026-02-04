import { database, isFirebaseAvailable, isProduction } from './firebase'
import {
  ref,
  set,
  get,
  remove,
  onValue,
  off,
} from 'firebase/database'
import type { Member, Match, PlayerStats } from '../types'

// データベースのルートパス
const MEMBERS_PATH = 'members'
const MATCHES_PATH = 'matches'

// Firebaseが利用できない場合の処理
const notAvailable = () => {
  if (isProduction) {
    console.error('[Firebase] 本番環境でFirebaseが利用できません')
    throw new Error('データベースに接続できません')
  }
  // 開発環境ではIndexedDBで動作
  return Promise.resolve()
}

// --- メンバー関連の操作 ---

// すべてのメンバーを取得
export async function getAllMembers(): Promise<Member[]> {
  if (!isFirebaseAvailable || !database) return []
  const membersRef = ref(database, MEMBERS_PATH)
  const snapshot = await get(membersRef)
  if (snapshot.exists()) {
    const data = snapshot.val()
    return Object.values(data)
  }
  return []
}

// メンバーを保存（新規または更新）
export async function saveMember(member: Member): Promise<void> {
  if (!isFirebaseAvailable || !database) return notAvailable()
  const memberRef = ref(database, `${MEMBERS_PATH}/${member.id}`)
  await set(memberRef, member)
}

// 複数のメンバーを一度に保存
export async function saveAllMembers(members: Member[]): Promise<void> {
  if (!isFirebaseAvailable || !database) return notAvailable()
  const membersRef = ref(database, MEMBERS_PATH)
  const membersObject = members.reduce((acc, member) => {
    acc[member.id] = member
    return acc
  }, {} as Record<string, Member>)
  await set(membersRef, membersObject)
}

// メンバーを削除
export async function deleteMember(memberId: string): Promise<void> {
  if (!isFirebaseAvailable || !database) return notAvailable()
  const memberRef = ref(database, `${MEMBERS_PATH}/${memberId}`)
  await remove(memberRef)
}

// メンバーの変更をリアルタイムで監視
export function watchMembers(
  callback: (members: Member[]) => void
): () => void {
  if (!isFirebaseAvailable || !database) {
    if (isProduction) {
      console.error('[Firebase] 本番環境でFirebaseが利用できません')
    }
    // 開発環境ではIndexedDBのみで動作（リアルタイム監視なし）
    return () => {} // 何もしない関数を返す
  }
  const membersRef = ref(database, MEMBERS_PATH)
  const unsubscribe = onValue(membersRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      callback(Object.values(data))
    } else {
      callback([])
    }
  })
  return () => off(membersRef, 'value', unsubscribe)
}

// --- 試合関連の操作 ---

// MapをJSON形式に変換（Firebase保存用）
function serializeMatch(match: Match): any {
  const statsObject: Record<string, PlayerStats> = {}
  match.stats.forEach((value, key) => {
    statsObject[key] = value
  })
  return {
    ...match,
    stats: statsObject,
  }
}

// JSON形式からMapに変換（Firebase取得用）
function deserializeMatch(data: any): Match {
  const stats = new Map<string, PlayerStats>()
  if (data.stats) {
    Object.entries(data.stats).forEach(([key, value]) => {
      stats.set(key, value as PlayerStats)
    })
  }
  return {
    ...data,
    members: Array.isArray(data.members) ? data.members : [],
    stats,
  }
}

// すべての試合を取得
export async function getAllMatches(): Promise<Match[]> {
  if (!isFirebaseAvailable || !database) return []
  const matchesRef = ref(database, MATCHES_PATH)
  const snapshot = await get(matchesRef)
  if (snapshot.exists()) {
    const data = snapshot.val()
    return Object.values(data).map((match: any) => deserializeMatch(match))
  }
  return []
}

// 試合を保存（新規または更新）
export async function saveMatch(match: Match): Promise<void> {
  if (!isFirebaseAvailable || !database) return notAvailable()
  const matchRef = ref(database, `${MATCHES_PATH}/${match.id}`)
  const serializedMatch = serializeMatch(match)
  await set(matchRef, serializedMatch)
}

// 試合を削除
export async function deleteMatch(matchId: string): Promise<void> {
  if (!isFirebaseAvailable || !database) return notAvailable()
  const matchRef = ref(database, `${MATCHES_PATH}/${matchId}`)
  await remove(matchRef)
}

// 試合の変更をリアルタイムで監視
export function watchMatches(callback: (matches: Match[]) => void): () => void {
  if (!isFirebaseAvailable || !database) {
    if (isProduction) {
      console.error('[Firebase] 本番環境でFirebaseが利用できません')
    }
    // 開発環境ではIndexedDBのみで動作（リアルタイム監視なし）
    return () => {} // 何もしない関数を返す
  }
  const matchesRef = ref(database, MATCHES_PATH)
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val()
      const matches = Object.values(data).map((match: any) =>
        deserializeMatch(match)
      )
      callback(matches)
    } else {
      callback([])
    }
  })
  return () => off(matchesRef, 'value', unsubscribe)
}

// すべてのデータをクリア（リセット用）
export async function clearAllData(): Promise<void> {
  if (!isFirebaseAvailable || !database) return notAvailable()
  await Promise.all([
    remove(ref(database, MEMBERS_PATH)),
    remove(ref(database, MATCHES_PATH)),
  ])
}

// --- IndexedDBとの互換性維持（オプション）---
// ローカルストレージのフォールバック機能として残す場合

export { initDB } from './indexedDB'
