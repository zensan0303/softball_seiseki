import { useState } from 'react'
import type { HitDirection } from '../types'
import '../styles/FieldDiagram.css'

interface FieldDiagramProps {
  selectedDirection: HitDirection
  onSelect: (direction: HitDirection) => void
  mode?: 'all' | 'infield-only' // ヒットは全位置、アウトは内野のみ
}

export default function FieldDiagram({ selectedDirection, onSelect, mode = 'all' }: FieldDiagramProps) {
  const [hoveredPosition, setHoveredPosition] = useState<HitDirection>(null)

  const positions: Array<{ direction: HitDirection; label: string; x: number; y: number; isInfield: boolean }> = [
    { direction: 'left', label: 'レフト', x: 15, y: 30, isInfield: false },
    { direction: 'left-center', label: 'レフセン', x: 30, y: 20, isInfield: false },
    { direction: 'center', label: 'センター', x: 50, y: 10, isInfield: false },
    { direction: 'right-center', label: 'ライセン', x: 70, y: 20, isInfield: false },
    { direction: 'right', label: 'ライト', x: 85, y: 30, isInfield: false },
    { direction: 'third', label: '三塁', x: 25, y: 65, isInfield: true },
    { direction: 'shortstop', label: '遊撃', x: 40, y: 55, isInfield: true },
    { direction: 'second', label: '二塁', x: 60, y: 55, isInfield: true },
    { direction: 'first', label: '一塁', x: 75, y: 65, isInfield: true },
    { direction: 'pitcher', label: '投手', x: 50, y: 70, isInfield: true },
  ]

  // 表示するポジションをフィルタリング
  const displayPositions = mode === 'infield-only' 
    ? positions.filter(p => p.isInfield) 
    : positions

  return (
    <div className="field-diagram-container">
      <h4>{mode === 'infield-only' ? '守備位置を選択（アウト）' : '打球方向を選択'}</h4>
      <svg className="field-diagram" viewBox="0 0 100 100">
        {/* 外野フェンス（扇形） */}
        <path
          d="M 10 80 Q 10 15, 50 5 Q 90 15, 90 80"
          fill="#90EE90"
          stroke="#2d5016"
          strokeWidth="1"
          opacity={mode === 'infield-only' ? 0.3 : 1}
        />
        
        {/* 内野（ダイヤモンド） */}
        <path
          d="M 50 85 L 20 70 L 50 55 L 80 70 Z"
          fill="#e8d4a0"
          stroke="#8b7355"
          strokeWidth="0.5"
        />

        {/* ホームベース */}
        <circle cx="50" cy="85" r="2" fill="#fff" stroke="#000" strokeWidth="0.5" />

        {/* 各塁 */}
        <rect x="18" y="68" width="4" height="4" fill="#fff" stroke="#000" strokeWidth="0.5" />
        <rect x="48" y="53" width="4" height="4" fill="#fff" stroke="#000" strokeWidth="0.5" />
        <rect x="78" y="68" width="4" height="4" fill="#fff" stroke="#000" strokeWidth="0.5" />

        {/* 各ポジションのクリック可能エリア */}
        {displayPositions.map((pos) => {
          const isSelected = selectedDirection === pos.direction
          const isHovered = hoveredPosition === pos.direction
          
          return (
            <g key={pos.direction}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="8"
                fill={isSelected ? '#4CAF50' : isHovered ? '#81C784' : 'rgba(255, 255, 255, 0.3)'}
                stroke={isSelected ? '#2E7D32' : '#666'}
                strokeWidth="1"
                className="position-area"
                onClick={() => onSelect(pos.direction)}
                onMouseEnter={() => setHoveredPosition(pos.direction)}
                onMouseLeave={() => setHoveredPosition(null)}
                style={{ cursor: 'pointer' }}
              />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                fontSize="4"
                fill={isSelected ? '#fff' : '#333'}
                pointerEvents="none"
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {pos.label}
              </text>
            </g>
          )
        })}

        {/* ラベル */}
        <text x="50" y="97" textAnchor="middle" fontSize="4" fill="#666">
          ホーム
        </text>
      </svg>
      
      {selectedDirection && (
        <div className="selected-position">
          選択中: {positions.find(p => p.direction === selectedDirection)?.label}
          <button 
            className="clear-selection"
            onClick={() => onSelect(null)}
          >
            クリア
          </button>
        </div>
      )}
    </div>
  )
}
