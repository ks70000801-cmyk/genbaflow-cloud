
export type AppMode = 'FIELD' | 'ADMIN';
export type PlanTier = 'BASIC' | 'PRO';

export interface WorkerEntry {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hourlyRate: number;
}

export interface SubcontractorEntry {
  id: string;
  name: string;
  count: number;
}

export interface DailyReportData {
  projectName: string;
  date: string;
  workers: WorkerEntry[];
  subcontractors: SubcontractorEntry[];
  workContent: string;
  machinesUsed: string;
  materialsProcurement: string;
  safetyNotes: string;
  tomorrowPlan: string;
  memo: string;
}

// ── 給与管理 ──────────────────────────────────────

export type EmploymentType = '正社員' | 'パート' | 'アルバイト' | '契約社員';
export type UserRole = 'admin' | 'worker';
export type HolidayType = 'sun_holiday' | 'sat_sun_holiday';

export interface Employee {
  id: string;
  name: string;
  hourlyRate: number;
  employmentType: EmploymentType;
  role: UserRole;
  pin: string; // 4桁
}

export interface WorkLog {
  id: string;
  employeeId: string;
  date: string;        // YYYY-MM-DD
  startTime: string;   // HH:MM
  endTime: string;     // HH:MM
  breakMinutes: number;
  isHolidayOverride?: boolean | null; // null = 自動判定
}

export interface PayrollSettings {
  holidayType: HolidayType;
  year: number;
  month: number; // 1-12
}

// ── ワークフロー ──────────────────────────────────────────────

export interface WorkflowApprover {
  id: string;
  name: string;
  email: string;
  order: number; // 1-based、昇順で承認ルートを決定
}

export interface ApprovalStep {
  approverId: string;
  approverName: string;
  approverEmail: string;
  status: 'waiting' | 'approved' | 'returned';
  comment: string;
  decidedAt: string;
}

export interface DailyReport {
  id: string;
  projectName: string;
  date: string;
  content: string;
  createdAt: string;
}

export interface ReportSubmission {
  id: string;
  projectName: string;
  date: string;
  content: string;
  submittedAt: string;
  submitterName: string;
  submitterEmail: string;
  steps: ApprovalStep[];
  currentStepIndex: number;
  finalStatus: 'in_progress' | 'complete' | 'returned_to_submitter';
}

export interface PayrollLineItem {
  employeeId: string;
  employeeName: string;
  hourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  lateNightHours: number;
  holidayHours: number;
  regularPay: number;
  overtimePay: number;
  lateNightPay: number;
  holidayPay: number;
  totalPay: number;
}
