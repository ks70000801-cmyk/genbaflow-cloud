import React, { useState } from 'react';
import { Employee, WorkLog } from '../../../types';

interface Props {
  employees: Employee[];
  logs: WorkLog[];
  onUpdate: (logs: WorkLog[]) => void;
  filterEmployeeId?: string;
}

const calcHours = (log: WorkLog): number => {
  const [sh, sm] = log.startTime.split(':').map(Number);
  const [eh, em] = log.endTime.split(':').map(Number);
  const total = (eh * 60 + em) - (sh * 60 + sm) - log.breakMinutes;
  return Math.max(0, total) / 60;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const TimesheetInput: React.FC<Props> = ({ employees, logs, onUpdate, filterEmployeeId }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const isAdmin = !filterEmployeeId;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const monthPrefix = `${year}-${pad2(month)}`;

  const visibleLogs = (filterEmployeeId
    ? logs.filter(l => l.employeeId === filterEmployeeId)
    : logs
  ).filter(l => l.date.startsWith(monthPrefix));

  const empName = (id: string) => employees.find(e => e.id === id)?.name ?? id;
  const remove = (id: string) => onUpdate(logs.filter(l => l.id !== id));

  const sortedLogs = [...visibleLogs].sort((a, b) =>
    (a.date + a.employeeId).localeCompare(b.date + b.employeeId)
  );

  const summaryMap = employees.reduce<Record<string, { days: number; hours: number }>>((acc, emp) => {
    const empLogs = visibleLogs.filter(l => l.employeeId === emp.id);
    if (empLogs.length > 0) {
      acc[emp.id] = {
        days: empLogs.length,
        hours: empLogs.reduce((s, l) => s + calcHours(l), 0),
      };
    }
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* 月選択 */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 mb-1">年</p>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 mb-1">月</p>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>{m}月</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 月次集計（管理者のみ） */}
      {isAdmin && Object.keys(summaryMap).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-gray-800 mb-3">{year}年{month}月 月次集計</h3>
          <div className="space-y-2">
            {employees.filter(e => summaryMap[e.id]).map(emp => (
              <div key={emp.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-3 bg-gray-50">
                <span className="font-bold text-gray-800 text-sm">{emp.name}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-blue-700">{round1(summaryMap[emp.id].hours)}h</span>
                  <span className="text-xs text-gray-400 ml-2">{summaryMap[emp.id].days}日</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 勤怠記録 */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h3 className="font-bold text-gray-800 mb-3">勤怠記録（{visibleLogs.length}件）</h3>
        {sortedLogs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">記録がありません</p>
        ) : (
          <div className="space-y-2">
            {sortedLogs.map(log => (
              <div key={log.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div>
                    {!filterEmployeeId && (
                      <p className="text-xs font-bold text-blue-700">{empName(log.employeeId)}</p>
                    )}
                    <p className="text-sm font-bold text-gray-800">{log.date}</p>
                    <p className="text-xs text-gray-500">
                      {log.startTime}〜{log.endTime} 休憩{log.breakMinutes}分
                      <span className="ml-1 text-blue-600 font-semibold">({round1(calcHours(log))}h)</span>
                      {log.isHolidayOverride != null && (
                        <span className="ml-1 text-orange-600">({log.isHolidayOverride ? '休日' : '平日'}指定)</span>
                      )}
                    </p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => remove(log.id)}
                      className="text-red-500 text-xs border border-red-200 rounded-lg px-2 py-1 flex-shrink-0">
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetInput;
