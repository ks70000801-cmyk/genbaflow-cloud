import React, { useState } from 'react';
import { ReportSubmission } from '../../../types';

interface Props {
  reports: ReportSubmission[];
  onUpdate: (reports: ReportSubmission[]) => void;
}

const FINAL_LABEL: Record<ReportSubmission['finalStatus'], string> = {
  in_progress: '承認待ち',
  complete: '承認完了',
  returned_to_submitter: '差し戻し',
};

const FINAL_COLOR: Record<ReportSubmission['finalStatus'], string> = {
  in_progress: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-green-100 text-green-700',
  returned_to_submitter: 'bg-red-100 text-red-700',
};

const STEP_COLOR: Record<'waiting' | 'approved' | 'returned', string> = {
  waiting: 'bg-gray-100 text-gray-500',
  approved: 'bg-green-100 text-green-700',
  returned: 'bg-red-100 text-red-700',
};

const STEP_LABEL: Record<'waiting' | 'approved' | 'returned', string> = {
  waiting: '待機中', approved: '承認済', returned: '差し戻し',
};

const ReportApproval: React.FC<Props> = ({ reports, onUpdate }) => {
  const [selected, setSelected] = useState<ReportSubmission | null>(null);
  const [action, setAction] = useState<'approve' | 'return' | null>(null);
  const [comment, setComment] = useState('');

  const sorted = [...reports].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  const buildMailto = (to: string, subject: string, body: string) =>
    `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const decide = (act: 'approve' | 'return') => {
    if (!selected) return;
    const now = new Date().toISOString();
    const idx = selected.currentStepIndex;

    const steps = selected.steps.map((s, i) =>
      i === idx ? { ...s, status: act === 'approve' ? 'approved' as const : 'returned' as const, comment, decidedAt: now } : s
    );

    let nextIdx = idx;
    let finalStatus: ReportSubmission['finalStatus'] = 'in_progress';
    let notifyTo = '';
    let notifySubject = '';
    let notifyBody = '';
    const reportLink = `【日報内容】\n${selected.content}`;

    if (act === 'approve') {
      nextIdx = idx + 1;
      if (nextIdx >= steps.length) {
        finalStatus = 'complete';
        // 提出者に完了通知
        if (selected.submitterEmail) {
          notifyTo = selected.submitterEmail;
          notifySubject = `【日報承認完了】${selected.projectName} ${selected.date}`;
          notifyBody = `${selected.submitterName} 様\n\n${selected.projectName} ${selected.date} の日報がすべての承認者に承認されました。\n\n${reportLink}`;
        }
      } else {
        finalStatus = 'in_progress';
        steps[nextIdx] = { ...steps[nextIdx], status: 'waiting', comment: '', decidedAt: '' };
        notifyTo = steps[nextIdx].approverEmail;
        notifySubject = `【日報承認依頼】${selected.projectName} ${selected.date}`;
        notifyBody = `${steps[nextIdx].approverName} 様\n\n${selected.submitterName} より日報が提出されました。ご確認・承認をお願いします。\n\nコメント（前担当者）：${comment || 'なし'}\n\n${reportLink}`;
      }
    } else {
      if (idx === 0) {
        finalStatus = 'returned_to_submitter';
        if (selected.submitterEmail) {
          notifyTo = selected.submitterEmail;
          notifySubject = `【日報差し戻し】${selected.projectName} ${selected.date}`;
          notifyBody = `${selected.submitterName} 様\n\n${selected.projectName} ${selected.date} の日報が差し戻されました。\n\n差し戻しコメント：${comment || 'なし'}\n\n${reportLink}`;
        }
      } else {
        nextIdx = idx - 1;
        finalStatus = 'in_progress';
        steps[nextIdx] = { ...steps[nextIdx], status: 'waiting', comment: '', decidedAt: '' };
        notifyTo = steps[nextIdx].approverEmail;
        notifySubject = `【日報差し戻し・再承認依頼】${selected.projectName} ${selected.date}`;
        notifyBody = `${steps[nextIdx].approverName} 様\n\n${steps[idx].approverName} より差し戻しがありました。再確認をお願いします。\n\n差し戻しコメント：${comment || 'なし'}\n\n${reportLink}`;
      }
    }

    const updated: ReportSubmission = { ...selected, steps, currentStepIndex: nextIdx, finalStatus };
    onUpdate(reports.map(r => r.id === selected.id ? updated : r));
    setSelected(updated);
    setAction(null);
    setComment('');

    if (notifyTo) {
      window.open(buildMailto(notifyTo, notifySubject, notifyBody), '_self');
    }
  };

  if (selected) {
    const cur = selected.steps[selected.currentStepIndex];
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => { setSelected(null); setAction(null); setComment(''); }}
              className="text-blue-600 text-sm">← 一覧</button>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{selected.projectName || '(現場名未入力)'}</p>
              <p className="text-xs text-gray-500">{selected.date} · 提出：{selected.submitterName}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${FINAL_COLOR[selected.finalStatus]}`}>
              {FINAL_LABEL[selected.finalStatus]}
            </span>
          </div>

          {/* 承認ステップ一覧 */}
          <div className="space-y-2 mb-4">
            {selected.steps.map((step, i) => (
              <div key={step.approverId}
                className={`border rounded-xl p-3 ${i === selected.currentStepIndex && selected.finalStatus === 'in_progress' ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="font-bold text-gray-800 text-sm">{step.approverName}</span>
                  <span className="text-xs text-gray-400 truncate flex-1">{step.approverEmail}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STEP_COLOR[step.status]}`}>{STEP_LABEL[step.status]}</span>
                </div>
                {step.comment && <p className="text-xs text-gray-600 mt-1 ml-7">「{step.comment}」</p>}
                {step.decidedAt && <p className="text-xs text-gray-400 mt-0.5 ml-7">{step.decidedAt.slice(0, 16).replace('T', ' ')}</p>}
              </div>
            ))}
          </div>

          {/* 日報内容 */}
          <div className="border border-gray-100 rounded-xl p-3 bg-gray-50 mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">日報内容</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{selected.content}</pre>
          </div>

          {/* 承認アクション */}
          {selected.finalStatus === 'in_progress' && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-gray-700">担当：{cur?.approverName}</p>
              {!action ? (
                <div className="flex gap-2">
                  <button onClick={() => setAction('approve')} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl">承認する</button>
                  <button onClick={() => setAction('return')} className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl">差し戻す</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-bold text-gray-700">
                    {action === 'approve' ? '✓ 承認' : '↩ 差し戻し'} のコメント（任意）
                  </p>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="コメントを入力..."
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setAction(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl">戻る</button>
                    <button onClick={() => decide(action)}
                      className={`flex-1 text-white font-bold py-3 rounded-xl ${action === 'approve' ? 'bg-green-600' : 'bg-red-500'}`}>
                      {action === 'approve' ? '承認して次へ送る' : '差し戻す'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <h3 className="font-bold text-gray-800 mb-3">日報一覧（{reports.length}件）</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">提出された日報はありません</p>
      ) : (
        <div className="space-y-2">
          {sorted.map(r => (
            <button key={r.id} onClick={() => setSelected(r)}
              className="w-full text-left border border-gray-100 rounded-xl p-3 bg-gray-50 hover:bg-blue-50 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm">{r.projectName || '(現場名未入力)'} · {r.date}</p>
                  <p className="text-xs text-gray-500">提出者：{r.submitterName} · {r.submittedAt.slice(0, 10)}</p>
                  {r.finalStatus === 'in_progress' && (
                    <p className="text-xs text-blue-600 mt-0.5">現在の担当：{r.steps[r.currentStepIndex]?.approverName}</p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${FINAL_COLOR[r.finalStatus]}`}>
                  {FINAL_LABEL[r.finalStatus]}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportApproval;
