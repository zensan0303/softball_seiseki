import { useState } from 'react'
import '../styles/AdminLogin.css'

interface AdminLoginProps {
  onLogin: (email: string, password: string) => Promise<void>
}

function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await onLogin(email, password)
    } catch (err: any) {
      console.error('ログインエラー:', err)
      let errorMessage = 'ログインに失敗しました'
      
      // Firebaseエラーコードに応じたメッセージ
      if (err.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'ユーザーが見つかりません'
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'パスワードが正しくありません'
      } else if (err.code === 'auth/invalid-credential') {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-login-overlay">
      <div className="admin-login-modal">
        <h2>管理者ログイン</h2>
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">メールアドレス</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={isLoading} className="login-button">
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        <div className="login-info">
          <p>※ 管理者アカウントでログインすると、選手情報や試合データを編集できます</p>
          <p>※ ログインしない場合は閲覧のみ可能です</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
