import React, { useState } from 'react';
import { Employee, EmploymentType } from '../../../types';

interface Props {
  employees: Employee[];
  adminPin: string;
  onUpdate: (employees: Employee[]) => void;
  onUpdateAdminPin: (pin: string) => void;
}

const EMPTY: Omit<Employee,'id'> = { name:'', hourlyRate:1000, employmentType:'アルバイト', role:'worker', pin:'' };
const EMP_TYPES: EmploymentType[] = ['正社員','パート','アルバイト','契約社員'];

const EmployeeMaster: React.FC<Props> = ({ employees, adminPin, onUpdate, onUpdateAdminPin }) => {
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee,'id'>>(EMPTY);
  const [newAdminPin, setNewAdminPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');

  const openNew = () => { setForm(EMPTY); setEditing({ id:'__new__', ...EMPTY }); };
  const openEdit = (e: Employee) => { setForm({ name:e.name, hourlyRate:e.hourlyRate, employmentType:e.employmentType, role:e.role, pin:e.pin }); setEditing(e); };
  const close = () => setEditing(null);

  const save = () => {
    if (!form.name.trim()) return;
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) { alert('PINは4桁の数字で入力してください'); return; }
    if (editing!.id === '__new__') {
      onUpdate([...employees, { id: Date.now().toString(), ...form }]);
    } else {
      onUpdate(employees.map(e => e.id === editing!.id ? { ...e, ...form } : e));
    }
    close();
  };

  const remove = (id: string) => {
    if (!confirm('削除しますか？')) return;
    onUpdate(employees.filter(e => e.id !== id));
  };

  const saveAdminPin = () => {
    if (!/^\d{4}$/.test(newAdminPin)) { setPinMsg('4桁の数字で入力してください'); return; }
    onUpdateAdminPin(newAdminPin);
    setNewAdminPin('');
    setPinMsg('管理者PINを変更しました');
    setTimeout(() => setPinMsg(''), 3000);
  };

  return (
    <div className="space-y-4">
      {/* 管理者PIN変更 */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-xs font-bold text-amber-700 mb-2">管理者PINの変更</p>
        <div className="flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="新しいPIN（4桁）"
            value={newAdminPin}
            onChange={e => setNewAdminPin(e.target.value)}
            className="flex-1 border border-amber-200 rounded-xl px-3 py-2 text-base bg-white"
          />
          <button onClick={saveAdminPin} className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold">変更</button>
        </div>
        {pinMsg && <p className="text-xs text-amber-700 mt-1">{pinMsg}</p>}
      </div>

      {/* 社員一覧 */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">社員一覧（{employees.length}名）</h3>
          <button onClick={openNew} className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold">＋ 追加</button>
        </div>
        {employees.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">社員が登録されていません</p>
        ) : (
          <div className="space-y-2">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.employmentType} · ¥{emp.hourlyRate.toLocaleString()}/h · {emp.role === 'admin' ? '管理者' : '作業員'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(emp)} className="text-blue-600 text-xs border border-blue-200 rounded-lg px-3 py-1">編集</button>
                  <button onClick={() => remove(emp.id)} className="text-red-500 text-xs border border-red-200 rounded-lg px-3 py-1">削除</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-w-lg mx-auto p-6 space-y-4">
            <h3 className="font-bold text-lg text-gray-800">{editing.id === '__new__' ? '社員追加' : '社員編集'}</h3>
            {[
              { label:'氏名', key:'name', type:'text', placeholder:'田中 太郎' },
              { label:'時給（円）', key:'hourlyRate', type:'number', placeholder:'1500' },
              { label:'PIN（4桁）', key:'pin', type:'password', placeholder:'0000' },
            ].map(f => (
              <div key={f.key}>
                <p className="text-xs font-semibold text-gray-500 mb-1">{f.label}</p>
                <input
                  type={f.type}
                  inputMode={f.type === 'number' ? 'numeric' : undefined}
                  placeholder={f.placeholder}
                  maxLength={f.key === 'pin' ? 4 : undefined}
                  value={String((form as Record<string,unknown>)[f.key] ?? '')}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50"
                />
              </div>
            ))}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">雇用形態</p>
              <select value={form.employmentType} onChange={e => setForm(p => ({ ...p, employmentType: e.target.value as EmploymentType }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50">
                {EMP_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">ロール</p>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as 'admin'|'worker' }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50">
                <option value="worker">作業員</option>
                <option value="admin">管理者</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={close} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl">キャンセル</button>
              <button onClick={save} className="flex-1 bg-blue-700 text-white font-bold py-4 rounded-xl">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeMaster;
