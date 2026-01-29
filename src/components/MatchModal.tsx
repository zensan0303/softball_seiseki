import { useState } from 'react'
import '../styles/MatchModal.css'

interface MatchModalProps {
  isOpen: boolean
  onSubmit: (opponent: string, date: string) => void
  onClose: () => void
}

export default function MatchModal({ isOpen, onSubmit, onClose }: MatchModalProps) {
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (opponent.trim() && date) {
      onSubmit(opponent, date)
      setOpponent('')
      setDate('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>試合を追加</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="opponent">対戦相手</label>
            <input
              id="opponent"
              type="text"
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="対戦相手を入力"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">日付</label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-submit">追加</button>
            <button type="button" className="btn-cancel" onClick={onClose}>キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  )
}
