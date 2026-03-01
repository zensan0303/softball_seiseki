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
  onRemoveGlobalMember?: (memberId: string) => void
  onUpdateGlobalMember?: (member: Member) => void
  onClose: () => void
  onUpdate: (match: Match) => void
  onDeleteMatch?: (matchId: string) => void
  isAdmin: boolean
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
  isAdmin,
}: MatchDetailProps) {
  const [tab, setTab] = useState<'members' | 'stats' | 'results'>('members')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditingOpponent, setIsEditingOpponent] = useState(false)
  const [opponentInput, setOpponentInput] = useState(match.opponent)

  const handleOpponentEdit = () => {
    setOpponentInput(match.opponent)
    setIsEditingOpponent(true)
  }

  const handleOpponentSave = () => {
    const trimmed = opponentInput.trim()
    if (!trimmed) {
      alert('対戦相手名を入力してください')
      return
    }
    onUpdate({ ...match, opponent: trimmed })
    setIsEditingOpponent(false)
  }

  const handleOpponentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleOpponentSave()
    if (e.key === 'Escape') setIsEditingOpponent(false)
  }

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
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false)
    onDeleteMatch?.(match.id)
    onClose()
  }

  const handleAddMember = (member: Member) => {
    const updatedMatch: Match = {
      ...match,
      members: [...updatedMembers, member],
    }
    onUpdate(updatedMatch)
  }

  const handleRemoveMember = (memberId: string) => {
    // 新しいMapを作成してから削除（元のMapを直接変更しない）
    const newStats = new Map(match.stats)
    newStats.delete(memberId)
    const updatedMatch: Match = {
      ...match,
      members: updatedMembers.filter(m => m.id !== memberId),
      stats: newStats,
    }
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-detail-content" onClick={(e) => e.stopPropagation()}>
        <div className="match-header">
          <div className="match-title-area">
            <span className="match-date">{match.date}</span>
            <span className="match-vs"> vs </span>
            {isAdmin && isEditingOpponent ? (
              <span className="opponent-edit-inline">
                <input
                  className="opponent-input"
                  value={opponentInput}
                  onChange={e => setOpponentInput(e.target.value)}
                  onKeyDown={handleOpponentKeyDown}
                  autoFocus
                />
                <button className="opponent-save-btn" onClick={handleOpponentSave}>✓</button>
                <button className="opponent-cancel-btn" onClick={() => setIsEditingOpponent(false)}>✕</button>
              </span>
            ) : (
              <span className="opponent-name">
                {match.opponent}
                {isAdmin && (
                  <button className="opponent-edit-btn" onClick={handleOpponentEdit} title="対戦相手名を編集">✏️</button>
                )}
              </span>
            )}
          </div>
          <div className="header-buttons">
            {isAdmin && !showDeleteConfirm && (
              <button className="btn-delete-match" onClick={handleDeleteMatch} title="この試合を削除">🗑️</button>
            )}
            {isAdmin && showDeleteConfirm && (
              <>
                <span style={{ color: 'white', fontSize: '0.85rem', marginRight: 8 }}>本当に削除？</span>
                <button
                  style={{ background: '#ff3b30', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 4 }}
                  onClick={handleConfirmDelete}
                >削除</button>
                <button
                  style={{ background: 'rgba(255,255,255,0.3)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                  onClick={() => setShowDeleteConfirm(false)}
                >キャンセル</button>
              </>
            )}
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
              isAdmin={isAdmin}
            />
          )}

          {tab === 'stats' && (
            <InningByInningStats
              members={updatedMembers}
              stats={match.stats}
              onUpdateStats={handleUpdateStats}
              isAdmin={isAdmin}
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
