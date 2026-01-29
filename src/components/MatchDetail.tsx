import { useState } from 'react'
import type { Match, Member, PlayerStats } from '../types'
import { calculatePlayerStats } from '../utils/statsCalculator'
import '../styles/MatchDetail.css'
import MemberList from './MemberList'
import InningByInningStats from './InningByInningStats'
import StatsDisplay from './StatsDisplay'

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
      members: match.members.filter(m => m.id !== memberId),
    }
    // 成績も削除
    updatedMatch.stats.delete(memberId)
    onUpdate(updatedMatch)
  }

  const handleUpdateMember = (member: Member) => {
    const updatedMatch: Match = {
      ...match,
      members: match.members.map(m => m.id === member.id ? member : m),
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
    return match.members.find(m => m.id === playerId)?.name || '不明'
  }

  const playerOverallStats = Array.from(match.stats.entries()).map(([playerId, stats]) => ({
    playerId,
    name: getPlayerName(playerId),
    ...calculatePlayerStats(stats),
  }))

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
              members={match.members}
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
              members={match.members}
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
