import { useState, useEffect } from 'react'
import type { Member } from './types'
import { getAllMembers, saveAllMembers, watchMembers } from './utils/db'
import './App.css'
import Calendar from './components/Calendar'

function App() {
  const [globalMembers, setGlobalMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Firebaseから選手情報を読み込み
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    
    const loadMembers = async () => {
      try {
        const members = await getAllMembers()
        setGlobalMembers(members)
        
        // リアルタイム監視を設定（他のユーザーの変更を自動反映）
        unsubscribe = watchMembers((members) => {
          setGlobalMembers(members)
        })
      } catch (error) {
        console.error('Failed to load members from Firebase:', error)
        console.error('Error details:', error)
        alert('データベース接続エラー: Firebase設定を確認してください')
      } finally {
        setIsLoading(false)
      }
    }

    loadMembers()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

  // 選手が変更されたときにFirebaseに保存
  useEffect(() => {
    if (!isLoading) {
      saveAllMembers(globalMembers).catch((error) => {
        console.error('Failed to save members:', error)
        alert('データ保存エラー: もう一度お試しください')
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

  const updateMember = (member: Member) => {
    // 同名チェック（自分以外）
    if (globalMembers.some(m => m.id !== member.id && m.name === member.name)) {
      alert(`「${member.name}」は既に登録されています`)
      return false
    }
    setGlobalMembers(globalMembers.map(m => m.id === member.id ? member : m))
    return true
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
        onUpdateMember={updateMember}
      />
    </div>
  )
}

export default App
