import { useState, useEffect } from 'react'
import type { Member } from './types'
import { getAllMembers, saveAllMembers, watchMembers } from './utils/firebaseDB'
import { login, logout, onAuthChanged } from './utils/firebase'
import './App.css'
import Calendar from './components/Calendar'
import AdminLogin from './components/AdminLogin'

function App() {
  const [globalMembers, setGlobalMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthChanged((user) => {
      setIsAdmin(!!user)
      if (user) {
        setShowLoginModal(false)
      }
    })
    return unsubscribe
  }, [])

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

  // 選手が変更されたときにFirebaseに保存（管理者モードのみ）
  useEffect(() => {
    if (!isLoading && isAdmin) {
      saveAllMembers(globalMembers).catch((error) => {
        console.error('Failed to save members:', error)
        alert('データ保存エラー: もう一度お試しください')
      })
    }
  }, [globalMembers, isLoading, isAdmin])

  const addMember = (name: string) => {
    if (!isAdmin) {
      alert('編集権限がありません。管理者としてログインしてください。')
      return
    }
    
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
    if (!isAdmin) {
      alert('編集権限がありません。管理者としてログインしてください。')
      return
    }
    setGlobalMembers(globalMembers.filter(m => m.id !== memberId))
  }

  const updateMember = (member: Member) => {
    if (!isAdmin) {
      alert('編集権限がありません。管理者としてログインしてください。')
      return false
    }
    
    // 同名チェック（自分以外）
    if (globalMembers.some(m => m.id !== member.id && m.name === member.name)) {
      alert(`「${member.name}」は既に登録されています`)
      return false
    }
    setGlobalMembers(globalMembers.map(m => m.id === member.id ? member : m))
    return true
  }

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
  }

  const handleLogout = async () => {
    if (confirm('ログアウトしますか？')) {
      await logout()
    }
  }

  if (isLoading) {
    return <div className="loading">読み込み中...</div>
  }

  return (
    <div className="app">
      {showLoginModal && <AdminLogin onLogin={handleLogin} />}
      <div className="admin-bar">
        {isAdmin ? (
          <div className="admin-status">
            <span className="admin-badge">管理者モード</span>
            <button onClick={handleLogout} className="logout-button">
              ログアウト
            </button>
          </div>
        ) : (
          <button onClick={() => setShowLoginModal(true)} className="login-trigger-button">
            管理者ログイン
          </button>
        )}
      </div>
      <Calendar
        globalMembers={globalMembers}
        onAddMember={addMember}
        onRemoveMember={removeMember}
        onUpdateMember={updateMember}
        isAdmin={isAdmin}
      />
    </div>
  )
}

export default App
