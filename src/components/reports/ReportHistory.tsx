import React, { useState } from 'react';
import { DailyReport } from '../../../types';

interface Props {
  reports: DailyReport[];
  onBack: () => void;
}

const ReportHistory: React.FC<Props> = ({ reports, onBack }) => {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);

  const grouped = reports.reduce<Record<string, DailyReport[]>>((acc, r) => {
    const key = r.projectName || '(現場名未入力)';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const projectNames = Object.keys(grouped).sort();

  if (selectedReport) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => setSelectedReport(null)} className="text-blue-200 text-sm">← 一覧</button>
            <h1 className="text-lg font-bold flex-1">日報詳細</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-sm text-gray-500 mb-3">
              {selectedReport.projectName || '(現場名未入力)'} · {selectedReport.date}
            </p>
            <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">{selectedReport.content}</pre>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    const projectReports = [...(grouped[selectedProject] ?? [])]
      .sort((a, b) => b.date.localeCompare(a.date));
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => setSelectedProject(null)} className="text-blue-200 text-sm">← 現場一覧</button>
            <h1 className="text-lg font-bold flex-1 truncate">{selectedProject}</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
          {projectReports.map(r => (
            <button key={r.id} onClick={() => setSelectedReport(r)}
              className="w-full text-left bg-white rounded-2xl shadow-sm p-4 hover:bg-blue-50 transition">
              <p className="font-bold text-gray-800">{r.date}</p>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.content.slice(0, 100)}…</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={onBack} className="text-blue-200 text-sm">← 日報</button>
          <h1 className="text-lg font-bold flex-1">日報履歴</h1>
          <span className="text-blue-200 text-xs">{reports.length}件</span>
        </div>
      </header>
      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {projectNames.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">日報履歴がありません</p>
            <p className="text-gray-400 text-xs mt-1">日報作成ボタンで日報を作成すると履歴に保存されます</p>
          </div>
        ) : (
          projectNames.map(name => {
            const latest = [...grouped[name]].sort((a, b) => b.date.localeCompare(a.date))[0];
            return (
              <button key={name} onClick={() => setSelectedProject(name)}
                className="w-full text-left bg-white rounded-2xl shadow-sm p-4 hover:bg-blue-50 transition">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-800">{name}</p>
                  <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{grouped[name].length}件</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">最新：{latest?.date}</p>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReportHistory;
