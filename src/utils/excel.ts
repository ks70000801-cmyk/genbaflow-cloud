import * as XLSX from 'xlsx';
import { PayrollLineItem } from '../../types';

function round1(n: number) { return Math.round(n * 10) / 10; }

export function exportPayrollToExcel(
  items: PayrollLineItem[],
  year: number,
  month: number,
): void {
  const header = [
    '氏名', '時給(円)',
    '通常時間', '残業時間', '深夜時間', '休日時間',
    '通常賃金', '残業手当', '深夜手当', '休日手当', '合計支給額(円)',
  ];

  const rows = items.map(i => [
    i.employeeName,
    i.hourlyRate,
    round1(i.regularHours),
    round1(i.overtimeHours),
    round1(i.lateNightHours),
    round1(i.holidayHours),
    Math.round(i.regularPay),
    Math.round(i.overtimePay),
    Math.round(i.lateNightPay),
    Math.round(i.holidayPay),
    i.totalPay,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // 列幅
  ws['!cols'] = [
    { wch: 14 }, { wch: 10 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `${year}年${month}月 給与`);
  XLSX.writeFile(wb, `給与計算_${year}${String(month).padStart(2,'0')}.xlsx`);
}
