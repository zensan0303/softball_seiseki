import type { IDBAdapter } from './dbAdapter'
import type { Member, Match } from '../types'
import * as firebaseDB from './firebaseDB'

// Firebase用のアダプター
export class FirebaseDBAdapter implements IDBAdapter {
  async getAllMembers(): Promise<Member[]> {
    return await firebaseDB.getAllMembers()
  }

  async saveMember(member: Member): Promise<void> {
    await firebaseDB.saveMember(member)
  }

  async saveAllMembers(members: Member[]): Promise<void> {
    await firebaseDB.saveAllMembers(members)
  }

  async deleteMember(memberId: string): Promise<void> {
    await firebaseDB.deleteMember(memberId)
  }

  watchMembers(callback: (members: Member[]) => void): () => void {
    return firebaseDB.watchMembers(callback)
  }

  async getAllMatches(): Promise<Match[]> {
    return await firebaseDB.getAllMatches()
  }

  async saveMatch(match: Match): Promise<void> {
    await firebaseDB.saveMatch(match)
  }

  async deleteMatch(matchId: string): Promise<void> {
    await firebaseDB.deleteMatch(matchId)
  }

  watchMatches(callback: (matches: Match[]) => void): () => void {
    return firebaseDB.watchMatches(callback)
  }
}
