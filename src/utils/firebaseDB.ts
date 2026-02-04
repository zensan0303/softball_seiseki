import { database, isFirebaseEnabled } from './firebase'
import {
  ref,
  set,
  get,
  remove,
  onValue,
  off,
} from 'firebase/database'
import type { Member, Match, PlayerStats } from '../types'
import * as IndexedDBStorage from './indexedDB'

// データベースのルートパス
const MEMBERS_PATH = 'members'
const MATCHES_PATH = 'matches'

// --- メンバー関連の操作 ---

// すべてのメンバーを取得
export async function getAllMembers(): Promise<Member[]> {
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.getAllMembers()
  }
  
  const membersRef = ref(database!, MEMBERS_PATH)
  const snapshot = await get(membersRef)
  if (snapshot.exists()) {
    const data = snapshot.val()
    return Object.values(data)
  }
  return []
}

// メンバーを保存（新規または更新）
export async function saveMember(member: Member): Promise<void> {
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.saveMember(member)
  }
  
  const memberRef = ref(database!, `${MEMBERS_PATH}/${member.id}`)
  await set(memberRef, member)
}

// 複数のメンバーを一度に保存
export async function saveAllMembers(members: Member[]): Promise<void> {
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.saveAllMembers(members)
  }
  
  const membersRef = ref(database!, MEMBERS_PATH)
  const membersObject = members.reduce((acc, member) => {
    acc[member.id] = member
    return acc
  }, {} as Record<string, Member>)
  await set(membersRef, membersObject)
}

// メンバーを削除
export async function deleteMember(memberId: string): Promise<void> {
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.deleteMember(memberId)
  }
  
  const memberRef = ref(database!, `${MEMBERS_PATH}/${memberId}`)
  await remove(memberRef)
}

// メンバーの変更をリアルタイムで監視
export function watchMembers(
  callback: (members: Member[]) => void
): () => void {
  if (!isFirebaseEnabled) {
    // IndexedDBはリアルタイム監視をサポートしていないため、
    // 初回読み込みのみ実行して空の解除関数を返す
    IndexedDBStorage.getAllMembers().then(callback).catch(console.error)
    return () => {} // 何もしない解除関数
  }
  
  const membersRef = ref(database!, MEMBERS_PATH)
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
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.getAllMatches()
  }
  
  const matchesRef = ref(database!, MATCHES_PATH)
  const snapshot = await get(matchesRef)
  if (snapshot.exists()) {
    const data = snapshot.val()
    return Object.values(data).map((match: any) => deserializeMatch(match))
  }
  return []
}

// 試合を保存（新規または更新）
export async function saveMatch(match: Match): Promise<void> {
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.saveMatch(match)
  }
  
  const matchRef = ref(database!, `${MATCHES_PATH}/${match.id}`)
  const serializedMatch = serializeMatch(match)
  await set(matchRef, serializedMatch)
}

// 試合を削除
export async function deleteMatch(matchId: string): Promise<void> {
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.deleteMatch(matchId)
  }
  
  const matchRef = ref(database!, `${MATCHES_PATH}/${matchId}`)
  await remove(matchRef)
}

// 試合の変更をリアルタイムで監視
export function watchMatches(callback: (matches: Match[]) => void): () => void {
  if (!isFirebaseEnabled) {
    // IndexedDBはリアルタイム監視をサポートしていないため、
    // 初回読み込みのみ実行して空の解除関数を返す
    IndexedDBStorage.getAllMatches().then(callback).catch(console.error)
    return () => {} // 何もしない解除関数
  }
  
  const matchesRef = ref(database!, MATCHES_PATH)
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
  if (!isFirebaseEnabled) {
    return IndexedDBStorage.clearAllData()
  }
  
  await Promise.all([
    remove(ref(database!, MEMBERS_PATH)),
    remove(ref(database!, MATCHES_PATH)),
  ])
}

// --- IndexedDBとの互換性維持（オプション）---
// ローカルストレージのフォールバック機能として残す場合

export { initDB } from './indexedDB'
