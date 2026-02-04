import { useState } from 'react'
import type { Match, Member, PlayerStats, HitDirection } from '../types'
import { calculatePlayerStats } from '../utils/statsCalculator'
import '../styles/MatchDetail.css'
import MemberList from './MemberList'
import InningByInningStats from './InningByInningStats'
import StatsDisplay from './StatsDisplay'
import InningInputScreen from './InningInputScreen'

interface MatchDetailProps {
  match: Match
  globalMembers: Member[]
  onAddMember: (name: string) => void
  onRemoveMember: (memberId: string) => void
  onRemoveGlobalMember?: (memberId: string) => void
  onUpdateGlobalMember?: (member: Member) => void
  onClose: () => void
  onUpdate: (match: Match) => void
  onDeleteMatch?: (matchId: string) => void
}

export default function MatchDetail({
  match,
  globalMembers,
  onAddMember,
  onRemoveGlobalMember,
  onUpdateGlobalMember,
  onClose,
  onUpdate,
  onDeleteMatch,
}: MatchDetailProps) {
  const [tab, setTab] = useState<'members' | 'stats' | 'results'>('members')
  const [inputMode, setInputMode] = useState<{ active: boolean; member?: Member; inning?: number }>({ active: false })

  // グローバルメンバーの名前変更を試合メンバーに反映
  const getUpdatedMembers = (): Member[] => {
    return match.members.map(matchMember => {
      const globalMember = globalMembers.find(gm => gm.id === matchMember.id)
      if (globalMember && globalMember.name !== matchMember.name) {
        // 名前のみ更新、打順は試合データを維持
        return { ...matchMember, name: globalMember.name }
      }
      return matchMember
    })
  }

  const updatedMembers = getUpdatedMembers()

  const handleDeleteMatch = () => {
    if (confirm(`「${match.date} vs ${match.opponent}」を削除してもよろしいですか？`)) {
      onDeleteMatch?.(match.id)
      onClose()
    }
  }

  const handleAddMember = (member: Member) => {
    const updatedMatch: Match = {
      ...match,
      members: [...match.members, member],
    }
    onUpdate(updatedMatch)
  }

  const handleRemoveMember = (memberId: string) => {
    const updatedMatch: Match = {
      ...match,
      members: updatedMembers.filter(m => m.id !== memberId),
    }
    // 成績も削除
    updatedMatch.stats.delete(memberId)
    onUpdate(updatedMatch)
  }

  const handleUpdateMember = (member: Member) => {
    const updatedMatch: Match = {
      ...match,
      members: updatedMembers.map(m => m.id === member.id ? member : m),
    }
    onUpdate(updatedMatch)
  }

  const handleUpdateStats = (playerId: string, stats: PlayerStats) => {
    const updatedStats = new Map(match.stats)
    updatedStats.set(playerId, stats)
    const updatedMatch: Match = {
      ...match,
      stats: updatedStats,
    }
    onUpdate(updatedMatch)
  }

  const getPlayerName = (playerId: string): string => {
    return updatedMembers.find(m => m.id === playerId)?.name || '不明'
  }

  const playerOverallStats = Array.from(match.stats.entries())
    .filter(([_, stats]) => stats && stats.innings) // statsとinningsが存在する場合のみ
    .map(([playerId, stats]) => ({
      playerId,
      name: getPlayerName(playerId),
      ...calculatePlayerStats(stats),
    }))

  const handleCloseInputScreen = () => {
    setInputMode({ active: false })
  }

  const handleSaveInningStats = (result: string, hitDirection: HitDirection, rbi: number) => {
    if (!inputMode.member || !inputMode.inning) return

    const memberId = inputMode.member.id
    const inningNumber = inputMode.inning

    // 既存の成績を取得
    const playerStats = match.stats.get(memberId)
    const existingInnings = playerStats?.innings || []
    const inningStats = existingInnings.find(i => i.inningNumber === inningNumber)

    let updatedInning: any = inningStats ? { ...inningStats } : {
      inningNumber,
      battingOrder: inputMode.member.battingOrder,
      atBats: 0,
      hits: 0,
      walks: 0,
      runs: 0,
      rbis: 0,
      doubles: 0,
      triples: 0,
      homeRuns: 0,
      stolenBases: 0,
      sacrificeBunts: 0,
      sacrificeFlies: 0,
      errors: 0,
      deadBalls: 0,
    }

    // リセット
    updatedInning.atBats = 0
    updatedInning.hits = 0
    updatedInning.walks = 0
    updatedInning.doubles = 0
    updatedInning.triples = 0
    updatedInning.homeRuns = 0
    updatedInning.sacrificeBunts = 0
    updatedInning.sacrificeFlies = 0
    updatedInning.errors = 0
    updatedInning.rbis = rbi
    updatedInning.hitDirection = hitDirection

    // 結果に応じて更新
    if (result === 'out') {
      updatedInning.atBats = 1
    } else if (result === 'out-rbi') {
      updatedInning.atBats = 1
      updatedInning.rbis = rbi > 0 ? rbi : 1
    } else if (result === 'single') {
      updatedInning.atBats = 1
      updatedInning.hits = 1
    } else if (result === 'double') {
      updatedInning.atBats = 1
      updatedInning.hits = 1
      updatedInning.doubles = 1
    } else if (result === 'triple') {
      updatedInning.atBats = 1
      updatedInning.hits = 1
      updatedInning.triples = 1
    } else if (result === 'homerun') {
      updatedInning.atBats = 1
      updatedInning.hits = 1
      updatedInning.homeRuns = 1
      updatedInning.runs = 1
      if (rbi > 0) {
        updatedInning.rbis = rbi
      }
    } else if (result === 'walk') {
      updatedInning.walks = 1
    } else if (result === 'stolen-base') {
      updatedInning.stolenBases = 1
    } else if (result === 'sacrifice-bunt') {
      updatedInning.sacrificeBunts = 1
    } else if (result === 'sacrifice-fly') {
      updatedInning.sacrificeFlies = 1
    } else if (result === 'error') {
      updatedInning.errors = 1
    } else if (result === 'dead-ball') {
      updatedInning.deadBalls = 1
      updatedInning.walks = 1
    }

    // 成績を更新
    const otherInnings = existingInnings.filter(i => i.inningNumber !== inningNumber)
    const updatedInnings = [...otherInnings, updatedInning].sort((a, b) => a.inningNumber - b.inningNumber)

    handleUpdateStats(memberId, { playerId: memberId, innings: updatedInnings })
    handleCloseInputScreen()
  }

  // 成績入力画面が開いている場合
  if (inputMode.active && inputMode.member && inputMode.inning) {
    return (
      <InningInputScreen
        member={inputMode.member}
        inningNumber={inputMode.inning}
        onSave={handleSaveInningStats}
        onCancel={handleCloseInputScreen}
      />
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="match-header">
          <h2>{match.date} vs {match.opponent}</h2>
          <div className="header-buttons">
            <button className="btn-delete-match" onClick={handleDeleteMatch} title="この試合を削除">🗑️</button>
            <button className="btn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="tab-buttons">
          <button
            className={`tab-btn ${tab === 'members' ? 'active' : ''}`}
            onClick={() => setTab('members')}
          >
            メンバー管理
          </button>
          <button
            className={`tab-btn ${tab === 'stats' ? 'active' : ''}`}
            onClick={() => setTab('stats')}
          >
            成績入力
          </button>
          <button
            className={`tab-btn ${tab === 'results' ? 'active' : ''}`}
            onClick={() => setTab('results')}
          >
            成績表
          </button>
        </div>

        <div className="match-detail-content-body">
          {tab === 'members' && (
            <MemberList
              members={updatedMembers}
              globalMembers={globalMembers}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
              onAddNewMember={onAddMember}
              onUpdateMember={handleUpdateMember}
              onRemoveGlobalMember={onRemoveGlobalMember}
              onUpdateGlobalMember={onUpdateGlobalMember}
            />
          )}

          {tab === 'stats' && (
            <InningByInningStats
              members={updatedMembers}
              stats={match.stats}
              onUpdateStats={handleUpdateStats}
            />
          )}

          {tab === 'results' && (
            <StatsDisplay playerStats={playerOverallStats} opponent={match.opponent} />
          )}
        </div>
      </div>
    </div>
  )
}
