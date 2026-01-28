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
}: MemberListProps) {
  const [newMemberName, setNewMemberName] = useState('')
  const [showNewMemberForm, setShowNewMemberForm] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showGlobalMembers, setShowGlobalMembers] = useState(false)

  // メンバーを打順でマップ（打順 -> Member）
  const membersByOrder = new Map<number, Member>()
  members.forEach(m => {
    if (m.battingOrder && m.battingOrder >= 1 && m.battingOrder <= 9) {
      membersByOrder.set(m.battingOrder, m)
    }
  })

  // 打順が未設定のメンバー
  const unorderedMembers = members.filter(m => !m.battingOrder || m.battingOrder < 1 || m.battingOrder > 9)

  // 各打順で利用可能なメンバー（別の打順に割り当てられていない）
  const getAvailableMembersForOrder = (order: number) => {
    const assignedToOtherOrders = new Set<string>()
    membersByOrder.forEach((member, assignedOrder) => {
      if (assignedOrder !== order) {
        assignedToOtherOrders.add(member.id)
      }
    })
    
    return [
      ...globalMembers.filter(m => !assignedToOtherOrders.has(m.id)),
      ...unorderedMembers.filter(m => !assignedToOtherOrders.has(m.id)),
    ]
  }

  const handleAssignMember = (battingOrder: number, memberId: string) => {
    if (!memberId) {
      // 割り当てを解除
      const member = membersByOrder.get(battingOrder)
      if (member) {
        onUpdateMember({ ...member, battingOrder: undefined })
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

      <div className="batting-order-grid">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((order) => {
          const member = membersByOrder.get(order)
          const availableMembers = getAvailableMembersForOrder(order)

          return (
            <div key={order} className="batting-order-slot">
              <div className="order-number">第{order}番</div>
              <select
                className="member-select"
                value={member?.id || ''}
                onChange={(e) => handleAssignMember(order, e.target.value)}
              >
                <option value="">-- 選手を選択 --</option>
                {availableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {member && (
                <button
                  className="btn-remove-member"
                  onClick={() => handleAssignMember(order, '')}
                  title="割り当てを解除"
                >
                  ✕
                </button>
              )}
            </div>
          )
        })}
      </div>

      {unorderedMembers.length > 0 && (
        <div className="unassigned-members">
          <h4>打順未設定のメンバー</h4>
          <div className="unassigned-list">
            {unorderedMembers.map((member) => (
              <div key={member.id} className="unassigned-member">
                <span>{member.name}</span>
                <button
                  className="btn-remove"
                  onClick={() => onRemoveMember(member.id)}
                  title="削除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
