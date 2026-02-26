import { useState } from 'react'
import type { Member } from '../types'
import '../styles/MemberList.css'

interface MemberListProps {
  members: Member[]
  globalMembers: Member[]
  onAddMember: (member: Member) => void
  onRemoveMember: (memberId: string) => void
  onAddNewMember: (name: string) => void
  onUpdateMember: (member: Member) => void
  onRemoveGlobalMember?: (memberId: string) => void
  onUpdateGlobalMember?: (member: Member) => void
  isAdmin: boolean
}

export default function MemberList({
  members,
  globalMembers,
  onAddMember,
  onRemoveMember,
  onAddNewMember,
  onUpdateMember,
  onRemoveGlobalMember,
  onUpdateGlobalMember,
  isAdmin,
}: MemberListProps) {
  const [newMemberName, setNewMemberName] = useState('')
  const [showNewMemberForm, setShowNewMemberForm] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showGlobalMembers, setShowGlobalMembers] = useState(false)

  // メンバーを打順でマップ（打順 -> Member）
  const membersByOrder = new Map<number, Member>()
  const safeMembers = members || []
  safeMembers.forEach(m => {
    if (m.battingOrder && m.battingOrder >= 1 && m.battingOrder <= 9) {
      membersByOrder.set(m.battingOrder, m)
    }
  })

  // ベンチメンバー（打順10番以降）
  const benchMembers = safeMembers.filter(m => m.battingOrder && m.battingOrder >= 10)

  // 各打順で利用可能なメンバー（別の打順に割り当てられていない）
  const getAvailableMembersForOrder = (order: number) => {
    const assignedToOtherOrders = new Set<string>()
    membersByOrder.forEach((member, assignedOrder) => {
      if (assignedOrder !== order) {
        assignedToOtherOrders.add(member.id)
      }
    })
    
    // ベンチメンバーも除外
    benchMembers.forEach(m => {
      assignedToOtherOrders.add(m.id)
    })
    
    // グローバルメンバーと現在のメンバーをマージして、重複を排除
    const allAvailableMembers = new Map<string, Member>()
    
    // グローバルメンバーを追加（スターターとベンチに割り当てられていないもの）
    globalMembers.forEach(m => {
      if (!assignedToOtherOrders.has(m.id)) {
        allAvailableMembers.set(m.id, m)
      }
    })
    
    // 次に、試合のメンバーで打順未設定または1-9以外のメンバーを追加
    safeMembers.forEach(m => {
      const isUnassigned = !m.battingOrder || m.battingOrder === 0 || m.battingOrder < 1 || m.battingOrder > 9
      if (isUnassigned && !assignedToOtherOrders.has(m.id)) {
        // グローバルメンバーの情報で上書き（存在する場合）
        const globalMember = globalMembers.find(gm => gm.id === m.id)
        if (globalMember) {
          allAvailableMembers.set(m.id, globalMember)
        } else {
          allAvailableMembers.set(m.id, m)
        }
      }
    })
    
    return Array.from(allAvailableMembers.values())
  }

  // ベンチメンバー用の利用可能メンバー
  const getAvailableBenchMembers = () => {
    const assigned = new Set<string>()
    membersByOrder.forEach(member => assigned.add(member.id))
    benchMembers.forEach(member => assigned.add(member.id))
    
    return globalMembers.filter(m => !assigned.has(m.id))
  }

  // ベンチメンバーを追加
  const handleAddBenchMember = (memberId: string) => {
    if (!memberId) return
    
    const member = globalMembers.find(m => m.id === memberId)
    if (!member) return
    
    // 次の利用可能な打順番号を取得（10番から開始）
    const existingBenchOrders = benchMembers.map(m => m.battingOrder || 10)
    const nextOrder = existingBenchOrders.length > 0 
      ? Math.max(...existingBenchOrders) + 1 
      : 10
    
    onAddMember({ ...member, battingOrder: nextOrder })
  }

  // ベンチメンバーを削除
  const handleRemoveBenchMember = (memberId: string) => {
    onRemoveMember(memberId)
  }

  const handleAssignMember = (battingOrder: number, memberId: string) => {
    if (!memberId) {
      // 割り当てを解除 → 打順未設定に戻すだけ（試合には残る・成績も保持）
      const member = membersByOrder.get(battingOrder)
      if (member) {
        onUpdateMember({ ...member, battingOrder: 0 })
      }
      return
    }

    // 現在のメンバーリストから探す
    let memberToAssign = members.find(m => m.id === memberId)
    
    // メンバーリストにない場合は、グローバルメンバーから取得して追加
    if (!memberToAssign) {
      const globalMember = globalMembers.find(m => m.id === memberId)
      if (globalMember) {
        // グローバルメンバーをマッチメンバーに追加し、打順を設定したバージョンを作成
        memberToAssign = { ...globalMember, battingOrder }
        onAddMember(memberToAssign)
        return
      }
    }

    if (memberToAssign) {
      // 既に別の打順に割り当てられている場合は、その打順から解除
      membersByOrder.forEach((m, order) => {
        if (m.id === memberId && order !== battingOrder) {
          onUpdateMember({ ...m, battingOrder: undefined })
        }
      })

      // 新しい割り当て
      onUpdateMember({ ...memberToAssign, battingOrder })
    }
  }

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMemberName.trim()) {
      // グローバルメンバーと現在のメンバー両方で同名チェック
      if (globalMembers.some(m => m.name === newMemberName)) {
        alert(`「${newMemberName}」は既に登録されています`)
        return
      }
      if (members.some(m => m.name === newMemberName)) {
        alert(`「${newMemberName}」は既に登録されています`)
        return
      }
      
      onAddNewMember(newMemberName)
      setNewMemberName('')
      setShowNewMemberForm(false)
    }
  }

  return (
    <div className="member-list">
      <div className="member-list-header">
        <h3>スタメン登録（打順設定）</h3>
      </div>

      <div className="new-member-section">
        {isAdmin && (
          <>
            <button
              className="btn-add-new-member"
              onClick={() => setShowNewMemberForm(!showNewMemberForm)}
            >
              {showNewMemberForm ? 'キャンセル' : '＋ 新規選手を追加'}
            </button>

            <button
              className="btn-manage-members"
              onClick={() => setShowGlobalMembers(!showGlobalMembers)}
            >
              {showGlobalMembers ? '✕ 閉じる' : '⚙️ 登録済み選手を編集'}
            </button>
          </>
        )}

        {showNewMemberForm && (
          <form className="new-member-form" onSubmit={handleAddNewMember}>
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="新しい選手名"
              required
              autoFocus
            />
            <button type="submit" className="btn-submit">追加</button>
          </form>
        )}
      </div>

      {showGlobalMembers && (
        <div className="global-members-section">
          <h4>登録済み選手を管理</h4>
          <div className="global-members-list">
            {globalMembers.length === 0 ? (
              <p className="empty-text">登録済み選手がありません</p>
            ) : (
              globalMembers.map((member) => (
                <div key={member.id} className="global-member-item">
                  {editingMemberId === member.id ? (
                    <div className="member-edit-form">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        placeholder="選手名"
                        autoFocus
                      />
                      <button
                        className="btn-save"
                        onClick={() => {
                          if (editingName.trim() && editingName !== member.name) {
                            // 同名チェック
                            if (globalMembers.some(m => m.id !== member.id && m.name === editingName)) {
                              alert(`「${editingName}」は既に登録されています`)
                              return
                            }
                            onUpdateGlobalMember?.({ ...member, name: editingName })
                          }
                          setEditingMemberId(null)
                        }}
                      >
                        保存
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingMemberId(null)}
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="member-name">{member.name}</span>
                      <div className="member-actions">
                        <button
                          className="btn-edit"
                          onClick={() => {
                            setEditingMemberId(member.id)
                            setEditingName(member.name)
                          }}
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => {
                            if (window.confirm(`「${member.name}」を削除しますか？`)) {
                              onRemoveGlobalMember?.(member.id)
                            }
                          }}
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 打順未設定のメンバー */}
      {safeMembers.filter(m => !m.battingOrder || m.battingOrder === 0 || m.battingOrder < 1 || m.battingOrder > 9).length > 0 && (
        <div className="unassigned-members">
          <h4>打順未設定のメンバー</h4>
          <div className="unassigned-list">
            {safeMembers
              .filter(m => !m.battingOrder || m.battingOrder === 0 || m.battingOrder < 1 || m.battingOrder > 9)
              .map(m => (
                <div key={m.id} className="unassigned-member">
                  <span>{m.name}</span>
                  {isAdmin && (
                    <button
                      className="btn-remove"
                      onClick={() => {
                        if (window.confirm(`「${m.name}」をこの試合から削除しますか？\n（入力済みの成績も削除されます）`)) {
                          onRemoveMember(m.id)
                        }
                      }}
                      title="試合から削除（成績も削除）"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="batting-order-grid">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((order) => {
          const member = membersByOrder.get(order)
          const availableMembers = getAvailableMembersForOrder(order)
          
          // 現在選択されているメンバーが利用可能なメンバーに含まれていない場合は追加
          const membersToShow = [...availableMembers]
          if (member && !membersToShow.find(m => m.id === member.id)) {
            membersToShow.push(member)
          }

          return (
            <div key={order} className="batting-order-slot">
              <div className="order-number">第{order}番</div>
              {member ? (
                <div className="member-display">
                  <span className="member-name-display">{member.name}</span>
                  {isAdmin && (
                    <button
                      className="btn-remove-member"
                      onClick={() => handleAssignMember(order, '')}
                      title="打順から外す（選手・成績は残ります）"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : isAdmin ? (
                <select
                  className="member-select"
                  value=""
                  onChange={(e) => handleAssignMember(order, e.target.value)}
                >
                  <option value="">-- 選手を選択 --</option>
                  {membersToShow.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="empty-slot">未設定</div>
              )}
            </div>
          )
        })}
      </div>

      {/* ベンチメンバーセクション */}
      <div className="bench-members-section">
        <h4>⚾ ベンチメンバー</h4>
        {isAdmin && (
          <select
            className="bench-select"
            value=""
            onChange={(e) => {
              handleAddBenchMember(e.target.value)
              e.target.value = ''
            }}
          >
            <option value="">ベンチメンバーを追加...</option>
            {getAvailableBenchMembers().map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
        
        <div className="bench-members-list">
          {benchMembers.map((member) => (
            <div key={member.id} className="bench-member-item">
              <div className="bench-member-info">
                <span className="bench-order-badge">{member.battingOrder}</span>
                <span className="bench-member-name">{member.name}</span>
              </div>
              {isAdmin && (
                <button
                  className="btn-remove-bench"
                  onClick={() => handleRemoveBenchMember(member.id)}
                  title="削除"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {benchMembers.length === 0 && (
            <p className="empty-text">ベンチメンバーはいません</p>
          )}
        </div>
      </div>
    </div>
  )
}
