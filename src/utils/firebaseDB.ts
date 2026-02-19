import { db, isFirebaseAvailable, isProduction } from './firebase'
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import type { Member, Match, PlayerStats } from '../types'

// Firestoreコレクション名
const MEMBERS_COLLECTION = 'members'
const MATCHES_COLLECTION = 'matches'

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
  if (!isFirebaseAvailable || !db) return []
  const snapshot = await getDocs(collection(db, MEMBERS_COLLECTION))
  return snapshot.docs.map(d => d.data() as Member)
}

// メンバーを保存（新規または更新）
export async function saveMember(member: Member): Promise<void> {
  if (!isFirebaseAvailable || !db) return notAvailable()
  await setDoc(doc(db, MEMBERS_COLLECTION, member.id), member)
}

// 複数のメンバーを一度に保存（バッチ書き込みで効率化）
export async function saveAllMembers(members: Member[]): Promise<void> {
  if (!isFirebaseAvailable || !db) return notAvailable()
  const batch = writeBatch(db)
  members.forEach(member => {
    batch.set(doc(db!, MEMBERS_COLLECTION, member.id), member)
  })
  await batch.commit()
}

// メンバーを削除
export async function deleteMember(memberId: string): Promise<void> {
  if (!isFirebaseAvailable || !db) return notAvailable()
  await deleteDoc(doc(db, MEMBERS_COLLECTION, memberId))
}

// メンバーの変更をリアルタイムで監視
export function watchMembers(
  callback: (members: Member[]) => void
): () => void {
  if (!isFirebaseAvailable || !db) {
    if (isProduction) {
      console.error('[Firebase] 本番環境でFirebaseが利用できません')
    }
    return () => {}
  }
  return onSnapshot(
    collection(db, MEMBERS_COLLECTION),
    snapshot => { callback(snapshot.docs.map(d => d.data() as Member)) },
    error => { console.error('[Firestore] watchMembers error:', error.code) }
  )
}

// --- 試合関連の操作 ---

// MapをJSON形式に変換（Firestore保存用）
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

// JSON形式からMapに変換（Firestore取得用）
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
  if (!isFirebaseAvailable || !db) return []
  const snapshot = await getDocs(collection(db, MATCHES_COLLECTION))
  return snapshot.docs.map(d => deserializeMatch(d.data()))
}

// 試合を保存（新規または更新）
export async function saveMatch(match: Match): Promise<void> {
  if (!isFirebaseAvailable || !db) return notAvailable()
  await setDoc(doc(db, MATCHES_COLLECTION, match.id), serializeMatch(match))
}

// 試合を削除
export async function deleteMatch(matchId: string): Promise<void> {
  if (!isFirebaseAvailable || !db) return notAvailable()
  await deleteDoc(doc(db, MATCHES_COLLECTION, matchId))
}

// 試合の変更をリアルタイムで監視
export function watchMatches(callback: (matches: Match[]) => void): () => void {
  if (!isFirebaseAvailable || !db) {
    if (isProduction) {
      console.error('[Firebase] 本番環境でFirebaseが利用できません')
    }
    return () => {}
  }
  return onSnapshot(
    collection(db, MATCHES_COLLECTION),
    snapshot => { callback(snapshot.docs.map(d => deserializeMatch(d.data()))) },
    error => { console.error('[Firestore] watchMatches error:', error.code) }
  )
}

// すべてのデータをクリア（リセット用）
export async function clearAllData(): Promise<void> {
  if (!isFirebaseAvailable || !db) return notAvailable()
  const [membersSnapshot, matchesSnapshot] = await Promise.all([
    getDocs(collection(db, MEMBERS_COLLECTION)),
    getDocs(collection(db, MATCHES_COLLECTION)),
  ])
  const batch = writeBatch(db)
  membersSnapshot.docs.forEach(d => batch.delete(d.ref))
  matchesSnapshot.docs.forEach(d => batch.delete(d.ref))
  await batch.commit()
}

export { initDB } from './indexedDB'
