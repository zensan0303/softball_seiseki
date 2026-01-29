import type { PlayerOverallStats } from '../types'
import '../styles/StatsDisplay.css'

interface StatsDisplayProps {
  playerStats: PlayerOverallStats[]
  opponent: string
}

export default function StatsDisplay({ playerStats, opponent }: StatsDisplayProps) {
  const sortedStats = [...playerStats].sort((a, b) => b.totalHits - a.totalHits)

  const totalRuns = playerStats.reduce((sum, p) => sum + p.totalRuns, 0)

  // 打球傾向の判定
  const getBattingTendency = (stat: PlayerOverallStats): string => {
    if (!stat.hitDirectionTotal || stat.hitDirectionTotal === 0) {
      return '-'
    }
    
    const pullRate = stat.pullRate || 0
    const oppositeRate = stat.oppositeRate || 0
    const centerRate = stat.centerRate || 0
    
    if (pullRate > oppositeRate + 15) {
      return '引っ張りタイプ'
    } else if (oppositeRate > pullRate + 15) {
      return '流し打ちタイプ'
    } else if (centerRate > 40) {
      return 'センター返しタイプ'
    } else {
      return 'バランス型'
    }
  }

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

      {/* 打球方向の特性表示 */}
      <div className="batting-tendency-section">
        <h4>打球方向の特性</h4>
        <div className="tendency-cards">
          {sortedStats
            .filter(stat => stat.hitDirectionTotal && stat.hitDirectionTotal > 0)
            .map((stat) => (
              <div key={stat.playerId} className="tendency-card">
                <div className="tendency-header">
                  <h5>{stat.name}</h5>
                  <span className="tendency-label">{getBattingTendency(stat)}</span>
                </div>
                <div className="tendency-stats">
                  <div className="tendency-bar-container">
                    <div className="tendency-bar-label">引っ張り</div>
                    <div className="tendency-bar">
                      <div 
                        className="tendency-bar-fill pull"
                        style={{ width: `${stat.pullRate}%` }}
                      />
                    </div>
                    <div className="tendency-bar-value">{stat.pullRate}%</div>
                  </div>
                  <div className="tendency-bar-container">
                    <div className="tendency-bar-label">センター</div>
                    <div className="tendency-bar">
                      <div 
                        className="tendency-bar-fill center"
                        style={{ width: `${stat.centerRate}%` }}
                      />
                    </div>
                    <div className="tendency-bar-value">{stat.centerRate}%</div>
                  </div>
                  <div className="tendency-bar-container">
                    <div className="tendency-bar-label">流し打ち</div>
                    <div className="tendency-bar">
                      <div 
                        className="tendency-bar-fill opposite"
                        style={{ width: `${stat.oppositeRate}%` }}
                      />
                    </div>
                    <div className="tendency-bar-value">{stat.oppositeRate}%</div>
                  </div>
                  <div className="tendency-sample-size">
                    データ数: {stat.hitDirectionTotal}打席
                  </div>
                </div>
              </div>
            ))}
        </div>
        {sortedStats.every(stat => !stat.hitDirectionTotal || stat.hitDirectionTotal === 0) && (
          <p className="empty-message">打球方向のデータがまだ入力されていません</p>
        )}
      </div>

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
          <li><strong>打球方向</strong>: 右打者の場合、引っ張り=左方向、流し=右方向</li>
        </ul>
      </div>
    </div>
  )
}
