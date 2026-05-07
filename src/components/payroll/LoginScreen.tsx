import React, { useState } from 'react';
import { Employee, UserRole } from '../../../types';

interface Props {
  employees: Employee[];
  adminPin: string;
  onLogin: (role: UserRole, employee: Employee | null) => void;
}

const LoginScreen: React.FC<Props> = ({ employees, adminPin, onLogin }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (pin === adminPin) {
      onLogin('admin', null);
      return;
    }
    const emp = employees.find(e => e.pin === pin);
    if (emp) {
      onLogin('worker', emp);
      return;
    }
    setError('PINが正しくありません');
    setPin('');
  };

  const handleKey = (k: string) => {
    if (k === 'DEL') { setPin(p => p.slice(0,-1)); setError(''); return; }
    if (pin.length < 4) { const next = pin + k; setPin(next); if (next.length === 4) setTimeout(() => handleSubmitWith(next), 100); }
  };

  const handleSubmitWith = (p: string) => {
    if (p === adminPin) { onLogin('admin', null); return; }
    const emp = employees.find(e => e.pin === p);
    if (emp) { onLogin('worker', emp); return; }
    setError('PINが正しくありません');
    setPin('');
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','DEL'];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-1">給与管理</h2>
        <p className="text-sm text-gray-500 text-center mb-6">PINを入力してください</p>

        {/* PIN表示 */}
        <div className="flex justify-center gap-4 mb-6">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl ${pin.length > i ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
              {pin.length > i ? '●' : ''}
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        {/* テンキー */}
        <div className="grid grid-cols-3 gap-3">
          {keys.map((k, i) => (
            k === '' ? <div key={i} /> :
            <button
              key={i}
              onClick={() => handleKey(k)}
              className={`h-14 rounded-xl text-xl font-bold transition ${
                k === 'DEL'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-800 hover:bg-blue-50 hover:text-blue-700 border border-gray-200'
              }`}
            >
              {k === 'DEL' ? '⌫' : k}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-4 w-full bg-blue-700 text-white font-bold py-4 rounded-xl"
        >
          ログイン
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">管理者PIN初期値: 0000</p>
      </div>
    </div>
  );
};

export default LoginScreen;
