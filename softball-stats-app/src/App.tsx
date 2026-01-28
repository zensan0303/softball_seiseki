import { useState, useEffect } from 'react'
import type { Member } from './types'
import { initDB, getAllMembers, saveAllMembers } from './utils/indexedDB'
import './App.css'
import Calendar from './components/Calendar'

function App() {
  const [globalMembers, setGlobalMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // IndexedDBから選手情報を読み込み
  useEffect(() => {
    const loadMembers = async () => {
      try {
        await initDB()
        const members = await getAllMembers()
        setGlobalMembers(members)
      } catch (error) {
        console.error('Failed to initialize database:', error)
        // フォールバック：localStorageから復元
        const stored = localStorage.getItem('globalMembers')
        if (stored) {
          setGlobalMembers(JSON.parse(stored))
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()
  }, [])

  // 選手が変更されたときにIndexedDBに保存
  useEffect(() => {
    if (!isLoading && globalMembers.length > 0) {
      saveAllMembers(globalMembers).catch((error) => {
        console.error('Failed to save members:', error)
        // フォールバック：localStorageに保存
        localStorage.setItem('globalMembers', JSON.stringify(globalMembers))
      })
    }
  }, [globalMembers, isLoading])

  const addMember = (name: string) => {
    // 同名チェック
    if (globalMembers.some(m => m.name === name)) {
      alert(`「${name}」は既に登録されています`)
      return
    }
    
    const newMember: Member = {
      id: `member_${Date.now()}`,
      name,
    }
    setGlobalMembers([...globalMembers, newMember])
  }

  const removeMember = (memberId: string) => {
    setGlobalMembers(globalMembers.filter(m => m.id !== memberId))
  }

  if (isLoading) {
    return <div className="loading">読み込み中...</div>
  }

  return (
    <div className="app">
      <Calendar
        globalMembers={globalMembers}
        onAddMember={addMember}
        onRemoveMember={removeMember}
      />
    </div>
  )
}

export default App
