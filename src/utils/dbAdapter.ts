import type { Member, Match, PlayerStats } from '../types'

// DBアダプターのインターフェース
export interface IDBAdapter {
  // メンバー関連
  getAllMembers(): Promise<Member[]>
  saveMember(member: Member): Promise<void>
  saveAllMembers(members: Member[]): Promise<void>
  deleteMember(memberId: string): Promise<void>
  watchMembers(callback: (members: Member[]) => void): () => void

  // 試合関連
  getAllMatches(): Promise<Match[]>
  saveMatch(match: Match): Promise<void>
  deleteMatch(matchId: string): Promise<void>
  watchMatches(callback: (matches: Match[]) => void): () => void
}
