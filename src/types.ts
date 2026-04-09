// 守備位置の型定義（ソフトボール）
export type FieldPosition =
  | 'P'   // 投手
  | 'C'   // 捕手
  | '1B'  // 一塁手
  | '2B'  // 二塁手
  | '3B'  // 三塁手
  | 'SS'  // 遊撃手
  | 'LF'  // 左翼手
  | 'CF'  // 中堅手
  | 'RF'  // 右翼手
  | 'DP'  // 指名選手（バッティング専門）
  | 'FP'  // 守備専門（打撃成績不要）
  | ''

// 守備位置の日本語ラベルマップ
export const FIELD_POSITION_LABELS: Record<string, string> = {
  P: '投',
  C: '捕',
  '1B': '一',
  '2B': '二',
  '3B': '三',
  SS: '遊',
  LF: '左',
  CF: '中',
  RF: '右',
  DP: 'DP',
  FP: 'FP',
  '': '-',
}

// メンバー情報
export interface Member {
  id: string
  name: string
  battingOrder?: number          // 打順（1-9番）
  fieldPosition?: FieldPosition  // 守備位置（DP/FP含む）
  fpActualPosition?: FieldPosition  // FP選手の実際の守備位置（P/C/1B等）
}

// 打球方向の型定義
export type HitDirection = 'left' | 'center' | 'right' | 'left-center' | 'right-center' | ''

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
  stolenBaseOuts: number  // 走塁死（盗塁失敗によるアウト）
  sacrificeBunts: number  // 犠バント
  sacrificeFlies: number  // 犠フライ
  errors: number      // エラー
  deadBalls: number   // デッドボール（死球）
  forcedWalks?: number      // 押し出しフォアボール
  forcedDeadBalls?: number  // 押し出しデッドボール
  battingInterference?: number  // 打撃妨害
  hitDirection?: HitDirection  // 打球方向
}

// 選手の個別成績（回ごと）
export interface PlayerStats {
  playerId: string
  innings: InningStats[]  // 各回の成績
  isSubstitute?: boolean  // 代打選手として登録されているか
}

// 試合結果
export type MatchResult = 'win' | 'loss' | 'draw'

// 試合情報
export interface Match {
  id: string
  date: string
  opponent: string
  result?: MatchResult    // 勝敗（勝/負/引）
  myScore?: number        // 自チーム得点
  opponentScore?: number  // 相手チーム得点
  members: Member[]
  stats: Map<string, PlayerStats>  // playerId -> PlayerStats
}

// 選手の総合統計
export interface PlayerOverallStats {
  playerId: string
  name: string
  plateAppearances: number  // 打席数 (PA = AB + BB + HBP + SH + SF)
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
