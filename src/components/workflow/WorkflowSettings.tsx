import React, { useState } from 'react';
import { WorkflowApprover } from '../../../types';

interface Props {
  approvers: WorkflowApprover[];
  onUpdate: (approvers: WorkflowApprover[]) => void;
}

const EMPTY = { name: '', email: '' };

const WorkflowSettings: React.FC<Props> = ({ approvers, onUpdate }) => {
  const [editing, setEditing] = useState<WorkflowApprover | null>(null);
  const [form, setForm] = useState(EMPTY);

  const listed = [...approvers].sort((a, b) => a.order - b.order);

  const openNew = () => {
    setForm(EMPTY);
    setEditing({ id: '__new__', name: '', email: '', order: approvers.length + 1 });
  };

  const openEdit = (a: WorkflowApprover) => {
    setForm({ name: a.name, email: a.email });
    setEditing(a);
  };

  const save = () => {
    if (!form.name.trim() || !form.email.trim()) return;
    if (editing!.id === '__new__') {
      onUpdate([...approvers, { id: Date.now().toString(), ...form, order: approvers.length + 1 }]);
    } else {
      onUpdate(approvers.map(a => a.id === editing!.id ? { ...a, ...form } : a));
    }
    setEditing(null);
  };

  const remove = (id: string) => {
    if (!confirm('削除しますか？')) return;
    const next = approvers.filter(a => a.id !== id).sort((a, b) => a.order - b.order);
    onUpdate(next.map((a, i) => ({ ...a, order: i + 1 })));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-gray-800">承認者登録</h3>
            <p className="text-xs text-gray-500 mt-0.5">日報作成時に承認者と順序を選択できます</p>
          </div>
          <button onClick={openNew} className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">＋ 追加</button>
        </div>

        {listed.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">承認者が登録されていません</p>
        ) : (
          <div className="space-y-2">
            {listed.map((a) => (
              <div key={a.id} className="flex items-center gap-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{a.name}</p>
                  <p className="text-xs text-gray-500 truncate">{a.email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(a)} className="text-blue-600 text-xs border border-blue-200 rounded-lg px-2 py-1">編集</button>
                  <button onClick={() => remove(a.id)} className="text-red-500 text-xs border border-red-200 rounded-lg px-2 py-1">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-w-lg mx-auto p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">
              {editing.id === '__new__' ? '承認者を追加' : '承認者を編集'}
            </h3>
            {[
              { label: '氏名', key: 'name', type: 'text', placeholder: '山田 太郎' },
              { label: 'メールアドレス', key: 'email', type: 'email', placeholder: 'taro@example.com' },
            ].map(f => (
              <div key={f.key}>
                <p className="text-xs font-semibold text-gray-500 mb-1">{f.label}</p>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={(form as Record<string, string>)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditing(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl">キャンセル</button>
              <button onClick={save} className="flex-1 bg-blue-700 text-white font-bold py-4 rounded-xl">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowSettings;
