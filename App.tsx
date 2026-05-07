import React, { useState, useCallback } from 'react';
import { DailyReportData, WorkerEntry, SubcontractorEntry, Employee, WorkLog, WorkflowApprover, ApprovalStep, ReportSubmission, DailyReport } from './types';
import PayrollApp from './src/components/payroll/PayrollApp';
import ReportHistory from './src/components/reports/ReportHistory';
import { useLocalStorage } from './src/hooks/useLocalStorage';
import { exportDailyReportToExcel } from './src/utils/reportExcel';

// ─── 小コンポーネント ────────────────────────────────────────────

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-2xl shadow-sm p-4">{children}</div>
);

const SectionTitle: React.FC<{ n: number; icon: string; label: string }> = ({ n, icon, label }) => (
  <div className="flex items-center gap-2 mb-4">
    <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
      {n}
    </span>
    <span className="font-bold text-gray-800 text-base">{icon} {label}</span>
  </div>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{children}</p>
);

const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input
    {...props}
    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ rows = 3, ...props }) => (
  <textarea
    rows={rows}
    {...props}
    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
  />
);

// ─── メインコンポーネント ────────────────────────────────────────

const App: React.FC = () => {
  const [formData, setFormData] = useState<DailyReportData>({
    projectName: '',
    date: new Date().toISOString().split('T')[0],
    workers: [{ id: '1', name: '', startTime: '08:00', endTime: '17:00', breakMinutes: 60, hourlyRate: 0 }],
    subcontractors: [],
    workContent: '',
    machinesUsed: '',
    materialsProcurement: '',
    safetyNotes: '異常なし。整理整頓の徹底。',
    tomorrowPlan: '',
    memo: '',
  });

  const [report, setReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'form' | 'report'>('form');
  const [appMode, setAppMode] = useState<'report' | 'payroll' | 'history'>('report');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [payrollEmployees] = useLocalStorage<Employee[]>('payroll_employees', []);
  const [workflowApprovers] = useLocalStorage<WorkflowApprover[]>('workflow_approvers', []);
  const [workflowReports, setWorkflowReports] = useLocalStorage<ReportSubmission[]>('workflow_reports', []);
  const [dailyReports, setDailyReports] = useLocalStorage<DailyReport[]>('daily_reports', []);
  const [workerEmpMap, setWorkerEmpMap] = useState<Record<string, string>>({});
  const [reportApprovers, setReportApprovers] = useState<WorkflowApprover[]>([]);

  const selectEmployeeForWorker = useCallback((workerId: string, empId: string) => {
    setWorkerEmpMap(prev => ({ ...prev, [workerId]: empId }));
    const emp = payrollEmployees.find(e => e.id === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        workers: prev.workers.map(w =>
          w.id === workerId ? { ...w, name: emp.name, hourlyRate: emp.hourlyRate } : w
        ),
      }));
    }
  }, [payrollEmployees]);

  const [payrollWorkLogs, setPayrollWorkLogs] = useLocalStorage<WorkLog[]>('payroll_worklogs', []);

  const addReportApprover = (approver: WorkflowApprover) => {
    if (reportApprovers.some(a => a.id === approver.id)) return;
    setReportApprovers(prev => [...prev, { ...approver, order: prev.length + 1 }]);
  };

  const removeReportApprover = (id: string) => {
    const next = reportApprovers.filter(a => a.id !== id);
    setReportApprovers(next.map((a, i) => ({ ...a, order: i + 1 })));
  };

  const moveReportApprover = (id: string, dir: -1 | 1) => {
    const s = [...reportApprovers].sort((a, b) => a.order - b.order);
    const i = s.findIndex(a => a.id === id);
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    setReportApprovers(s.map((a, k) => ({ ...a, order: k + 1 })));
  };

  const syncWorkLogs = useCallback((): number => {
    if (!formData.date) return 0;
    const updates = formData.workers
      .filter(w => !!workerEmpMap[w.id])
      .map(w => ({
        id: `${workerEmpMap[w.id]}_${formData.date}`,
        employeeId: workerEmpMap[w.id],
        date: formData.date,
        startTime: w.startTime,
        endTime: w.endTime,
        breakMinutes: w.breakMinutes,
        isHolidayOverride: null as null,
      }));
    if (updates.length === 0) return 0;
    setPayrollWorkLogs(prev => [
      ...prev.filter(l => !updates.some(u => u.employeeId === l.employeeId && u.date === l.date)),
      ...updates,
    ]);
    return updates.length;
  }, [formData, workerEmpMap, setPayrollWorkLogs]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // 作業員
  const handleWorkerChange = useCallback((id: string, field: keyof WorkerEntry, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      workers: prev.workers.map(w => w.id === id ? { ...w, [field]: value } : w),
    }));
  }, []);

  const addWorker = () => setFormData(prev => ({
    ...prev,
    workers: [...prev.workers, { id: Date.now().toString(), name: '', startTime: '08:00', endTime: '17:00', breakMinutes: 60, hourlyRate: 0 }],
  }));

  const removeWorker = (id: string) => {
    if (formData.workers.length > 1) {
      setFormData(prev => ({ ...prev, workers: prev.workers.filter(w => w.id !== id) }));
    }
  };

  // 下請け業者
  const handleSubChange = useCallback((id: string, field: keyof SubcontractorEntry, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      subcontractors: prev.subcontractors.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));
  }, []);

  const addSubcontractor = () => setFormData(prev => ({
    ...prev,
    subcontractors: [...prev.subcontractors, { id: Date.now().toString(), name: '', count: 1 }],
  }));

  const removeSubcontractor = (id: string) => setFormData(prev => ({
    ...prev,
    subcontractors: prev.subcontractors.filter(s => s.id !== id),
  }));

  // 日報作成（テンプレート整形）
  const formatReport = (d: DailyReportData): string => {
    const workers = d.workers.length > 0
      ? d.workers.map(w => `  ・${w.name || '(未入力)'}  ${w.startTime}〜${w.endTime}  休憩${w.breakMinutes}分`).join('\n')
      : '  なし';
    const subs = d.subcontractors.length > 0
      ? d.subcontractors.map(s => `  ・${s.name || '(未入力)'}  ${s.count}名`).join('\n')
      : '  なし';
    return [
      `【現場名】${d.projectName || '未入力'}`,
      `【日　付】${d.date}`,
      '',
      `■ 作業員\n${workers}`,
      `■ 下請け業者\n${subs}`,
      '',
      `■ 本日の作業内容\n${d.workContent || '(未入力)'}`,
      `■ 使用機械・車両\n${d.machinesUsed || 'なし'}`,
      `■ 搬入資材・購入品\n${d.materialsProcurement || 'なし'}`,
      `■ 安全・注意事項\n${d.safetyNotes}`,
      `■ 明日の予定\n${d.tomorrowPlan || '未定'}`,
      `■ メモ・特記事項\n${d.memo || 'なし'}`,
    ].join('\n');
  };

  const handleCreateReport = () => {
    syncWorkLogs();
    const content = formatReport(formData);
    setReport(content);
    setDailyReports(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        projectName: formData.projectName,
        date: formData.date,
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setReportSubmitted(false);
    setView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitToWorkflow = () => {
    if (reportApprovers.length === 0 || !report) return;
    const sorted = [...reportApprovers].sort((a, b) => a.order - b.order);
    const steps: ApprovalStep[] = sorted.map(a => ({
      approverId: a.id,
      approverName: a.name,
      approverEmail: a.email,
      status: 'waiting' as const,
      comment: '',
      decidedAt: '',
    }));
    const submission: ReportSubmission = {
      id: Date.now().toString(),
      projectName: formData.projectName,
      date: formData.date,
      content: report,
      submittedAt: new Date().toISOString(),
      submitterName: submitterName.trim() || '現場担当者',
      submitterEmail: submitterEmail.trim(),
      steps,
      currentStepIndex: 0,
      finalStatus: 'in_progress',
    };
    setWorkflowReports(prev => [...prev, submission]);
    setReportSubmitted(true);
    const first = sorted[0];
    const body = `${submission.submitterName} より日報が提出されました。承認をお願いします。\n\n【日報内容】\n${report}`;
    window.open(
      `mailto:${encodeURIComponent(first.email)}?subject=${encodeURIComponent(`【日報承認依頼】${formData.projectName || '現場'} ${formData.date}`)}&body=${encodeURIComponent(body)}`,
      '_self'
    );
  };

  const copyToClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const todayLabel = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  // ─── 給与管理画面 ─────────────────────────────────────────────
  if (appMode === 'payroll') {
    return <PayrollApp onBack={() => setAppMode('report')} />;
  }

  // ─── 日報履歴画面 ─────────────────────────────────────────────
  if (appMode === 'history') {
    return <ReportHistory reports={dailyReports} onBack={() => setAppMode('report')} />;
  }

  // ─── レポート画面 ──────────────────────────────────────────────
  if (view === 'report' && report) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => setView('form')} className="text-blue-200 hover:text-white text-sm">← 戻る</button>
            <h1 className="text-lg font-bold flex-1">日報</h1>
          </div>
        </header>

        <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4">
          {/* 日報本文 */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">📄 {formData.projectName || '現場名未入力'} · {formData.date}</span>
              <div className="flex gap-2">
                <button onClick={copyToClipboard}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700'}`}>
                  {copied ? '✓ コピー済み' : 'コピー'}
                </button>
                <button onClick={() => exportDailyReportToExcel(formData)}
                  className="px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-600 text-white transition hover:bg-emerald-700">
                  Excel
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed border-t border-gray-100 pt-3">{report}</pre>
          </div>

          {/* ワークフロー送信 */}
          {reportApprovers.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm p-4">
              <h3 className="font-bold text-gray-800 mb-1">承認ルートに送る</h3>
              <p className="text-xs text-gray-500 mb-3">
                {[...reportApprovers].sort((a, b) => a.order - b.order).map(a => a.name).join(' → ')}
              </p>
              {!reportSubmitted ? (
                <div className="space-y-2">
                  <input type="text" value={submitterName} onChange={e => setSubmitterName(e.target.value)}
                    placeholder="提出者名（例：田中 太郎）"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50" />
                  <input type="email" value={submitterEmail} onChange={e => setSubmitterEmail(e.target.value)}
                    placeholder="提出者メール（差し戻し通知用）"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-gray-50" />
                  <button onClick={handleSubmitToWorkflow}
                    className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl">
                    承認ルートに送る
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-green-700 font-bold text-sm">✓ 承認ルートに送信しました</p>
                  <p className="text-xs text-green-600 mt-1">
                    {[...reportApprovers].sort((a, b) => a.order - b.order)[0]?.name} 宛にメールが開きました
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20">
          <div className="max-w-lg mx-auto flex gap-3">
            <button onClick={() => setView('form')} className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl text-base">
              フォームに戻る
            </button>
            <button onClick={copyToClipboard}
              className={`flex-1 font-bold py-4 rounded-xl text-base transition ${copied ? 'bg-green-500 text-white' : 'bg-blue-700 text-white'}`}>
              {copied ? '✓ コピー済み' : 'コピーする'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── 入力フォーム画面 ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">現場プロ日報</h1>
            <p className="text-blue-200 text-xs mt-0.5">{todayLabel}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAppMode('history')}
              className="text-blue-200 text-sm border border-blue-400 rounded-lg px-3 py-1"
            >
              履歴
            </button>
            <button
              onClick={() => setAppMode('payroll')}
              className="text-blue-200 text-sm border border-blue-400 rounded-lg px-3 py-1"
            >
              給与管理
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-36">

        {/* ① 基本情報 */}
        <SectionCard>
          <SectionTitle n={1} icon="📋" label="基本情報" />
          <div className="space-y-3">
            <div>
              <Label>現場名</Label>
              <TextInput
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                placeholder="例：〇〇ビル新築工事"
              />
            </div>
            <div>
              <Label>日付</Label>
              <TextInput
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </SectionCard>

        {/* ② 作業員 */}
        <SectionCard>
          <SectionTitle n={2} icon="👷" label="作業員" />
          <div className="space-y-3">
            {formData.workers.map((worker, idx) => (
              <div key={worker.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-700">作業員 {idx + 1}</span>
                  {formData.workers.length > 1 && (
                    <button
                      onClick={() => removeWorker(worker.id)}
                      className="text-red-400 text-xs hover:text-red-600 px-2 py-1"
                    >
                      削除
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {payrollEmployees.length > 0 && (
                    <select
                      value={workerEmpMap[worker.id] || ''}
                      onChange={e => selectEmployeeForWorker(worker.id, e.target.value)}
                      className="w-full border border-blue-200 rounded-xl px-4 py-3 text-base bg-blue-50"
                    >
                      <option value="">社員から選択...</option>
                      {payrollEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  )}
                  <TextInput
                    type="text"
                    value={worker.name}
                    onChange={e => handleWorkerChange(worker.id, 'name', e.target.value)}
                    placeholder="氏名"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label>開始</Label>
                      <TextInput
                        type="time"
                        value={worker.startTime}
                        onChange={e => handleWorkerChange(worker.id, 'startTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>終了</Label>
                      <TextInput
                        type="time"
                        value={worker.endTime}
                        onChange={e => handleWorkerChange(worker.id, 'endTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>休憩(分)</Label>
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        value={worker.breakMinutes}
                        onChange={e => handleWorkerChange(worker.id, 'breakMinutes', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  {workerEmpMap[worker.id] && (
                    <p className="text-xs text-blue-600">✓ 給与管理と連携中</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={addWorker}
              className="flex-1 border-2 border-dashed border-blue-300 text-blue-600 font-bold py-3 rounded-xl text-sm hover:border-blue-500 transition"
            >
              ＋ 作業員を追加
            </button>
            {Object.values(workerEmpMap).some(Boolean) && (
              <button
                onClick={() => { syncWorkLogs(); }}
                className="border-2 border-green-400 text-green-700 font-bold px-4 py-3 rounded-xl text-sm hover:bg-green-50 transition"
              >
                勤怠に記録
              </button>
            )}
          </div>
        </SectionCard>

        {/* ③ 下請け業者 */}
        <SectionCard>
          <SectionTitle n={3} icon="🏗️" label="下請け業者" />
          {formData.subcontractors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">下請け業者なし</p>
          ) : (
            <div className="space-y-3 mb-3">
              {formData.subcontractors.map((sub, idx) => (
                <div key={sub.id} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-700">業者 {idx + 1}</span>
                    <button
                      onClick={() => removeSubcontractor(sub.id)}
                      className="text-red-400 text-xs hover:text-red-600 px-2 py-1"
                    >
                      削除
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label>業者名</Label>
                      <TextInput
                        type="text"
                        value={sub.name}
                        onChange={e => handleSubChange(sub.id, 'name', e.target.value)}
                        placeholder="例：〇〇工業"
                      />
                    </div>
                    <div>
                      <Label>人数</Label>
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={sub.count}
                        onChange={e => handleSubChange(sub.id, 'count', Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={addSubcontractor}
            className="mt-1 w-full border-2 border-dashed border-blue-300 text-blue-600 font-bold py-3 rounded-xl text-sm hover:border-blue-500 transition"
          >
            ＋ 下請け業者を追加
          </button>
        </SectionCard>

        {/* ④ 作業内容 */}
        <SectionCard>
          <SectionTitle n={4} icon="🔨" label="本日の作業内容" />
          <TextArea
            name="workContent"
            value={formData.workContent}
            onChange={handleInputChange}
            placeholder="例：1階スラブ型枠組立、鉄筋配筋作業"
            rows={4}
          />
        </SectionCard>

        {/* ⑤ 機械・車両 */}
        <SectionCard>
          <SectionTitle n={5} icon="🚜" label="使用機械・車両" />
          <TextArea
            name="machinesUsed"
            value={formData.machinesUsed}
            onChange={handleInputChange}
            placeholder="例：25tラフタークレーン×1、4tダンプ×2"
            rows={2}
          />
        </SectionCard>

        {/* ⑥ 搬入資材 */}
        <SectionCard>
          <SectionTitle n={6} icon="📦" label="搬入資材・購入品" />
          <TextArea
            name="materialsProcurement"
            value={formData.materialsProcurement}
            onChange={handleInputChange}
            placeholder="例：生コン50m³、鉄筋D13×500本"
            rows={2}
          />
        </SectionCard>

        {/* ⑦ 安全・注意事項 */}
        <SectionCard>
          <SectionTitle n={7} icon="⛑️" label="安全・注意事項" />
          <TextArea
            name="safetyNotes"
            value={formData.safetyNotes}
            onChange={handleInputChange}
            rows={2}
          />
        </SectionCard>

        {/* ⑧ 明日の予定 */}
        <SectionCard>
          <SectionTitle n={8} icon="📅" label="明日の予定" />
          <TextArea
            name="tomorrowPlan"
            value={formData.tomorrowPlan}
            onChange={handleInputChange}
            placeholder="例：2階スラブ型枠継続、コンクリート打設"
            rows={2}
          />
        </SectionCard>

        {/* ⑨ メモ */}
        <SectionCard>
          <SectionTitle n={9} icon="📝" label="メモ・特記事項" />
          <TextArea
            name="memo"
            value={formData.memo}
            onChange={handleInputChange}
            placeholder="自由記入"
            rows={2}
          />
        </SectionCard>

        {/* ⑩ 承認ルート（この日報） */}
        <SectionCard>
          <SectionTitle n={10} icon="✉️" label="承認ルート（この日報）" />
          {reportApprovers.length > 0 && (
            <div className="space-y-2 mb-3">
              {[...reportApprovers].sort((a, b) => a.order - b.order).map((a, idx, arr) => (
                <div key={a.id} className="flex items-center gap-2 border border-blue-200 rounded-xl p-2 bg-blue-50">
                  <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {a.order}
                  </span>
                  <span className="flex-1 text-sm font-bold text-gray-800">{a.name}</span>
                  <button onClick={() => moveReportApprover(a.id, -1)} disabled={idx === 0}
                    className="text-gray-400 disabled:opacity-25 text-base leading-none px-1">▲</button>
                  <button onClick={() => moveReportApprover(a.id, 1)} disabled={idx === arr.length - 1}
                    className="text-gray-400 disabled:opacity-25 text-base leading-none px-1">▼</button>
                  <button onClick={() => removeReportApprover(a.id)}
                    className="text-red-500 text-xs border border-red-200 rounded-lg px-2 py-1">×</button>
                </div>
              ))}
            </div>
          )}
          {workflowApprovers.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 mb-2">承認者を追加：</p>
              <div className="flex flex-wrap gap-2">
                {[...workflowApprovers]
                  .sort((a, b) => a.order - b.order)
                  .filter(a => !reportApprovers.some(r => r.id === a.id))
                  .map(a => (
                    <button key={a.id} onClick={() => addReportApprover(a)}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition">
                      ＋ {a.name}
                    </button>
                  ))
                }
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-2">
              承認者が登録されていません。<br />
              <span className="text-xs">給与管理 → ワークフロー から承認者を登録してください。</span>
            </p>
          )}
        </SectionCard>

      </div>

      {/* 固定フッターボタン */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCreateReport}
            className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-bold py-4 rounded-2xl text-lg shadow-lg transition-colors flex items-center justify-center gap-2"
          >
            📋 日報作成
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
