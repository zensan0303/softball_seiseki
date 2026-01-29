import { useState, useEffect } from 'react'
import type { Match, Member } from '../types'
import { getAllMatches, saveMatch, deleteMember, saveMember, deleteMatch, watchMatches } from '../utils/firebaseDB'
import '../styles/Calendar.css'
import MatchDetail from './MatchDetail'
import MatchModal from './MatchModal'

interface CalendarProps {
  globalMembers: Member[]
  onAddMember: (name: string) => void
  onRemoveMember: (memberId: string) => void
  onUpdateMember: (member: Member) => boolean
}

export default function Calendar({ globalMembers, onAddMember, onRemoveMember, onUpdateMember }: CalendarProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 27))
  const [viewMode, setViewMode] = useState<'calendar' | 'monthly' | 'yearly' | 'all'>('calendar')

  // Firebaseからマッチを読み込み
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const savedMatches = await getAllMatches()
        setMatches(savedMatches)
      } catch (error) {
        console.error('Failed to load matches from Firebase:', error)
      }
    }

    loadMatches()

    // リアルタイム監視を設定（他のユーザーの変更を自動反映）
    const unsubscribe = watchMatches((updatedMatches) => {
      setMatches(updatedMatches)
      // 選択中の試合を更新（IDが一致する試合を新しい配列から見つける）
      setSelectedMatch((currentSelected) => {
        if (!currentSelected) return null
        return updatedMatches.find((m) => m.id === currentSelected.id) || null
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleAddMatch = (opponent: string, date: string) => {
    const newMatch: Match = {
      id: Date.now().toString(),
      date,
      opponent,
      members: [],
      stats: new Map(),
    }
    setMatches([...matches, newMatch])
    setIsModalOpen(false)
    // Firebaseに保存
    saveMatch(newMatch).catch((error) => {
      console.error('Failed to save match to Firebase:', error)
      alert('試合の保存に失敗しました')
    })
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleRemoveGlobalMember = async (memberId: string) => {
    try {
      await deleteMember(memberId)
      onRemoveMember(memberId)
    } catch (error) {
      console.error('Failed to delete member:', error)
    }
  }

  const handleUpdateGlobalMember = async (member: Member) => {
    try {
      const success = onUpdateMember(member)
      if (success) {
        await saveMember(member)
      }
    } catch (error) {
      console.error('Failed to update member:', error)
      // エラーをサイレントに処理
    }
  }

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteMatch(matchId)
      setMatches(matches.filter(m => m.id !== matchId))
    } catch (error) {
      console.error('Failed to delete match:', error)
      alert('試合の削除に失敗しました')
    }
  }

  const getMatchesForPeriod = (type: 'monthly' | 'yearly') => {
    if (type === 'monthly') {
      return matches.filter(m => {
        const mDate = new Date(m.date)
        return mDate.getFullYear() === currentDate.getFullYear() && 
               mDate.getMonth() === currentDate.getMonth()
      })
    } else {
      return matches.filter(m => {
        const mDate = new Date(m.date)
        return mDate.getFullYear() === currentDate.getFullYear()
      })
    }
  }

  const getMemberStatsForMatches = (matchList: Match[]) => {
    const memberStats: Record<string, {
      name: string
      matches: number
      atBats: number
      hits: number
      doubles: number
      triples: number
      homeRuns: number
      walks: number
      runs: number
      rbis: number
      stolenBases: number
      sacrificeBunts: number
      sacrificeFlies: number
      deadBalls: number
    }> = {}

    matchList.forEach(match => {
      match.stats.forEach((stats, playerId) => {
        const memberName = match.members.find(m => m.id === playerId)?.name || '不明'
        if (!memberStats[playerId]) {
          memberStats[playerId] = {
            name: memberName,
            matches: 0,
            atBats: 0,
            hits: 0,
            doubles: 0,
            triples: 0,
            homeRuns: 0,
            walks: 0,
            runs: 0,
            rbis: 0,
            stolenBases: 0,
            sacrificeBunts: 0,
            sacrificeFlies: 0,
            deadBalls: 0,
          }
        }
        memberStats[playerId].matches += 1
        stats.innings.forEach(inning => {
          memberStats[playerId].atBats += inning.atBats
          memberStats[playerId].hits += inning.hits
          memberStats[playerId].doubles += inning.doubles
          memberStats[playerId].triples += inning.triples
          memberStats[playerId].homeRuns += inning.homeRuns
          memberStats[playerId].walks += inning.walks
          memberStats[playerId].runs += inning.runs
          memberStats[playerId].rbis += inning.rbis
          memberStats[playerId].stolenBases += inning.stolenBases
          memberStats[playerId].sacrificeBunts += inning.sacrificeBunts
          memberStats[playerId].sacrificeFlies += inning.sacrificeFlies
          memberStats[playerId].deadBalls += (inning.deadBalls || 0)
        })
      })
    })

    return Object.values(memberStats).sort((a, b) => b.matches - a.matches)
  }

  const getRankings = (memberStatsArray: ReturnType<typeof getMemberStatsForMatches>) => {
    const stats = memberStatsArray
    if (stats.length === 0) return {}

    return {
      battingAverage: [...stats].sort((a, b) => {
        const aAvg = a.atBats > 0 ? a.hits / a.atBats : 0
        const bAvg = b.atBats > 0 ? b.hits / b.atBats : 0
        return bAvg - aAvg
      }).slice(0, 3),
      
      rbis: [...stats].sort((a, b) => b.rbis - a.rbis).slice(0, 3),
      
      stolenBases: [...stats].sort((a, b) => b.stolenBases - a.stolenBases).slice(0, 3),
      
      hits: [...stats].sort((a, b) => b.hits - a.hits).slice(0, 3),
      
      ops: [...stats].sort((a, b) => {
        const aOps = (a.atBats > 0 ? a.hits / a.atBats : 0) + ((a.atBats + a.walks) > 0 ? (a.hits + a.walks) / (a.atBats + a.walks) : 0)
        const bOps = (b.atBats > 0 ? b.hits / b.atBats : 0) + ((b.atBats + b.walks) > 0 ? (b.hits + b.walks) / (b.atBats + b.walks) : 0)
        return bOps - aOps
      }).slice(0, 3),
    }
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const matchOnDay = matches.find(m => m.date === dateStr)

      days.push(
        <div 
          key={day} 
          className="calendar-day"
          onClick={() => matchOnDay && setSelectedMatch(matchOnDay)}
        >
          <div className="day-number">{day}</div>
          {matchOnDay && (
            <div className="match-badge">{matchOnDay.opponent}</div>
          )}
        </div>
      )
    }

    return days
  }

  const renderStatsView = (type: 'monthly' | 'yearly' | 'all') => {
    const matchList = type === 'all' ? matches : getMatchesForPeriod(type)
    const memberStats = getMemberStatsForMatches(matchList)
    const rankings = getRankings(memberStats)
    
    if (matchList.length === 0) {
      return <div className="empty-stats">この期間に試合がありません</div>
    }

    return (
      <div className="stats-view">
        <div className="stats-header">
          {type === 'monthly' && <h3>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h3>}
          {type === 'yearly' && <h3>{currentDate.getFullYear()}年</h3>}
          {type === 'all' && <h3>全試合</h3>}
          <p>試合数: {matchList.length}</p>
        </div>

        {/* ランキング表示 */}
        <div className="rankings-section">
          <div className="ranking-box">
            <h4>打率ランキング</h4>
            <ol>
              {rankings.battingAverage?.map((stat, idx) => {
                const avg = stat.atBats > 0 ? (stat.hits / stat.atBats).toFixed(3) : '.000'
                return <li key={idx}>{stat.name} - {avg}</li>
              })}
            </ol>
          </div>
          <div className="ranking-box">
            <h4>打点ランキング</h4>
            <ol>
              {rankings.rbis?.map((stat, idx) => (
                <li key={idx}>{stat.name} - {stat.rbis}点</li>
              ))}
            </ol>
          </div>
          <div className="ranking-box">
            <h4>盗塁ランキング</h4>
            <ol>
              {rankings.stolenBases?.map((stat, idx) => (
                <li key={idx}>{stat.name} - {stat.stolenBases || 0}</li>
              ))}
            </ol>
          </div>
          <div className="ranking-box">
            <h4>安打ランキング</h4>
            <ol>
              {rankings.hits?.map((stat, idx) => (
                <li key={idx}>{stat.name} - {stat.hits}本</li>
              ))}
            </ol>
          </div>
          <div className="ranking-box">
            <h4>OPSランキング</h4>
            <ol>
              {rankings.ops?.map((stat, idx) => {
                const slg = stat.atBats > 0 ? (stat.hits + stat.doubles + stat.triples * 2 + stat.homeRuns * 3) / stat.atBats : 0
                const obp = (stat.atBats + stat.walks) > 0 ? (stat.hits + stat.walks) / (stat.atBats + stat.walks) : 0
                const ops = slg + obp
                return <li key={idx}>{stat.name} - {ops.toFixed(3)}</li>
              })}
            </ol>
          </div>
        </div>

        <table className="stats-table-all">
          <thead>
            <tr>
              <th>選手</th>
              <th>試</th>
              <th>打</th>
              <th>安</th>
              <th>二</th>
              <th>三</th>
              <th>本</th>
              <th>四</th>
              <th>点</th>
              <th>打点</th>
              <th>盗</th>
              <th>犠</th>
              <th>犠飛</th>
              <th>打率</th>
              <th>長打率</th>
              <th>出塁率</th>
            </tr>
          </thead>
          <tbody>
            {memberStats.map((stat) => {
              const avg = stat.atBats > 0 ? (stat.hits / stat.atBats).toFixed(3) : '.000'
              const slg = stat.atBats > 0 ? ((stat.hits + stat.doubles + stat.triples * 2 + stat.homeRuns * 3) / stat.atBats).toFixed(3) : '.000'
              const obp = (stat.atBats + stat.walks + stat.sacrificeFlies) > 0 ? ((stat.hits + stat.walks) / (stat.atBats + stat.walks + stat.sacrificeFlies)).toFixed(3) : '.000'
              const sb = stat.stolenBases || 0
              const sh = stat.sacrificeBunts || 0
              const sf = stat.sacrificeFlies || 0
              return (
                <tr key={stat.name}>
                  <td className="stat-name">{stat.name}</td>
                  <td>{stat.matches}</td>
                  <td>{stat.atBats}</td>
                  <td>{stat.hits}</td>
                  <td>{stat.doubles}</td>
                  <td>{stat.triples}</td>
                  <td>{stat.homeRuns}</td>
                  <td>{stat.walks}</td>
                  <td>{stat.runs}</td>
                  <td>{stat.rbis}</td>
                  <td>{sb}</td>
                  <td>{sh}</td>
                  <td>{sf}</td>
                  <td>{avg}</td>
                  <td>{slg}</td>
                  <td>{obp}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="app-header">
        <h1>JSB成績管理</h1>
        <div className="view-tabs">
          <button 
            className={`tab-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            カレンダー
          </button>
          <button 
            className={`tab-btn ${viewMode === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewMode('monthly')}
          >
            月間
          </button>
          <button 
            className={`tab-btn ${viewMode === 'yearly' ? 'active' : ''}`}
            onClick={() => setViewMode('yearly')}
          >
            年間
          </button>
          <button 
            className={`tab-btn ${viewMode === 'all' ? 'active' : ''}`}
            onClick={() => setViewMode('all')}
          >
            全試合
          </button>
        </div>
      </div>
      
      {viewMode === 'calendar' ? (
        <>
          <div className="calendar-header">
            <button onClick={prevMonth}>前月</button>
            <h2>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h2>
            <button onClick={nextMonth}>次月</button>
          </div>

          <button className="add-match-btn" onClick={() => setIsModalOpen(true)}>
            試合を追加
          </button>

          <div className="weekdays">
            <div>日</div>
            <div>月</div>
            <div>火</div>
            <div>水</div>
            <div>木</div>
            <div>金</div>
            <div>土</div>
          </div>

          <div className="calendar-grid">
            {renderCalendar()}
          </div>
        </>
      ) : (
        <>
          {viewMode === 'monthly' && (
            <div className="stats-nav">
              <button onClick={prevMonth}>前月</button>
              <button onClick={nextMonth}>次月</button>
            </div>
          )}
          {viewMode === 'yearly' && (
            <div className="stats-nav">
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0))}>前年</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0))}>翌年</button>
            </div>
          )}
          {renderStatsView(viewMode)}
        </>
      )}

      {isModalOpen && (
        <MatchModal isOpen={isModalOpen} onSubmit={handleAddMatch} onClose={() => setIsModalOpen(false)} />
      )}

      {selectedMatch && (
        <MatchDetail
          match={selectedMatch}
          globalMembers={globalMembers}
          onAddMember={onAddMember}
          onRemoveMember={onRemoveMember}
          onRemoveGlobalMember={handleRemoveGlobalMember}
          onUpdateGlobalMember={handleUpdateGlobalMember}
          onClose={() => setSelectedMatch(null)}
          onDeleteMatch={handleDeleteMatch}
          onUpdate={async (updatedMatch) => {
            // 楽観的更新（UIの即座な反応のため）
            setMatches((prevMatches) => prevMatches.map(m => m.id === updatedMatch.id ? updatedMatch : m))
            setSelectedMatch(updatedMatch)
            
            try {
              // Firebaseに保存（リアルタイムリスナーが自動的に同期します）
              await saveMatch(updatedMatch)
            } catch (error) {
              console.error('Failed to save updated match to Firebase:', error)
              alert('試合データの保存に失敗しました。もう一度お試しください。')
              // エラー時は以前のデータを再読み込み
              const savedMatches = await getAllMatches()
              setMatches(savedMatches)
              setSelectedMatch(savedMatches.find(m => m.id === updatedMatch.id) || null)
            }
          }}
        />
      )}
    </div>
  )
}