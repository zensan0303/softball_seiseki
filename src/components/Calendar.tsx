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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'monthly' | 'yearly' | 'all'>('calendar')

  // 年度を計算（4月始まり）
  const getFiscalYear = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // 1-12
    return month >= 4 ? year : year - 1
  }

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
      // 年度別（4月～翌年3月）
      const fiscalYear = getFiscalYear(currentDate)
      return matches.filter(m => {
        const mDate = new Date(m.date)
        return getFiscalYear(mDate) === fiscalYear
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
        if (!stats || !stats.innings) return // 無効なデータはスキップ
        
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

  const getRankings = (memberStatsArray: ReturnType<typeof getMemberStatsForMatches>, matchCount: number) => {
    const stats = memberStatsArray
    if (stats.length === 0) return {}

    // 実際のデータに基づいて規定打席を計算
    // 全選手の平均打席数を計算
    const totalPlateAppearances = stats.reduce((sum, s) => {
      return sum + s.atBats + s.walks + s.sacrificeFlies + s.sacrificeBunts
    }, 0)
    const averagePlateAppearances = stats.length > 0 ? totalPlateAppearances / stats.length : 0
    
    // 規定打席 = 平均打席数の70% または 試合数×2.5 のいずれか小さい方
    const calculatedRequired = Math.ceil(averagePlateAppearances * 0.7)
    const minRequired = Math.ceil(matchCount * 2.5)
    const requiredPlateAppearances = Math.max(1, Math.min(calculatedRequired, minRequired))

    // 規定打席到達者のみをフィルタ（打率とOPSランキング用）
    const qualifiedStats = stats.filter(s => {
      const plateAppearances = s.atBats + s.walks + s.sacrificeFlies + s.sacrificeBunts
      return plateAppearances >= requiredPlateAppearances
    })

    // 5位までの値を含む全選手を取得する関数
    const getTop5WithTies = <T,>(sorted: T[], getValue: (item: T) => number): T[] => {
      if (sorted.length === 0) return []
      
      // 0の値を持つ選手を除外
      const nonZero = sorted.filter(item => getValue(item) > 0)
      if (nonZero.length === 0) return []
      if (nonZero.length <= 5) return nonZero
      
      // 5位の値を取得
      const fifthValue = getValue(nonZero[4])
      
      // 5位の値以上の選手を全て取得
      return nonZero.filter(item => getValue(item) >= fifthValue)
    }

    return {
      battingAverage: (() => {
        const sorted = [...qualifiedStats].sort((a, b) => {
          const aAvg = a.atBats > 0 ? a.hits / a.atBats : 0
          const bAvg = b.atBats > 0 ? b.hits / b.atBats : 0
          return bAvg - aAvg
        })
        return getTop5WithTies(sorted, s => s.atBats > 0 ? s.hits / s.atBats : 0)
      })(),
      
      rbis: (() => {
        const sorted = [...stats].sort((a, b) => b.rbis - a.rbis)
        return getTop5WithTies(sorted, s => s.rbis)
      })(),
      
      stolenBases: (() => {
        const sorted = [...stats].sort((a, b) => b.stolenBases - a.stolenBases)
        return getTop5WithTies(sorted, s => s.stolenBases)
      })(),
      
      hits: (() => {
        const sorted = [...stats].sort((a, b) => b.hits - a.hits)
        return getTop5WithTies(sorted, s => s.hits)
      })(),
      
      ops: (() => {
        const sorted = [...qualifiedStats].sort((a, b) => {
          const aOps = (a.atBats > 0 ? a.hits / a.atBats : 0) + ((a.atBats + a.walks) > 0 ? (a.hits + a.walks) / (a.atBats + a.walks) : 0)
          const bOps = (b.atBats > 0 ? b.hits / b.atBats : 0) + ((b.atBats + b.walks) > 0 ? (b.hits + b.walks) / (b.atBats + b.walks) : 0)
          return bOps - aOps
        })
        return getTop5WithTies(sorted, s => {
          const slg = s.atBats > 0 ? (s.hits + s.doubles + s.triples * 2 + s.homeRuns * 3) / s.atBats : 0
          const obp = (s.atBats + s.walks) > 0 ? (s.hits + s.walks) / (s.atBats + s.walks) : 0
          return slg + obp
        })
      })(),
      requiredPlateAppearances,
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
      const matchesOnDay = matches.filter(m => m.date === dateStr)

      days.push(
        <div 
          key={day} 
          className="calendar-day"
        >
          <div className="day-number">{day}</div>
          {matchesOnDay.map(match => (
            <div 
              key={match.id}
              className="match-badge"
              onClick={() => setSelectedMatch(match)}
            >
              {match.opponent}
            </div>
          ))}
        </div>
      )
    }

    return days
  }

  const renderStatsView = (type: 'monthly' | 'yearly' | 'all') => {
    const matchList = type === 'all' ? matches : getMatchesForPeriod(type)
    const memberStats = getMemberStatsForMatches(matchList)
    const rankings = getRankings(memberStats, matchList.length)
    
    if (matchList.length === 0) {
      return <div className="empty-stats">この期間に試合がありません</div>
    }

    const fiscalYear = getFiscalYear(currentDate)

    return (
      <div className="stats-view">
        <div className="stats-header">
          {type === 'monthly' && <h3>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h3>}
          {type === 'yearly' && <h3>{fiscalYear}年度</h3>}
          {type === 'all' && <h3>全試合</h3>}
          <p>試合数: {matchList.length}</p>
          <p>規定打席: {rankings.requiredPlateAppearances}打席</p>
        </div>

        {/* ランキング表示 */}
        <div className="rankings-section">
          <div className="ranking-box">
            <h4>打率ランキング</h4>
            <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 8px 0', textAlign: 'center' }}>※規定打席到達者のみ</p>
            <div style={{ paddingLeft: '20px' }}>
              {rankings.battingAverage?.map((stat, idx) => {
                const avg = stat.atBats > 0 ? (stat.hits / stat.atBats).toFixed(3) : '.000'
                const prevAvg = idx > 0 && rankings.battingAverage ? 
                  (rankings.battingAverage[idx - 1].atBats > 0 ? (rankings.battingAverage[idx - 1].hits / rankings.battingAverage[idx - 1].atBats).toFixed(3) : '.000') : null
                const rank = prevAvg === null || avg !== prevAvg ? idx + 1 : 
                  (() => {
                    // 同じ値の最初の順位を探す
                    for (let i = idx - 1; i >= 0; i--) {
                      const iAvg = rankings.battingAverage![i].atBats > 0 ? (rankings.battingAverage![i].hits / rankings.battingAverage![i].atBats).toFixed(3) : '.000'
                      if (iAvg !== avg) return i + 2
                    }
                    return 1
                  })()
                const colorClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''
                return <div key={idx} className={`ranking-item ${colorClass}`}>{rank}位 {stat.name} - {avg}</div>
              })}
            </div>
          </div>
          <div className="ranking-box">
            <h4>安打ランキング</h4>
            <div style={{ paddingLeft: '20px' }}>
              {rankings.hits?.map((stat, idx) => {
                const prevHits = idx > 0 && rankings.hits ? rankings.hits[idx - 1].hits : null
                const rank = prevHits === null || stat.hits !== prevHits ? idx + 1 : 
                  (() => {
                    for (let i = idx - 1; i >= 0; i--) {
                      if (rankings.hits![i].hits !== stat.hits) return i + 2
                    }
                    return 1
                  })()
                const colorClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''
                return <div key={idx} className={`ranking-item ${colorClass}`}>{rank}位 {stat.name} - {stat.hits}本</div>
              })}
            </div>
          </div>
          <div className="ranking-box">
            <h4>打点ランキング</h4>
            <div style={{ paddingLeft: '20px' }}>
              {rankings.rbis?.map((stat, idx) => {
                const prevRbis = idx > 0 && rankings.rbis ? rankings.rbis[idx - 1].rbis : null
                const rank = prevRbis === null || stat.rbis !== prevRbis ? idx + 1 : 
                  (() => {
                    for (let i = idx - 1; i >= 0; i--) {
                      if (rankings.rbis![i].rbis !== stat.rbis) return i + 2
                    }
                    return 1
                  })()
                const colorClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''
                return <div key={idx} className={`ranking-item ${colorClass}`}>{rank}位 {stat.name} - {stat.rbis}点</div>
              })}
            </div>
          </div>
          <div className="ranking-box">
            <h4>OPSランキング</h4>
            <p style={{ fontSize: '0.75rem', color: '#666', margin: '0 0 8px 0', textAlign: 'center' }}>※規定打席到達者のみ</p>
            <div style={{ paddingLeft: '20px' }}>
              {rankings.ops?.map((stat, idx) => {
                const slg = stat.atBats > 0 ? (stat.hits + stat.doubles + stat.triples * 2 + stat.homeRuns * 3) / stat.atBats : 0
                const obp = (stat.atBats + stat.walks) > 0 ? (stat.hits + stat.walks) / (stat.atBats + stat.walks) : 0
                const ops = (slg + obp).toFixed(3)
                const prevOps = idx > 0 && rankings.ops ? (() => {
                  const prevStat = rankings.ops[idx - 1]
                  const prevSlg = prevStat.atBats > 0 ? (prevStat.hits + prevStat.doubles + prevStat.triples * 2 + prevStat.homeRuns * 3) / prevStat.atBats : 0
                  const prevObp = (prevStat.atBats + prevStat.walks) > 0 ? (prevStat.hits + prevStat.walks) / (prevStat.atBats + prevStat.walks) : 0
                  return (prevSlg + prevObp).toFixed(3)
                })() : null
                const rank = prevOps === null || ops !== prevOps ? idx + 1 : 
                  (() => {
                    for (let i = idx - 1; i >= 0; i--) {
                      const prevStat = rankings.ops![i]
                      const prevSlg = prevStat.atBats > 0 ? (prevStat.hits + prevStat.doubles + prevStat.triples * 2 + prevStat.homeRuns * 3) / prevStat.atBats : 0
                      const prevObp = (prevStat.atBats + prevStat.walks) > 0 ? (prevStat.hits + prevStat.walks) / (prevStat.atBats + prevStat.walks) : 0
                      if ((prevSlg + prevObp).toFixed(3) !== ops) return i + 2
                    }
                    return 1
                  })()
                const colorClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''
                return <div key={idx} className={`ranking-item ${colorClass}`}>{rank}位 {stat.name} - {ops}</div>
              })}
            </div>
          </div>
          <div className="ranking-box">
            <h4>盗塁ランキング</h4>
            <div style={{ paddingLeft: '20px' }}>
              {rankings.stolenBases?.map((stat, idx) => {
                const sb = stat.stolenBases || 0
                const prevSb = idx > 0 && rankings.stolenBases ? (rankings.stolenBases[idx - 1].stolenBases || 0) : null
                const rank = prevSb === null || sb !== prevSb ? idx + 1 : 
                  (() => {
                    for (let i = idx - 1; i >= 0; i--) {
                      if ((rankings.stolenBases![i].stolenBases || 0) !== sb) return i + 2
                    }
                    return 1
                  })()
                const colorClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : ''
                return <div key={idx} className={`ranking-item ${colorClass}`}>{rank}位 {stat.name} - {sb}</div>
              })}
            </div>
          </div>
        </div>

        <table className="stats-table-all">
          <thead>
            <tr>
              <th>選手</th>
              <th>試</th>
              <th>打席</th>
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
              const plateAppearances = stat.atBats + stat.walks + stat.sacrificeFlies + stat.sacrificeBunts
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
                  <td>{plateAppearances}</td>
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
            年度
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
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() - 1, 0))}>前年度</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear() + 1, 0))}>翌年度</button>
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
          onUpdate={(updatedMatch) => {
            setMatches(matches.map(m => m.id === updatedMatch.id ? updatedMatch : m))
            setSelectedMatch(updatedMatch)
            // Firebaseに保存
            saveMatch(updatedMatch).catch((error) => {
              console.error('Failed to save updated match to Firebase:', error)
              // エラーをサイレントに処理
            })
          }}
        />
      )}
    </div>
  )
}