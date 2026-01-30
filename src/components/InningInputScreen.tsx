import { useState } from 'react'
import type { Member, HitDirection } from '../types'
import '../styles/InningInputScreen.css'

type ResultType = 'out' | 'out-rbi' | 'single' | 'double' | 'triple' | 'homerun' | 'walk' | 'stolen-base' | 'sacrifice-bunt' | 'sacrifice-fly' | 'error' | 'dead-ball' | ''

interface InningInputScreenProps {
  member: Member
  inningNumber: number
  onSave: (result: ResultType, hitDirection: HitDirection, rbi: number) => void
  onCancel: () => void
}

export default function InningInputScreen({
  member,
  inningNumber,
  onSave,
  onCancel,
}: InningInputScreenProps) {
  const [selectedResult, setSelectedResult] = useState<ResultType>('')
  const [selectedDirection, setSelectedDirection] = useState<HitDirection>('')
  const [rbiCount, setRbiCount] = useState<number>(0)

  const resultOptions: { value: ResultType; label: string; needsDirection: boolean }[] = [
    { value: 'out', label: 'アウト', needsDirection: true },
    { value: 'out-rbi', label: 'アウト（打点）', needsDirection: true },
    { value: 'single', label: '単打', needsDirection: true },
    { value: 'double', label: '二塁打', needsDirection: true },
    { value: 'triple', label: '三塁打', needsDirection: true },
    { value: 'homerun', label: 'ホームラン', needsDirection: true },
    { value: 'walk', label: '四球', needsDirection: false },
    { value: 'dead-ball', label: '死球', needsDirection: false },
    { value: 'sacrifice-bunt', label: '犠バント', needsDirection: false },
    { value: 'sacrifice-fly', label: '犠飛', needsDirection: true },
    { value: 'error', label: 'エラー', needsDirection: true },
    { value: 'stolen-base', label: '盗塁', needsDirection: false },
  ]

  const directionOptions: { value: HitDirection; label: string }[] = [
    { value: 'left', label: 'レフト' },
    { value: 'left-center', label: 'レフセン' },
    { value: 'center', label: 'センター' },
    { value: 'right-center', label: 'ライトセン' },
    { value: 'right', label: 'ライト' },
  ]

  const handleResultChange = (result: ResultType) => {
    setSelectedResult(result)
    // 打球方向が不要な結果の場合は方向をリセット
    const option = resultOptions.find(opt => opt.value === result)
    if (option && !option.needsDirection) {
      setSelectedDirection('')
    }
  }

  const handleSave = () => {
    if (!selectedResult) {
      alert('結果を選択してください')
      return
    }

    const option = resultOptions.find(opt => opt.value === selectedResult)
    if (option?.needsDirection && !selectedDirection) {
      alert('打球方向を選択してください')
      return
    }

    onSave(selectedResult, selectedDirection, rbiCount)
  }

  const needsDirection = resultOptions.find(opt => opt.value === selectedResult)?.needsDirection || false

  return (
    <div className="inning-input-screen">
      <div className="input-header">
        <button className="back-button" onClick={onCancel}>
          ← 戻る
        </button>
        <h2>{member.name} - {inningNumber}回</h2>
      </div>

      <div className="input-content">
        <section className="result-section">
          <h3>結果を選択</h3>
          <div className="result-grid">
            {resultOptions.map((option) => (
              <button
                key={option.value}
                className={`result-button ${selectedResult === option.value ? 'selected' : ''}`}
                onClick={() => handleResultChange(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {needsDirection && (
          <section className="direction-section">
            <h3>打球方向</h3>
            <div className="direction-grid">
              {directionOptions.map((option) => (
                <button
                  key={option.value}
                  className={`direction-button ${selectedDirection === option.value ? 'selected' : ''}`}
                  onClick={() => setSelectedDirection(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {(selectedResult === 'out-rbi' || selectedResult === 'single' || selectedResult === 'double' || 
          selectedResult === 'triple' || selectedResult === 'homerun' || selectedResult === 'sacrifice-fly') && (
          <section className="rbi-section">
            <h3>打点</h3>
            <div className="rbi-input">
              <button 
                className="rbi-button"
                onClick={() => setRbiCount(Math.max(0, rbiCount - 1))}
              >
                -
              </button>
              <span className="rbi-count">{rbiCount}</span>
              <button 
                className="rbi-button"
                onClick={() => setRbiCount(rbiCount + 1)}
              >
                +
              </button>
            </div>
          </section>
        )}

        <div className="action-buttons">
          <button className="cancel-button" onClick={onCancel}>
            キャンセル
          </button>
          <button className="save-button" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
