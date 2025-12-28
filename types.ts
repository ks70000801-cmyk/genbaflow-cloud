
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
