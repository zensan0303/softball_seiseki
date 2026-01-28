import type { PlayerOverallStats } from '../types'
import '../styles/StatsDisplay.css'

interface StatsDisplayProps {
  playerStats: PlayerOverallStats[]
  opponent: string
}

export default function StatsDisplay({ playerStats, opponent }: StatsDisplayProps) {
  const sortedStats = [...playerStats].sort((a, b) => b.totalHits - a.totalHits)

  const totalRuns = playerStats.reduce((sum, p) => sum + p.totalRuns, 0)

  return (
    <div className="stats-display">
      <h3>vs {opponent} 成績表</h3>

      <div className="team-summary">
        <div className="summary-item">
          <span className="label">得点</span>
          <span className="value">{totalRuns}</span>
        </div>
      </div>

      <div className="stats-table-container">
        <table className="stats-table">
          <thead>
            <tr>
              <th>選手名</th>
              <th>打数</th>
              <th>安打</th>
              <th>打率</th>
              <th>長打率</th>
              <th>出塁率</th>
              <th>OPS</th>
              <th>得点</th>
              <th>打点</th>
              <th>2B</th>
              <th>3B</th>
              <th>HR</th>
              <th>盗塁</th>
              <th>犠打</th>
              <th>犠フライ</th>
              <th>エラー</th>
            </tr>
          </thead>
          <tbody>
            {sortedStats.map((stat) => (
              <tr key={stat.playerId}>
                <td className="player-name">{stat.name}</td>
                <td>{stat.totalAtBats}</td>
                <td>{stat.totalHits}</td>
                <td className="highlight">{stat.battingAverage.toFixed(3)}</td>
                <td className="highlight">{stat.sluggingPercentage.toFixed(3)}</td>
                <td className="highlight">{stat.onBasePercentage.toFixed(3)}</td>
                <td className="highlight-ops">{stat.ops.toFixed(3)}</td>
                <td>{stat.totalRuns}</td>
                <td>{stat.totalRbis}</td>
                <td>{stat.totalDoubles}</td>
                <td>{stat.totalTriples}</td>
                <td>{stat.totalHomeRuns}</td>
                <td>{stat.totalStolenBases}</td>
                <td>{stat.totalSacrificeBunts}</td>
                <td>{stat.totalSacrificeFlies}</td>
                <td>{stat.totalErrors}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedStats.length === 0 && (
        <p className="empty-message">成績がまだ入力されていません</p>
      )}

      <div className="stats-legend">
        <h4>統計値の説明</h4>
        <ul>
          <li><strong>打率</strong>: 安打 ÷ 打数</li>
          <li><strong>長打率</strong>: 塁打 ÷ 打数</li>
          <li><strong>出塁率</strong>: (安打 + 四死球) ÷ (打数 + 四死球)</li>
          <li><strong>OPS</strong>: 長打率 + 出塁率</li>
          <li><strong>盗塁</strong>: ランナーが盗塁で出塁した数</li>
          <li><strong>犠打</strong>: ランナーを進塁させるために報告された犠打</li>
          <li><strong>犠フライ</strong>: ランナーを帰塁させるために打たれた犠フライ</li>
          <li><strong>エラー</strong>: 相手チームのエラーで出塁した数</li>
        </ul>
      </div>
    </div>
  )
}
