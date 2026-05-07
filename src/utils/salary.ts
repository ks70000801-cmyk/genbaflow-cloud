import { WorkLog, Employee, PayrollLineItem, HolidayType } from '../../types';
import { isHoliday } from './holidays';

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// 深夜時間帯（22:00〜翌05:00）の分数を算出
function calcLateNightMinutes(startHHMM: string, endHHMM: string): number {
  let start = toMinutes(startHHMM);
  let end   = toMinutes(endHHMM);
  if (end <= start) end += 1440; // 日をまたぐ

  let ln = 0;
  for (let t = start; t < end; t++) {
    const m = t % 1440;
    if (m >= 1320 || m < 300) ln++; // 22:00-24:00 or 00:00-05:00
  }
  return ln;
}

export function calcDayPay(
  log: WorkLog,
  employee: Employee,
  holidayType: HolidayType,
): Pick<PayrollLineItem, 'regularHours'|'overtimeHours'|'lateNightHours'|'holidayHours'|'regularPay'|'overtimePay'|'lateNightPay'|'holidayPay'> {
  const rate = employee.hourlyRate;
  const start = toMinutes(log.startTime);
  const endRaw = toMinutes(log.endTime);
  const end = endRaw <= start ? endRaw + 1440 : endRaw;

  const totalMins = Math.max(0, end - start - log.breakMinutes);
  const totalHours = totalMins / 60;

  const holiday = log.isHolidayOverride != null
    ? log.isHolidayOverride
    : isHoliday(log.date, holidayType);

  const lnMins   = calcLateNightMinutes(log.startTime, log.endTime);
  const lnHours  = Math.min(lnMins / 60, totalHours);

  if (holiday) {
    // 法定休日：全時間 1.35倍、深夜追加 0.25倍
    const holidayPay   = totalHours * rate * 1.35;
    const lateNightPay = lnHours   * rate * 0.25;
    return {
      regularHours: 0, overtimeHours: 0,
      lateNightHours: lnHours, holidayHours: totalHours,
      regularPay: 0, overtimePay: 0,
      lateNightPay, holidayPay,
    };
  }

  // 平日：8時間以内は通常、超過は1.25倍
  const regularHours  = Math.min(totalHours, 8);
  const overtimeHours = Math.max(0, totalHours - 8);

  const regularPay  = regularHours  * rate * 1.0;
  const overtimePay = overtimeHours * rate * 1.25;
  const lateNightPay = lnHours * rate * 0.25; // 深夜割増（基礎賃金に上乗せ）

  return {
    regularHours, overtimeHours,
    lateNightHours: lnHours, holidayHours: 0,
    regularPay, overtimePay, lateNightPay, holidayPay: 0,
  };
}

export function calcMonthlyPayroll(
  employee: Employee,
  logs: WorkLog[],
  holidayType: HolidayType,
): PayrollLineItem {
  const totals = {
    regularHours: 0, overtimeHours: 0, lateNightHours: 0, holidayHours: 0,
    regularPay: 0, overtimePay: 0, lateNightPay: 0, holidayPay: 0,
  };

  for (const log of logs) {
    const d = calcDayPay(log, employee, holidayType);
    totals.regularHours   += d.regularHours;
    totals.overtimeHours  += d.overtimeHours;
    totals.lateNightHours += d.lateNightHours;
    totals.holidayHours   += d.holidayHours;
    totals.regularPay     += d.regularPay;
    totals.overtimePay    += d.overtimePay;
    totals.lateNightPay   += d.lateNightPay;
    totals.holidayPay     += d.holidayPay;
  }

  const totalPay = Math.round(
    totals.regularPay + totals.overtimePay + totals.lateNightPay + totals.holidayPay
  );

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    hourlyRate: employee.hourlyRate,
    ...totals,
    totalPay,
  };
}
