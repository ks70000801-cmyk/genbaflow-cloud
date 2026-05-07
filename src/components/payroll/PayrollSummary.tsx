import React from 'react';
import { PayrollLineItem } from '../../../types';
import { exportPayrollToExcel } from '../../utils/excel';

interface Props {
  items: PayrollLineItem[];
  year: number;
  month: number;
}

function fmt(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

const PayrollSummary: React.FC<Props> = ({ items, year, month }) => {
  const total = items.reduce(
    (acc, i) => ({
      regularHours:   acc.regularHours   + i.regularHours,
      overtimeHours:  acc.overtimeHours  + i.overtimeHours,
      lateNightHours: acc.lateNightHours + i.lateNightHours,
      holidayHours:   acc.holidayHours   + i.holidayHours,
      totalPay:       acc.totalPay       + i.totalPay,
    }),
    { regularHours: 0, overtimeHours: 0, lateNightHours: 0, holidayHours: 0, totalPay: 0 },
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">{year}年{month}月 給与明細</h3>
          <button
            onClick={() => exportPayrollToExcel(items, year, month)}
            disabled={items.length === 0}
            className="bg-green-600 disabled:bg-gray-300 text-white text-sm font-bold px-4 py-2 rounded-xl"
          >
            Excel出力
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">該当月の勤怠記録がありません</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.employeeId} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.employeeName}</p>
                    <p className="text-xs text-gray-500">時給 ¥{item.hourlyRate.toLocaleString()}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">¥{item.totalPay.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 border-t border-gray-100 pt-2">
                  <span>通常 {fmt(item.regularHours)}h → ¥{Math.round(item.regularPay).toLocaleString()}</span>
                  <span>残業 {fmt(item.overtimeHours)}h → ¥{Math.round(item.overtimePay).toLocaleString()}</span>
                  <span>深夜 {fmt(item.lateNightHours)}h → ¥{Math.round(item.lateNightPay).toLocaleString()}</span>
                  <span>休日 {fmt(item.holidayHours)}h → ¥{Math.round(item.holidayPay).toLocaleString()}</span>
                </div>
              </div>
            ))}

            <div className="border-t-2 border-gray-200 pt-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p className="font-bold">合計 ({items.length}名)</p>
                <p className="text-xs">
                  通常{fmt(total.regularHours)}h / 残業{fmt(total.overtimeHours)}h / 深夜{fmt(total.lateNightHours)}h / 休日{fmt(total.holidayHours)}h
                </p>
              </div>
              <p className="text-xl font-bold text-blue-700">¥{total.totalPay.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollSummary;
