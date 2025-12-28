
import React, { useState, useMemo } from 'react';
import { DailyReportData, WorkerEntry, SubcontractorEntry, AppMode, PlanTier } from './types';
import { generateProfessionalReport } from './services/geminiService';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('FIELD');
  const [plan, setPlan] = useState<PlanTier>('PRO');
  
  const [formData, setFormData] = useState<DailyReportData>({
    projectName: '',
    date: new Date().toISOString().split('T')[0],
    workers: [{ id: '1', name: '', startTime: '08:00', endTime: '17:00', breakMinutes: 60, hourlyRate: 2500 }],
    subcontractors: [],
    workContent: '',
    machinesUsed: '',
    materialsProcurement: '',
    safetyNotes: '異常なし。整理整頓の徹底。',
    tomorrowPlan: '',
    memo: '',
  });

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculateHours = (start: string, end: string, breakMin: number) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const totalMin = (eH * 60 + eM) - (sH * 60 + sM) - breakMin;
    return Math.max(0, totalMin / 60);
  };

  const totalManHours = useMemo(() => {
    return formData.workers.reduce((acc, w) => acc + calculateHours(w.startTime, w.endTime, w.breakMinutes), 0);
  }, [formData.workers]);

  const totalEstimatedCost = useMemo(() => {
    return formData.workers.reduce((acc, w) => acc + (calculateHours(w.startTime, w.endTime, w.breakMinutes) * w.hourlyRate), 0);
  }, [formData.workers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkerChange = (id: string, field: keyof WorkerEntry, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      workers: prev.workers.map(w => w.id === id ? { ...w, [field]: value } : w)
    }));
  };

  const addWorker = () => setFormData(prev => ({ ...prev, workers: [...prev.workers, { id: Date.now().toString(), name: '', startTime: '08:00', endTime: '17:00', breakMinutes: 60, hourlyRate: 2500 }] }));
  const removeWorker = (id: string) => formData.workers.length > 1 && setFormData(prev => ({ ...prev, workers: prev.workers.filter(w => w.id !== id) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const content = await generateProfessionalReport(formData);
      setReport(content);
    } catch (err) {
      setError("AIレポートの生成に失敗しました。APIキーを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      alert('クリップボードにコピーしました！そのままLINEやメールに貼り付けられます。');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F9] text-slate-800 font-sans pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${appMode === 'FIELD' ? 'bg-emerald-500' : 'bg-blue-600'}`}>
              <i className={`fas ${appMode === 'FIELD' ? 'fa-helmet-safety' : 'fa-building-columns'} text-xl`}></i>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter leading-none">GenbaFlow Cloud</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase">{appMode === 'FIELD' ? '現場責任者モード' : '経営・経理モード'}</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
             <button onClick={() => setAppMode('FIELD')} className={`px-6 py-2 rounded-lg text-xs font-black transition ${appMode === 'FIELD' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>日報入力</button>
             <button onClick={() => setAppMode('ADMIN')} className={`px-6 py-2 rounded-lg text-xs font-black transition ${appMode === 'ADMIN' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>原価管理</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            {appMode === 'FIELD' ? (
              <div className="space-y-8 animate-in">
                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-3 flex items-center"><i className="fas fa-info-circle mr-2"></i>基本情報</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">現場名</label>
                      <input type="text" name="projectName" value={formData.projectName} onChange={handleInputChange} className="w-full text-xl font-bold border-b-2 border-slate-100 focus:border-emerald-500 outline-none p-2" placeholder="〇〇邸 新築工事" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">日付</label>
                      <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="w-full text-xl font-bold border-b-2 border-slate-100 focus:border-emerald-500 outline-none p-2" />
                    </div>
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center"><i className="fas fa-users mr-2"></i>作業員・稼働時間</h3>
                    <button onClick={addWorker} className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1 rounded-full hover:bg-emerald-100 transition">+ 作業員追加</button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {formData.workers.map(w => (
                      <div key={w.id} className="py-4 flex items-center space-x-4">
                        <input value={w.name} onChange={e => handleWorkerChange(w.id, 'name', e.target.value)} placeholder="作業員名" className="flex-1 font-bold text-slate-700 outline-none border-b border-transparent focus:border-emerald-200" />
                        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <input type="time" value={w.startTime} onChange={e => handleWorkerChange(w.id, 'startTime', e.target.value)} className="bg-transparent text-xs font-bold outline-none" />
                          <span className="text-slate-300">-</span>
                          <input type="time" value={w.endTime} onChange={e => handleWorkerChange(w.id, 'endTime', e.target.value)} className="bg-transparent text-xs font-bold outline-none" />
                        </div>
                        <button onClick={() => removeWorker(w.id)} className="text-slate-200 hover:text-red-400 transition"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-3 flex items-center"><i className="fas fa-pen-fancy mr-2"></i>本日の作業詳細</h3>
                  <div className="space-y-5">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-2">作業内容</label>
                      <textarea name="workContent" value={formData.workContent} onChange={handleInputChange} rows={3} className="w-full p-4 bg-slate-50 rounded-2xl text-sm border-2 border-transparent focus:border-emerald-100 outline-none transition" placeholder="本日の作業進捗を箇条書きなどで入力"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-2">使用機械・車両</label>
                        <input name="machinesUsed" value={formData.machinesUsed} onChange={handleInputChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-2 border-transparent focus:border-emerald-100 outline-none" placeholder="ユンボ、4tダンプ等" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-2">搬入資材・購入品</label>
                        <input name="materialsProcurement" value={formData.materialsProcurement} onChange={handleInputChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-2 border-transparent focus:border-emerald-100 outline-none" placeholder="砕石20t、鉄筋等" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-2">安全・注意事項</label>
                      <input name="safetyNotes" value={formData.safetyNotes} onChange={handleInputChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-2 border-transparent focus:border-emerald-100 outline-none" placeholder="高所作業時の安全帯使用等" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-2">明日の予定</label>
                      <input name="tomorrowPlan" value={formData.tomorrowPlan} onChange={handleInputChange} className="w-full p-3 bg-slate-50 rounded-xl text-xs border-2 border-transparent focus:border-emerald-100 outline-none" placeholder="コンクリート打設準備等" />
                    </div>
                  </div>
                </section>

                <button onClick={handleSubmit} disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50">
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-wand-magic-sparkles text-emerald-400"></i>}
                  <span>プロ仕様の日報をAI生成</span>
                </button>
                {error && <p className="text-red-500 text-center text-xs font-bold">{error}</p>}
              </div>
            ) : (
              <div className="space-y-8 animate-in">
                <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-200">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">本日のコスト概算</p>
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-4xl font-black">¥{totalEstimatedCost.toLocaleString()}</p>
                         <p className="text-[10px] font-bold opacity-80 mt-1">労務単価に基づく直接労務費</p>
                      </div>
                      <div className="text-right">
                         <p className="text-4xl font-black">{totalManHours.toFixed(1)}h</p>
                         <p className="text-[10px] font-bold opacity-80 mt-1">総稼働工数</p>
                      </div>
                   </div>
                </div>

                <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-4 mb-6 flex justify-between items-center">
                    <span>労務単価設定（経理用）</span>
                  </h3>
                  <div className="space-y-4">
                    {formData.workers.map(w => (
                      <div key={w.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{w.name || "(未設定)"}</span>
                          <span className="text-[10px] text-slate-400">{calculateHours(w.startTime, w.endTime, w.breakMinutes).toFixed(1)}h 勤務</span>
                        </div>
                        <div className="flex items-center space-x-2">
                           <span className="text-xs font-bold text-slate-400">時単価 ¥</span>
                           <input type="number" value={w.hourlyRate} onChange={e => handleWorkerChange(w.id, 'hourlyRate', parseInt(e.target.value))} className="w-24 p-2 bg-white rounded-lg border border-slate-200 font-black text-right text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              <div className="bg-slate-900 rounded-[40px] shadow-2xl p-10 min-h-[600px] border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10 space-y-8">
                  <header className="flex justify-between items-center border-b border-white/10 pb-6">
                    <div>
                      <h4 className="text-white font-black text-lg">AI生成結果</h4>
                      <p className="text-[9px] text-emerald-400 font-bold tracking-[0.3em] uppercase">Digital Daily Report</p>
                    </div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  </header>

                  <div className="text-white leading-relaxed">
                    {report ? (
                      <div className="whitespace-pre-wrap font-sans text-[14px] opacity-90 animate-in">
                        {report}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-40 opacity-20 space-y-4">
                        <i className="fas fa-file-pen text-6xl"></i>
                        <p className="text-xs font-black tracking-widest uppercase">入力待機中...</p>
                      </div>
                    )}
                  </div>
                </div>

                {report && (
                  <div className="absolute bottom-8 left-10 right-10">
                    <button onClick={copyToClipboard} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-black transition-all shadow-lg shadow-emerald-900/20">
                      <i className="fas fa-copy mr-2"></i>内容をコピーして共有
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-center text-slate-400 font-bold">※生成された内容は必ず確認してから共有してください</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
