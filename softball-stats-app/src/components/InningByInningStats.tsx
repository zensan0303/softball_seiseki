import { useState, useEffect } from 'react'
import type { Member, PlayerStats, InningStats } from '../types'
import '../styles/InningByInningStats.css'

type ResultType = 'out' | 'out-rbi' | 'single' | 'double' | 'triple' | 'homerun' | 'walk' | 'stolen-base' | 'sacrifice-bunt' | 'sacrifice-fly' | 'error' | 'dead-ball' | ''

interface InningByInningStatsProps {
  members: Member[]
  stats: Map<string, PlayerStats>
  onUpdateStats: (playerId: string, stats: PlayerStats) => void
  onOpenInputScreen?: (member: Member, inning: number) => void
}

export default function InningByInningStats({
  members,
  stats,
  onUpdateStats,
  onOpenInputScreen,
}: InningByInningStatsProps) {
  const [maxInnings, setMaxInnings] = useState<number>(9)
  const [memberStatsMap, setMemberStatsMap] = useState<Map<string, InningStats[]>>(new Map())
  // ランナーを塁ごとに管理: { inningNumber: { 1塁: playerId[], 2塁: playerId[], 3塁: playerId[] } }
  const [runners, setRunners] = useState<Map<number, { bases: Map<number, Set<string>> }>>(new Map())
  // 代打選手の管理
  const [substituteMembers, setSubstituteMembers] = useState<Set<string>>(new Set())

  // マッチのstatsが更新されたときに各選手の成績を読み込み
  useEffect(() => {
    const newMap = new Map<string, InningStats[]>()
    let maxInning = 9
    const subsSet = new Set<string>()
    
    stats.forEach((playerStats) => {
      if (!playerStats || !playerStats.innings) return // 無効なデータはスキップ
      
      newMap.set(playerStats.playerId, playerStats.innings)
      const inningNumbers = playerStats.innings.map(i => i.inningNumber)
      if (inningNumbers.length > 0) {
        maxInning = Math.max(maxInning, Math.max(...inningNumbers))
      }
      
      // 代打として出場した選手を復元
      playerStats.innings.forEach((inning) => {
        if (inning.substitutePlayerId) {
          subsSet.add(playerStats.playerId)
        }
      })
    })
    
    setMemberStatsMap(newMap)
    setMaxInnings(maxInning)
    setSubstituteMembers(prev => {
      // 手動で追加された代打選手も保持
      const combined = new Set([...subsSet, ...prev])
      return combined
    })
  }, [stats])

  const getInningStats = (memberId: string, inningNumber: number): InningStats | undefined => {
    const playerStats = memberStatsMap.get(memberId)
    return playerStats?.find(i => i.inningNumber === inningNumber && (!i.atBatNumber || i.atBatNumber === 1))
  }

  const getAllInningStats = (memberId: string, inningNumber: number): InningStats[] => {
    const playerStats = memberStatsMap.get(memberId)
    return playerStats?.filter(i => i.inningNumber === inningNumber) || []
  }

  // 回ごとのアウト数をカウント
  const getOutsInInning = (inningNumber: number): number => {
    let outCount = 0
    memberStatsMap.forEach((innings) => {
      innings.forEach((inning) => {
        if (inning.inningNumber === inningNumber) {
          // 通常のアウト：atBats > 0 かつ hits = 0
          if (inning.atBats > 0 && inning.hits === 0) {
            outCount += inning.atBats
          }
          // 犠打：アウト換算
          if (inning.sacrificeBunts > 0) {
            outCount += inning.sacrificeBunts
          }
          // 犠飛：アウト換算
          if (inning.sacrificeFlies > 0) {
            outCount += inning.sacrificeFlies
          }
        }
      })
    })
    return outCount
  }

  // 複数打席の追加が可能かどうかを判定
  const canAddAnotherAtBat = (inningNumber: number, memberId: string): boolean => {
    const allInningsInThisInning = memberStatsMap.get(memberId)?.filter(i => i.inningNumber === inningNumber) || []
    
    // 3つ以上の打席は追加不可
    if (allInningsInThisInning.length >= 3) {
      return false
    }
    
    // 最後の打席が選択されていない場合は追加不可
    if (allInningsInThisInning.length > 0) {
      const lastInning = allInningsInThisInning[allInningsInThisInning.length - 1]
      if (lastInning.atBats === 0 && lastInning.walks === 0 && lastInning.sacrificeBunts === 0 && lastInning.sacrificeFlies === 0 && lastInning.errors === 0) {
        return false
      }
    }
    
    // 3アウトに達している場合は追加不可
    const outsCount = getOutsInInning(inningNumber)
    if (outsCount >= 3) {
      return false
    }
    
    return true
  }

  // この打順がその回でグレーアウトされるべきか判定
  const isInningClosed = (inningNumber: number, battingOrder: number): boolean => {
    const outsCount = getOutsInInning(inningNumber)
    if (outsCount >= 3) {
      // 既に3アウト以上なら、後の打順はグレーアウト
      const alreadyBattedPlayers = new Set<number>()
      memberStatsMap.forEach((innings) => {
        innings.forEach((inning) => {
          if (inning.inningNumber === inningNumber && inning.battingOrder) {
            alreadyBattedPlayers.add(inning.battingOrder)
          }
        })
      })
      
      // この打順がまだ打っていない場合、グレーアウト
      if (!alreadyBattedPlayers.has(battingOrder)) {
        return true
      }
    }
    return false
  }

  // 代打として追加可能な選手を取得（打順10番以降 or 打順なし）
  const getAvailableSubstitutes = (): Member[] => {
    return members.filter(m => 
      !m.battingOrder || m.battingOrder === 0 || m.battingOrder >= 10
    )
  }

  // 代打選手として追加された選手を取得
  const getSubstituteMembers = (): Member[] => {
    return members.filter(m => substituteMembers.has(m.id))
  }

  // 代打選手を追加
  const handleAddSubstitute = (memberId: string) => {
    setSubstituteMembers(prev => new Set([...prev, memberId]))
  }

  // 代打選手を削除
  const handleRemoveSubstitute = (memberId: string) => {
    setSubstituteMembers(prev => {
      const newSet = new Set(prev)
      newSet.delete(memberId)
      return newSet
    })
    
    // その選手の成績をクリア
    const playerStats = stats.get(memberId)
    if (playerStats) {
      onUpdateStats(memberId, {
        ...playerStats,
        innings: []
      })
    }
  }

  // ランナーを進塁させ、得点するランナーを計算
  const advanceRunners = (inningNumber: number, bases: number): string[] => {
    const inningRunners = runners.get(inningNumber)
    const scoredPlayers: string[] = []
    
    if (!inningRunners) {
      return scoredPlayers
    }
    
    const newBases = new Map(inningRunners.bases)
    
    // 3塁のランナーが進塁可能な場合は得点
    if (bases >= 1) {
      const thirdBase = newBases.get(3) || new Set()
      thirdBase.forEach(playerId => scoredPlayers.push(playerId))
      newBases.set(3, new Set())
    }
    
    // 2塁のランナーを進塁
    const secondBase = newBases.get(2) || new Set()
    if (bases >= 2) {
      // 2塁以上のヒット：3塁に進む
      secondBase.forEach(playerId => {
        const third = newBases.get(3) || new Set()
        third.add(playerId)
      })
    } else if (bases === 1) {
      // 単打：3塁に進む
      secondBase.forEach(playerId => {
        const third = newBases.get(3) || new Set()
        third.add(playerId)
      })
    }
    newBases.set(2, new Set())
    
    // 1塁のランナーを進塁
    const firstBase = newBases.get(1) || new Set()
    if (bases >= 3) {
      // 本塁打：全員得点
      firstBase.forEach(playerId => scoredPlayers.push(playerId))
    } else if (bases === 2) {
      // 2塁打：3塁に進む
      firstBase.forEach(playerId => {
        const third = newBases.get(3) || new Set()
        third.add(playerId)
      })
    } else if (bases === 1) {
      // 単打：2塁に進む
      firstBase.forEach(playerId => {
        const second = newBases.get(2) || new Set()
        second.add(playerId)
      })
    }
    newBases.set(1, new Set())
    
    // 新しい塁状態を保存
    const newRunners_ = new Map(runners)
    newRunners_.set(inningNumber, { bases: newBases })
    setRunners(newRunners_)
    
    return scoredPlayers
  }
  
  // ランナーを更新する関数
  const updateRunners = (inningNumber: number, playerId: string, result: ResultType) => {
    let inningRunners = runners.get(inningNumber)
    if (!inningRunners) {
      inningRunners = { bases: new Map([[1, new Set()], [2, new Set()], [3, new Set()]]) }
    }
    
    const newBases = new Map(inningRunners.bases)
    
    if (result === 'single' || result === 'double' || result === 'triple') {
      // ヒット（本塁打除外）：打者が塁に出る（1塁に配置）
      const firstBase = newBases.get(1) || new Set()
      firstBase.add(playerId)
      newBases.set(1, firstBase)
    } else if (result === 'walk') {
      // 四球：打者が1塁に出る
      const firstBase = newBases.get(1) || new Set()
      firstBase.add(playerId)
      newBases.set(1, firstBase)
    } else if (result === 'error') {
      // エラー：打者が1塁に出る、既存のランナーも進塁
      const firstBase = newBases.get(1) || new Set()
      const secondBase = newBases.get(2) || new Set()
      const thirdBase = newBases.get(3) || new Set()
      
      // 既存のランナーを進塁させる
      firstBase.forEach(runnerId => {
        secondBase.add(runnerId)
      })
      secondBase.forEach(runnerId => {
        thirdBase.add(runnerId)
      })
      
      // 新しい打者を1塁に配置
      newBases.set(1, new Set([playerId]))
      newBases.set(2, secondBase)
      newBases.set(3, thirdBase)
    }
    // 本塁打、アウト、盗塁、犠打などはランナー状態に変化を与えない

    const newRunners = new Map(runners)
    newRunners.set(inningNumber, { bases: newBases })
    setRunners(newRunners)
  }

  const handleResultClick = (memberId: string, inningNumber: number, result: ResultType, rbi: number = 0, atBatIndex: number = 0) => {
    const allInningsInThisInning = memberStatsMap.get(memberId)?.filter(i => i.inningNumber === inningNumber) || []
    const currentInning = allInningsInThisInning[atBatIndex]
    let updatedInning: InningStats
    
    if (currentInning) {
      updatedInning = { ...currentInning }
    } else {
      updatedInning = {
        inningNumber,
        battingOrder: members.find(m => m.id === memberId)?.battingOrder,
        atBatNumber: atBatIndex + 1,
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
    }

    // リセット
    updatedInning.atBats = 0
    updatedInning.hits = 0
    updatedInning.walks = 0
    updatedInning.doubles = 0
    updatedInning.triples = 0
    updatedInning.homeRuns = 0
    updatedInning.stolenBases = 0
    updatedInning.sacrificeBunts = 0
    updatedInning.sacrificeFlies = 0
    updatedInning.errors = 0
    updatedInning.rbis = rbi

    // 結果に応じて更新
    if (result === 'out') {
      updatedInning.atBats = 1
    } else if (result === 'out-rbi') {
      // アウト（打点）：ゴロの間などでアウトだが打点がついた場合
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
      // 本塁打の場合は打者自身も得点
      updatedInning.runs = 1
      // 打点（RBI）はユーザーが選択した値を使用（手動入力）
      if (rbi > 0) {
        updatedInning.rbis = rbi
      }
    } else if (result === 'walk') {
      updatedInning.walks = 1
    } else if (result === 'stolen-base') {
      // 盗塁：既にベースに出ている選手のみカウント
      updatedInning.stolenBases = 1
      // ※ atBats: 0のまま（打数に含まない）
    } else if (result === 'sacrifice-bunt') {
      // 犠打：ランナーを進塁させるための打撃（打数に含まない）
      updatedInning.sacrificeBunts = 1
      // ※ atBats: 0のまま（打数に含まない）
    } else if (result === 'sacrifice-fly') {
      // 犠フライ：ランナーを帰塁させるための打撃（アウトなので打数には含まない）
      updatedInning.sacrificeFlies = 1
      // ※ atBats: 0のまま（アウトだが打数に含まない）
    } else if (result === 'error') {
      // エラー：相手のエラーで出塁（打数に含まない）
      updatedInning.errors = 1
      // ※ atBats: 0のまま（打数に含まない）
    } else if (result === 'dead-ball') {
      // デッドボール：死球で出塁（打数に含まない）
      updatedInning.deadBalls = 1
      updatedInning.walks = 1  // 四死球に含める
      // ※ atBats: 0のまま（打数に含まない）
    }

    // memberStatsMapを更新
    const playerInnings = [...(memberStatsMap.get(memberId) || [])]
    const otherInnings = playerInnings.filter(i => !(i.inningNumber === inningNumber))
    const updatedInningsList = [...otherInnings, ...allInningsInThisInning.slice(0, atBatIndex), updatedInning, ...allInningsInThisInning.slice(atBatIndex + 1)]
    
    if (result === '') {
      // 結果をクリア
      const filtered = playerInnings.filter(i => !(i.inningNumber === inningNumber && i.atBatNumber === (atBatIndex + 1)))
      setMemberStatsMap(new Map(memberStatsMap.set(memberId, filtered)))
      const updatedPlayerStats: PlayerStats = {
        playerId: memberId,
        innings: filtered,
      }
      onUpdateStats(memberId, updatedPlayerStats)
      // ランナーからも削除
      updateRunners(inningNumber, memberId, '')
    } else {
      updatedInningsList.sort((a, b) => {
        if (a.inningNumber !== b.inningNumber) return a.inningNumber - b.inningNumber
        return (a.atBatNumber || 1) - (b.atBatNumber || 1)
      })
      setMemberStatsMap(new Map(memberStatsMap.set(memberId, updatedInningsList)))
      
      const updatedPlayerStats: PlayerStats = {
        playerId: memberId,
        innings: updatedInningsList,
      }
      onUpdateStats(memberId, updatedPlayerStats)
      // ランナーを更新（ヒット結果を記録）
      updateRunners(inningNumber, memberId, result)
      
      // ヒット系の結果の場合、ランナーを進塁させて得点を計算
      let bases = 0
      if (result === 'single') bases = 1
      else if (result === 'double') bases = 2
      else if (result === 'triple') bases = 3
      else if (result === 'homerun') bases = 4
      
      if (bases > 0) {
        const scoredPlayers = advanceRunners(inningNumber, bases)
        
        // 得点したランナーの成績を更新
        scoredPlayers.forEach(runnerId => {
          const runnerInnings = [...(memberStatsMap.get(runnerId) || [])]
          const runnerInningIndex = runnerInnings.findIndex(i => i.inningNumber === inningNumber)
          if (runnerInningIndex >= 0) {
            const runnerInning = { ...runnerInnings[runnerInningIndex] }
            runnerInning.runs += 1
            runnerInnings[runnerInningIndex] = runnerInning
            setMemberStatsMap(new Map(memberStatsMap.set(runnerId, runnerInnings)))
            const updatedRunnerStats: PlayerStats = {
              playerId: runnerId,
              innings: runnerInnings,
            }
            onUpdateStats(runnerId, updatedRunnerStats)
          }
        })
        
        // 三塁打で打者自身も得点
        if (result === 'triple') {
          updatedInning.runs = 1
        }
        
        // 打点（RBI）はユーザーが入力した値を使用
        if (rbi > 0) {
          updatedInning.rbis = rbi
        }
      } else if (result === 'error') {
        // エラー：打者が1塁に出る、既存のランナーも進塁して得点する可能性
        const inningRunners = runners.get(inningNumber)
        if (inningRunners) {
          const thirdBase = inningRunners.bases.get(3) || new Set()
          // 3塁ランナーは得点
          thirdBase.forEach(runnerId => {
            const runnerInnings = [...(memberStatsMap.get(runnerId) || [])]
            const runnerInningIndex = runnerInnings.findIndex(i => i.inningNumber === inningNumber)
            if (runnerInningIndex >= 0) {
              const runnerInning = { ...runnerInnings[runnerInningIndex] }
              runnerInning.runs += 1
              runnerInnings[runnerInningIndex] = runnerInning
              setMemberStatsMap(new Map(memberStatsMap.set(runnerId, runnerInnings)))
              const updatedRunnerStats: PlayerStats = {
                playerId: runnerId,
                innings: runnerInnings,
              }
              onUpdateStats(runnerId, updatedRunnerStats)
            }
          })
        }
        
        // ランナーを更新（エラーで打者が1塁に出て、既存のランナーが進塁）
        updateRunners(inningNumber, memberId, result)
      } else {
        // その他の結果（盗塁、犠打など）
        updateRunners(inningNumber, memberId, result)
      }
    }
  }

  const handleAddAtBat = (memberId: string, inningNumber: number) => {
    // 複数打席が追加可能かチェック
    if (!canAddAnotherAtBat(inningNumber, memberId)) {
      return
    }
    
    const playerInnings = [...(memberStatsMap.get(memberId) || [])]
    const allInningsInThisInning = playerInnings.filter(i => i.inningNumber === inningNumber)
    const nextAtBatNumber = (Math.max(...allInningsInThisInning.map(i => i.atBatNumber || 1), 0) || 0) + 1
    
    const newInning: InningStats = {
      inningNumber,
      battingOrder: members.find(m => m.id === memberId)?.battingOrder,
      atBatNumber: nextAtBatNumber,
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
    
    playerInnings.push(newInning)
    playerInnings.sort((a, b) => {
      if (a.inningNumber !== b.inningNumber) return a.inningNumber - b.inningNumber
      return (a.atBatNumber || 1) - (b.atBatNumber || 1)
    })
    
    setMemberStatsMap(new Map(memberStatsMap.set(memberId, playerInnings)))
    const updatedPlayerStats: PlayerStats = {
      playerId: memberId,
      innings: playerInnings,
    }
    onUpdateStats(memberId, updatedPlayerStats)
  }

  const handleRemoveAtBat = (memberId: string, inningNumber: number, atBatIndex: number) => {
    const playerInnings = [...(memberStatsMap.get(memberId) || [])]
    const allInningsInThisInning = playerInnings.filter(i => i.inningNumber === inningNumber)
    
    if (allInningsInThisInning.length <= 1) {
      return // 最後の打席は削除できない
    }

    // 削除対象の打席を取り除く
    const filtered = playerInnings.filter(i => !(i.inningNumber === inningNumber && i.atBatNumber === (atBatIndex + 1)))
    
    setMemberStatsMap(new Map(memberStatsMap.set(memberId, filtered)))
    const updatedPlayerStats: PlayerStats = {
      playerId: memberId,
      innings: filtered,
    }
    onUpdateStats(memberId, updatedPlayerStats)
  }

  const handleUpdateStolenBases = (memberId: string, inningNumber: number, delta: number) => {
    const playerInnings = [...(memberStatsMap.get(memberId) || [])]
    const allInningsInThisInning = playerInnings.filter(i => i.inningNumber === inningNumber)
    
    if (allInningsInThisInning.length === 0) return
    
    const targetInning = allInningsInThisInning[0]
    const newStolenBases = Math.max(0, Math.min(3, targetInning.stolenBases + delta))
    
    const updated = playerInnings.map(i =>
      i.inningNumber === inningNumber && (i.atBatNumber || 1) === (targetInning.atBatNumber || 1)
        ? { ...i, stolenBases: newStolenBases }
        : i
    )
    
    setMemberStatsMap(new Map(memberStatsMap.set(memberId, updated)))
    const updatedPlayerStats: PlayerStats = {
      playerId: memberId,
      innings: updated,
    }
    onUpdateStats(memberId, updatedPlayerStats)
  }

  const getMembersByBattingOrder = (): Member[] => {
    if (!members || members.length === 0) return []
    return members
      .filter(m => m && m.battingOrder && m.battingOrder >= 1 && m.battingOrder <= 9)
      .sort((a, b) => (a.battingOrder || 0) - (b.battingOrder || 0))
  }

  const getTotalAtBats = (memberId: string): number => {
    const playerInnings = memberStatsMap.get(memberId) || []
    return playerInnings.reduce((sum, i) => sum + i.atBats, 0)
  }

  const getTotalHits = (memberId: string): number => {
    const playerInnings = memberStatsMap.get(memberId) || []
    return playerInnings.reduce((sum, i) => sum + i.hits, 0)
  }

  const getTotalWalks = (memberId: string): number => {
    const playerInnings = memberStatsMap.get(memberId) || []
    return playerInnings.reduce((sum, i) => sum + i.walks, 0)
  }

  const getTotalRBIs = (memberId: string): number => {
    const playerInnings = memberStatsMap.get(memberId) || []
    return playerInnings.reduce((sum, i) => sum + i.rbis, 0)
  }

  const getBattingAverage = (memberId: string): string => {
    const atBats = getTotalAtBats(memberId)
    const hits = getTotalHits(memberId)
    if (atBats === 0) return '.---'
    return (hits / atBats).toFixed(3)
  }

  return (
    <div className="inning-by-inning-container">
      <div className="stats-table-wrapper">
        <h3>成績入力</h3>
        
        {/* ランナー情報 */}
        <div className="inning-info-bar">
          <div className="info-text">
            <span>左のセルをクリックして結果を選択してください</span>
          </div>
        </div>
        
        <table className="stats-table">
          <thead>
            <tr>
              <th className="header-batting-order">打順</th>
              <th className="header-name">選手名</th>
              {Array.from({ length: maxInnings }, (_, i) => (
                <th key={i + 1} className="header-inning">第{i + 1}回</th>
              ))}
              <th className="header-stat">打数</th>
              <th className="header-stat">安打</th>
              <th className="header-stat">四球</th>
              <th className="header-stat">打点</th>
              <th className="header-stat">打率</th>
            </tr>
          </thead>
          <tbody>
            {getMembersByBattingOrder().map((member) => (
              <tr key={member.id} className="player-row">
                <td className="cell-batting-order">{member.battingOrder || '-'}</td>
                <td className="cell-name">{member.name}</td>
                {Array.from({ length: maxInnings }, (_, i) => {
                  const inningNumber = i + 1
                  const inning = getInningStats(member.id, inningNumber)
                  const allInnings = getAllInningStats(member.id, inningNumber)
                  const isClosed = isInningClosed(inningNumber, member.battingOrder || 0)
                  const hasMultipleAtBats = allInnings.length > 1
                  
                  return (
                    <td
                      key={inningNumber}
                      className={`cell-result ${isClosed ? 'closed' : ''} ${hasMultipleAtBats ? 'multiple' : ''}`}
                    >
                      <ResultSelector
                        memberId={member.id}
                        member={member}
                        inningNumber={inningNumber}
                        inning={inning}
                        allInnings={allInnings}
                        onSelect={(result, rbi, atBatIndex) => handleResultClick(member.id, inningNumber, result, rbi, atBatIndex)}
                        onAddAtBat={() => handleAddAtBat(member.id, inningNumber)}
                        onRemoveAtBat={(atBatIndex) => handleRemoveAtBat(member.id, inningNumber, atBatIndex)}
                        onUpdateStolenBases={(delta) => handleUpdateStolenBases(member.id, inningNumber, delta)}
                        onOpenInputScreen={onOpenInputScreen}
                        isClosed={isClosed}
                        canAddAtBat={canAddAnotherAtBat(inningNumber, member.id)}
                      />
                    </td>
                  )
                })}
                <td className="cell-stat">{getTotalAtBats(member.id)}</td>
                <td className="cell-stat">{getTotalHits(member.id)}</td>
                <td className="cell-stat">{getTotalWalks(member.id)}</td>
                <td className="cell-stat">{getTotalRBIs(member.id)}</td>
                <td className="cell-stat">{getBattingAverage(member.id)}</td>
              </tr>
            ))}
            {/* 代打選手の行 */}
            {getSubstituteMembers().map((member) => (
              <tr key={`substitute-${member.id}`} className="player-row substitute-row">
                <td className="cell-batting-order">代</td>
                <td className="cell-name">
                  {member.name}
                  <button
                    className="btn-remove-substitute"
                    onClick={() => handleRemoveSubstitute(member.id)}
                    title="代打選手を削除"
                  >
                    ×
                  </button>
                </td>
                {Array.from({ length: maxInnings }, (_, i) => {
                  const inningNumber = i + 1
                  const inning = getInningStats(member.id, inningNumber)
                  const allInnings = getAllInningStats(member.id, inningNumber)
                  const isClosed = false  // 代打選手は3アウトでもグレーアウトしない
                  const hasMultipleAtBats = allInnings.length > 1
                  
                  return (
                    <td
                      key={inningNumber}
                      className={`cell-result ${isClosed ? 'closed' : ''} ${hasMultipleAtBats ? 'multiple' : ''}`}
                    >
                      <ResultSelector
                        memberId={member.id}
                        member={member}
                        inningNumber={inningNumber}
                        inning={inning}
                        allInnings={allInnings}
                        onSelect={(result, rbi, atBatIndex) => handleResultClick(member.id, inningNumber, result, rbi, atBatIndex)}
                        onAddAtBat={() => handleAddAtBat(member.id, inningNumber)}
                        onRemoveAtBat={(atBatIndex) => handleRemoveAtBat(member.id, inningNumber, atBatIndex)}
                        onUpdateStolenBases={(delta) => handleUpdateStolenBases(member.id, inningNumber, delta)}
                        onOpenInputScreen={onOpenInputScreen}
                        isClosed={isClosed}
                        canAddAtBat={canAddAnotherAtBat(inningNumber, member.id)}
                      />
                    </td>
                  )
                })}
                <td className="cell-stat">{getTotalAtBats(member.id)}</td>
                <td className="cell-stat">{getTotalHits(member.id)}</td>
                <td className="cell-stat">{getTotalWalks(member.id)}</td>
                <td className="cell-stat">{getTotalRBIs(member.id)}</td>
                <td className="cell-stat">{getBattingAverage(member.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 代打選手追加セクション */}
      <div className="substitute-actions">
        <select
          className="substitute-select"
          value=""
          onChange={(e) => {
            if (e.target.value) {
              handleAddSubstitute(e.target.value)
              e.target.value = ''
            }
          }}
        >
          <option value="">代打選手を追加</option>
          {getAvailableSubstitutes()
            .filter(m => !substituteMembers.has(m.id))
            .map(m => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </div>

      {members.length === 0 && (
        <p className="empty-message">メンバーを追加してください</p>
      )}

      {getMembersByBattingOrder().length === 0 && members.length > 0 && (
        <p className="empty-message">打順が設定されたメンバーがいません</p>
      )}
    </div>
  )
}

interface ResultSelectorProps {
  memberId: string
  member: Member
  inningNumber: number
  inning: InningStats | undefined
  allInnings: InningStats[]
  onSelect: (result: ResultType, rbi: number, atBatIndex: number) => void
  onAddAtBat: () => void
  onRemoveAtBat: (atBatIndex: number) => void
  onUpdateStolenBases: (delta: number) => void
  onOpenInputScreen?: (member: Member, inning: number) => void
  isClosed: boolean
  canAddAtBat: boolean
}

function ResultSelector({ member, inningNumber, inning, allInnings, onSelect, onAddAtBat, onRemoveAtBat, onUpdateStolenBases, onOpenInputScreen, isClosed, canAddAtBat }: ResultSelectorProps) {
  const [showRBISelect, setShowRBISelect] = useState(false)
  const [selectedResult, setSelectedResult] = useState<ResultType>('')
  const [selectedAtBatIndex, setSelectedAtBatIndex] = useState(0)
  const currentAtBat = allInnings && allInnings.length > 0 ? allInnings[0] : inning
  const hasMultipleAtBats = allInnings && allInnings.length > 1

  const handleResultChange = (result: ResultType, atBatIndex: number = 0) => {
    setSelectedResult(result)
    setSelectedAtBatIndex(atBatIndex)
    
    if (result === 'out' || result === 'walk' || result === '') {
      onSelect(result, 0, atBatIndex)
      setShowRBISelect(false)
    } else if (result === 'out-rbi') {
      // アウト（打点）は打点選択を表示
      setShowRBISelect(true)
    } else if (result === 'homerun') {
      setShowRBISelect(true)
    } else if (result === 'single' || result === 'double' || result === 'triple') {
      setShowRBISelect(true)
    } else if (result === 'sacrifice-bunt' || result === 'sacrifice-fly') {
      setShowRBISelect(true)
    } else {
      onSelect(result, 0, atBatIndex)
      setShowRBISelect(false)
    }
  }

  const handleRBISelect = (rbi: number) => {
    if (selectedResult) {
      onSelect(selectedResult, rbi, selectedAtBatIndex)
    }
    setShowRBISelect(false)
    setSelectedResult('')
  }

  const handleAddStolenBase = () => {
    if (!currentAtBat) return
    if (currentAtBat.stolenBases < 3) {
      onUpdateStolenBases(1)
    }
  }

  const handleRemoveStolenBase = () => {
    if (!currentAtBat || currentAtBat.stolenBases === 0) return
    onUpdateStolenBases(-1)
  }

  const displayText = currentAtBat ? getDisplayText(getResultLabelForSelector(currentAtBat), currentAtBat.rbis || 0) : '-'
  const currentResult = inning ? getResultLabelForSelector(inning) : ''

  // const handleCellClick = () => {
  //   if (onOpenInputScreen && !isClosed) {
  //     onOpenInputScreen(member, inningNumber)
  //   }
  // }

  return (
    <div className="result-selector">{/* onClick={handleCellClick} style={{ cursor: onOpenInputScreen && !isClosed ? 'pointer' : 'default' }} */}
      {showRBISelect ? (
        <div className="rbi-select-panel">
          <div className="rbi-label">打点数を選択</div>
          <div className="rbi-buttons">
            {[0, 1, 2, 3, 4].map((rbi) => (
              <button
                key={rbi}
                className="rbi-btn"
                onClick={() => handleRBISelect(rbi)}
              >
                {rbi}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="result-display">
            {displayText}
            {hasMultipleAtBats && <span className="multi-badge">{allInnings.length}</span>}
          </div>
          {hasMultipleAtBats ? (
            <div className="multi-selects">
              {allInnings.map((atBat, index) => {
                const atBatResult = getResultLabelForSelector(atBat)
                const atBatLabel = index === 0 ? '1打席目' : index === 1 ? '2打席目' : index === 2 ? '3打席目' : `${index + 1}打席目`
                return (
                  <div key={index} className="multi-select-item">
                    <span className="atbat-label">{atBatLabel}</span>
                    <select
                      value={atBatResult}
                      onChange={(e) => handleResultChange(e.target.value as ResultType, index)}
                      className="result-select result-select-multi"
                      disabled={isClosed}
                    >
                      <option value="">-</option>
                      <option value="out">O (アウト)</option>
                      <option value="out-rbi">OR (アウト・打点)</option>
                      <option value="single">一 (単打)</option>
                      <option value="double">二 (二塁打)</option>
                      <option value="triple">三 (三塁打)</option>
                      <option value="homerun">H (本塁打)</option>
                      <option value="walk">四 (四球)</option>
                      <option value="sacrifice-bunt">SH (犠打)</option>
                      <option value="sacrifice-fly">SF (犠フライ)</option>
                      <option value="error">E (相手エラー)</option>
                      <option value="dead-ball">DB (デッドボール)</option>
                    </select>
                    {allInnings.length > 1 && (
                      <button
                        className="btn-remove-atbat"
                        onClick={() => onRemoveAtBat(index)}
                        title="この打席を削除"
                      >
                        −
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <select
              value={currentResult}
              onChange={(e) => handleResultChange(e.target.value as ResultType, 0)}
              className="result-select"
              disabled={isClosed}
            >
              <option value="">-</option>
              <option value="out">O (アウト)</option>
              <option value="out-rbi">OR (アウト・打点)</option>
              <option value="single">一 (単打)</option>
              <option value="double">二 (二塁打)</option>
              <option value="triple">三 (三塁打)</option>
              <option value="homerun">H (本塁打)</option>
              <option value="walk">四 (四球)</option>
              <option value="sacrifice-bunt">SH (犠打)</option>
              <option value="sacrifice-fly">SF (犠フライ)</option>
              <option value="error">E (相手エラー)</option>
              <option value="dead-ball">DB (デッドボール)</option>
            </select>
          )}
          <div className="result-actions">
            {!isClosed && canAddAtBat && (
              <button
                className="btn-add-atbat"
                onClick={onAddAtBat}
                title="この回での次の打席を追加"
              >
                +
              </button>
            )}
            <div className="stolen-base-controls">
              <button
                className="btn-stolen-base"
                onClick={handleAddStolenBase}
                disabled={isClosed || !currentAtBat || currentAtBat.stolenBases >= 3}
                title="盗塁を追加（最大3）"
              >
                🏃 {currentAtBat?.stolenBases || 0}
              </button>
              {currentAtBat && currentAtBat.stolenBases > 0 && (
                <button
                  className="btn-stolen-base-remove"
                  onClick={handleRemoveStolenBase}
                  disabled={isClosed}
                  title="盗塁を削除"
                >
                  −
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function getDisplayText(result: ResultType, rbi: number): string {
  const resultMap: Record<ResultType, string> = {
    out: 'O',
    'out-rbi': 'OR',
    single: '1H',
    double: '2H',
    triple: '3H',
    homerun: 'HR',
    walk: '四',
    'stolen-base': 'SB',
    'sacrifice-bunt': '犠打',
    'sacrifice-fly': '犠飛',
    error: 'E',
    'dead-ball': 'DB',
    '': '-',
  }
  
  const resultText = resultMap[result] || '-'
  
  // ヒット系や犠打・犠飛、アウト(打点)の場合、打点があれば表示
  const hasRBI = ['single', 'double', 'triple', 'homerun', 'sacrifice-bunt', 'sacrifice-fly', 'out-rbi'].includes(result)
  if (hasRBI && rbi > 0) {
    return `${resultText}(${rbi})`
  }
  
  return resultText
}

function getResultLabelForSelector(inning: InningStats): ResultType {
  if (inning.walks > 0 && inning.deadBalls === 0) return 'walk'
  if (inning.deadBalls > 0) return 'dead-ball'
  if (inning.stolenBases > 0) return 'stolen-base'
  if (inning.sacrificeBunts > 0) return 'sacrifice-bunt'
  if (inning.sacrificeFlies > 0) return 'sacrifice-fly'
  if (inning.errors > 0) return 'error'
  if (inning.homeRuns > 0) return 'homerun'
  if (inning.triples > 0) return 'triple'
  if (inning.doubles > 0) return 'double'
  if (inning.hits > 0) return 'single'
  if (inning.atBats > 0 && inning.rbis > 0) return 'out-rbi'
  if (inning.atBats > 0) return 'out'
  return ''
}
