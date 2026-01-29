import type { PlayerStats, PlayerOverallStats, HitDirection } from '../types'

// 打球方向の統計
export interface HitDirectionStats {
  total: number
  left: number        // レフト方向（引っ張り - 右打者）
  center: number      // センター方向
  right: number       // ライト方向（流し - 右打者）
  leftCenter: number  // レフトセンター間
  rightCenter: number // ライトセンター間
  infield: number     // 内野
  pullRate: number    // 引っ張り率（右打者の場合）
  oppositeRate: number // 流し打ち率（右打者の場合）
  centerRate: number  // センター方向率
}

export const calculateHitDirectionStats = (stats: PlayerStats, isLeftHanded: boolean = false): HitDirectionStats => {
  const hitDirections: HitDirection[] = stats.innings
    .filter(inning => inning.hitDirection != null && (inning.hits > 0 || inning.sacrificeBunts > 0 || inning.sacrificeFlies > 0))
    .map(inning => inning.hitDirection!)

  const total = hitDirections.length
  
  if (total === 0) {
    return {
      total: 0,
      left: 0,
      center: 0,
      right: 0,
      leftCenter: 0,
      rightCenter: 0,
      infield: 0,
      pullRate: 0,
      oppositeRate: 0,
      centerRate: 0,
    }
  }

  const left = hitDirections.filter(d => d === 'left').length
  const center = hitDirections.filter(d => d === 'center').length
  const right = hitDirections.filter(d => d === 'right').length
  const leftCenter = hitDirections.filter(d => d === 'left-center').length
  const rightCenter = hitDirections.filter(d => d === 'right-center').length
  const infield = hitDirections.filter(d => ['pitcher', 'first', 'second', 'third', 'shortstop'].includes(d as string)).length

  // 右打者の場合：左方向が引っ張り、右方向が流し
  // 左打者の場合：右方向が引っ張り、左方向が流し
  let pullCount: number
  let oppositeCount: number
  
  if (isLeftHanded) {
    pullCount = right + rightCenter
    oppositeCount = left + leftCenter
  } else {
    pullCount = left + leftCenter
    oppositeCount = right + rightCenter
  }

  const centerCount = center

  return {
    total,
    left,
    center,
    right,
    leftCenter,
    rightCenter,
    infield,
    pullRate: total > 0 ? Math.round((pullCount / total) * 100) : 0,
    oppositeRate: total > 0 ? Math.round((oppositeCount / total) * 100) : 0,
    centerRate: total > 0 ? Math.round((centerCount / total) * 100) : 0,
  }
}

export const calculatePlayerStats = (stats: PlayerStats, isLeftHanded: boolean = false): Omit<PlayerOverallStats, 'playerId' | 'name'> => {
  // 全ての回の成績を合計
  const totals = stats.innings.reduce(
    (acc, inning) => ({
      atBats: acc.atBats + inning.atBats,
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

  const plateAppearances = totals.atBats + totals.walks

  // 塁打計算
  const avgBases = totals.hits + totals.doubles + totals.triples * 2 + totals.homeRuns * 3

  // 打率 (安打 / 打数)
  const battingAverage = totals.atBats > 0 ? Math.round((totals.hits / totals.atBats) * 10000) / 10000 : 0

  // 長打率 (塁打 / 打数)
  const sluggingPercentage = totals.atBats > 0 ? Math.round((avgBases / totals.atBats) * 10000) / 10000 : 0

  // 出塁率 ((安打 + 四死球) / (打数 + 四死球))
  const onBasePercentage = plateAppearances > 0
    ? Math.round(((totals.hits + totals.walks) / plateAppearances) * 10000) / 10000
    : 0

  // OPS (出塁率 + 長打率)
  const ops = Math.round((onBasePercentage + sluggingPercentage) * 10000) / 10000

  // 打球方向の統計を計算
  const hitDirectionStats = calculateHitDirectionStats(stats, isLeftHanded)

  return {
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
    hitDirectionTotal: hitDirectionStats.total,
    pullRate: hitDirectionStats.pullRate,
    oppositeRate: hitDirectionStats.oppositeRate,
    centerRate: hitDirectionStats.centerRate,
  }
}

export const aggregateStats = (allStats: PlayerStats[]): PlayerOverallStats[] => {
  const statsMap = new Map<string, PlayerStats>()

  // 同じプレイヤーの成績を集計
  allStats.forEach(stat => {
    const existing = statsMap.get(stat.playerId)
    if (existing) {
      statsMap.set(stat.playerId, {
        playerId: stat.playerId,
        innings: [...existing.innings, ...stat.innings],
      })
    } else {
      statsMap.set(stat.playerId, { ...stat })
    }
  })

  // 統計を計算
  return Array.from(statsMap.values()).map(stats => ({
    playerId: stats.playerId,
    name: '', // ここでは名前は別途取得する
    ...calculatePlayerStats(stats),
  }))
}
