import type { PlayerStats, PlayerOverallStats } from '../types'

export const calculatePlayerStats = (stats: PlayerStats): Omit<PlayerOverallStats, 'playerId' | 'name'> => {
  // 全ての回の成績を合計
  const innings = stats?.innings || []
  const totals = innings.reduce(
    (acc, inning) => ({
      // 後方互換性: 旧データはエラー時 atBats=0, errors=1 で保存されている
      // 新データはエラー時 atBats=1, errors=1 なので、atBats===0 の場合のみ errors を加算する
      atBats: acc.atBats + inning.atBats + (inning.errors > 0 && inning.atBats === 0 ? inning.errors : 0),
      hits: acc.hits + inning.hits,
      walks: acc.walks + inning.walks,
      runs: acc.runs + inning.runs,
      rbis: acc.rbis + inning.rbis,
      doubles: acc.doubles + inning.doubles,
      triples: acc.triples + inning.triples,
      homeRuns: acc.homeRuns + inning.homeRuns,
      stolenBases: acc.stolenBases + inning.stolenBases,
      sacrificeBunts: acc.sacrificeBunts + inning.sacrificeBunts,
      sacrificeFlies: acc.sacrificeFlies + inning.sacrificeFlies,
      errors: acc.errors + inning.errors,
    }),
    { atBats: 0, hits: 0, walks: 0, runs: 0, rbis: 0, doubles: 0, triples: 0, homeRuns: 0, stolenBases: 0, sacrificeBunts: 0, sacrificeFlies: 0, errors: 0 }
  )

  // 打席数 = 打数 + 四死球 + 犠バント + 犠フライ（エラー出塁は打数に含まれる）
  const plateAppearances = totals.atBats + totals.walks + totals.sacrificeBunts + totals.sacrificeFlies

  // 塁打計算
  const avgBases = totals.hits + totals.doubles + totals.triples * 2 + totals.homeRuns * 3

  // 打率 (安打 / 打数)
  const battingAverage = totals.atBats > 0 ? Math.round((totals.hits / totals.atBats) * 10000) / 10000 : 0

  // 長打率 (塁打 / 打数)
  const sluggingPercentage = totals.atBats > 0 ? Math.round((avgBases / totals.atBats) * 10000) / 10000 : 0

  // 出塁率の分母 = 打数 + 四死球 + 犠フライ（犠バント・エラー出塁は分母に含まない）
  // 公式: OBP = (安打 + 四球 + 死球) / (打数 + 四球 + 死球 + 犠フライ)
  const obpDenominator = totals.atBats + totals.walks + totals.sacrificeFlies
  const onBasePercentage = obpDenominator > 0
    ? Math.round(((totals.hits + totals.walks) / obpDenominator) * 10000) / 10000
    : 0

  // OPS (出塁率 + 長打率)
  const ops = Math.round((onBasePercentage + sluggingPercentage) * 10000) / 10000

  return {
    plateAppearances,
    totalAtBats: totals.atBats,
    totalHits: totals.hits,
    totalWalks: totals.walks,
    totalRuns: totals.runs,
    totalRbis: totals.rbis,
    totalDoubles: totals.doubles,
    totalTriples: totals.triples,
    totalHomeRuns: totals.homeRuns,
    totalStolenBases: totals.stolenBases,
    totalSacrificeBunts: totals.sacrificeBunts,
    totalSacrificeFlies: totals.sacrificeFlies,
    totalErrors: totals.errors,
    avgBases,
    battingAverage,
    sluggingPercentage,
    onBasePercentage,
    ops,
  }
}

export const aggregateStats = (allStats: PlayerStats[]): PlayerOverallStats[] => {
  const statsMap = new Map<string, PlayerStats>()

  // 同じプレイヤーの成績を集計
  allStats.forEach(stat => {
    if (!stat || !stat.innings) return // 無効なデータはスキップ
    
    const existing = statsMap.get(stat.playerId)
    if (existing) {
      statsMap.set(stat.playerId, {
        playerId: stat.playerId,
        innings: [...(existing.innings || []), ...(stat.innings || [])],
      })
    } else {
      statsMap.set(stat.playerId, { ...stat })
    }
  })

  // 統計を計算
  return Array.from(statsMap.values())
    .filter(stats => stats && stats.innings) // 有効なデータのみ
    .map(stats => ({
      playerId: stats.playerId,
      name: '', // ここでは名前は別途取得する
      ...calculatePlayerStats(stats),
    }))
}
