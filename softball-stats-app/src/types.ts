// メンバー情報
export interface Member {
  id: string
  name: string
  battingOrder?: number  // 打順（1-9番）
}

// 回ごとの成績
export interface InningStats {
  inningNumber: number
  battingOrder?: number  // 打順（オプション）
  atBatNumber?: number   // 打席番号（同一回での複数打席に対応）
  substitutePlayerId?: string  // 代打選手のID
  atBats: number      // 打数
  hits: number        // 安打
  walks: number       // 四死球
  runs: number        // 得点
  rbis: number        // 打点
  doubles: number     // 二塁打
  triples: number     // 三塁打
  homeRuns: number    // 本塁打
  stolenBases: number // 盗塁
  sacrificeBunts: number  // 犠バント
  sacrificeFlies: number  // 犠フライ
  errors: number      // エラー
  deadBalls: number   // デッドボール（死球）
}

// 選手の個別成績（回ごと）
export interface PlayerStats {
  playerId: string
  innings: InningStats[]  // 各回の成績
}

// 試合情報
export interface Match {
  id: string
  date: string
  opponent: string
  members: Member[]
  stats: Map<string, PlayerStats>  // playerId -> PlayerStats
}

// 選手の総合統計
export interface PlayerOverallStats {
  playerId: string
  name: string
  totalAtBats: number
  totalHits: number
  totalWalks: number
  totalRuns: number
  totalRbis: number
  totalDoubles: number
  totalTriples: number
  totalHomeRuns: number
  totalStolenBases: number
  totalSacrificeBunts: number
  totalSacrificeFlies: number
  totalErrors: number
  avgBases: number  // 塁打
  
  // 計算される統計値
  battingAverage: number  // 打率 (安打 / 打数)
  sluggingPercentage: number  // 長打率 (塁打 / 打数)
  onBasePercentage: number  // 出塁率 ((安打 + 四死球) / (打数 + 四死球))
  ops: number  // OPS (出塁率 + 長打率)
}

// 試合統計サマリー
export interface MatchStats {
  matchId: string
  opponent: string
  date: string
  playerStats: PlayerOverallStats[]
  totalRuns: number
}
