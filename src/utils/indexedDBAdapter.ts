import type { IDBAdapter } from './dbAdapter'
import type { Member, Match } from '../types'
import * as indexedDB from './indexedDB'

// IndexedDB用のアダプター（watchはポーリングで実装）
export class IndexedDBAdapter implements IDBAdapter {
  private watchIntervals: Map<string, number> = new Map()

  async getAllMembers(): Promise<Member[]> {
    return await indexedDB.getAllMembers()
  }

  async saveMember(member: Member): Promise<void> {
    await indexedDB.saveMember(member)
  }

  async saveAllMembers(members: Member[]): Promise<void> {
    await indexedDB.saveAllMembers(members)
  }

  async deleteMember(memberId: string): Promise<void> {
    await indexedDB.deleteMember(memberId)
  }

  watchMembers(callback: (members: Member[]) => void): () => void {
    // 初回データ取得
    this.getAllMembers().then(callback)

    // ポーリングでデータを監視（1秒ごと）
    const intervalId = window.setInterval(async () => {
      const members = await this.getAllMembers()
      callback(members)
    }, 1000)

    this.watchIntervals.set('members', intervalId)

    // クリーンアップ関数を返す
    return () => {
      clearInterval(intervalId)
      this.watchIntervals.delete('members')
    }
  }

  async getAllMatches(): Promise<Match[]> {
    return await indexedDB.getAllMatches()
  }

  async saveMatch(match: Match): Promise<void> {
    await indexedDB.saveMatch(match)
  }

  async deleteMatch(matchId: string): Promise<void> {
    await indexedDB.deleteMatch(matchId)
  }

  watchMatches(callback: (matches: Match[]) => void): () => void {
    // 初回データ取得
    this.getAllMatches().then(callback)

    // ポーリングでデータを監視（1秒ごと）
    const intervalId = window.setInterval(async () => {
      const matches = await this.getAllMatches()
      callback(matches)
    }, 1000)

    this.watchIntervals.set('matches', intervalId)

    // クリーンアップ関数を返す
    return () => {
      clearInterval(intervalId)
      this.watchIntervals.delete('matches')
    }
  }
}
