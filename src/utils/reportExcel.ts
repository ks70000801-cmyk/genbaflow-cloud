import * as XLSX from 'xlsx';
import { DailyReportData } from '../../types';

export function exportDailyReportToExcel(data: DailyReportData): void {
  const rows: (string | number)[][] = [];

  rows.push(['現場名', data.projectName || '未入力']);
  rows.push(['日付', data.date]);
  rows.push([]);

  rows.push(['■ 作業員']);
  rows.push(['氏名', '開始', '終了', '休憩(分)']);
  if (data.workers.length > 0) {
    for (const w of data.workers) {
      rows.push([w.name || '(未入力)', w.startTime, w.endTime, w.breakMinutes]);
    }
  } else {
    rows.push(['なし', '', '', '']);
  }
  rows.push([]);

  rows.push(['■ 下請け業者']);
  rows.push(['業者名', '人数']);
  if (data.subcontractors.length > 0) {
    for (const s of data.subcontractors) {
      rows.push([s.name || '(未入力)', s.count]);
    }
  } else {
    rows.push(['なし', '']);
  }
  rows.push([]);

  rows.push(['■ 本日の作業内容', data.workContent || '(未入力)']);
  rows.push(['■ 使用機械・車両', data.machinesUsed || 'なし']);
  rows.push(['■ 搬入資材・購入品', data.materialsProcurement || 'なし']);
  rows.push(['■ 安全・注意事項', data.safetyNotes]);
  rows.push(['■ 明日の予定', data.tomorrowPlan || '未定']);
  rows.push(['■ メモ・特記事項', data.memo || 'なし']);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 22 }, { wch: 40 }, { wch: 10 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '日報');
  XLSX.writeFile(wb, `日報_${data.projectName || '現場'}_${data.date}.xlsx`);
}
