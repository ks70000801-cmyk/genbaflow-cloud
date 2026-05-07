import React, { useState } from 'react';
import { Employee, WorkLog, PayrollSettings, HolidayType, UserRole, WorkflowApprover, ReportSubmission } from '../../../types';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { calcMonthlyPayroll } from '../../utils/salary';
import LoginScreen from './LoginScreen';
import EmployeeMaster from './EmployeeMaster';
import TimesheetInput from './TimesheetInput';
import PayrollSummary from './PayrollSummary';
import WorkflowSettings from '../workflow/WorkflowSettings';
import ReportApproval from '../workflow/ReportApproval';

type Tab = 'timesheet' | 'master' | 'payroll' | 'workflow';

interface LoginState {
  role: UserRole;
  employee: Employee | null;
}

interface Props {
  onBack?: () => void;
}

const TABS: { key: Tab; label: string; adminOnly: boolean }[] = [
  { key: 'timesheet', label: '勤怠入力',     adminOnly: false },
  { key: 'master',    label: '社員マスター', adminOnly: true },
  { key: 'payroll',   label: '給与明細',     adminOnly: true },
  { key: 'workflow',  label: 'ワークフロー', adminOnly: true },
];

const PayrollApp: React.FC<Props> = ({ onBack }) => {
  const [employees,         setEmployees]         = useLocalStorage<Employee[]>('payroll_employees', []);
  const [workLogs,          setWorkLogs]          = useLocalStorage<WorkLog[]>('payroll_worklogs', []);
  const [adminPin,          setAdminPin]          = useLocalStorage<string>('payroll_admin_pin', '0000');
  const [workflowApprovers, setWorkflowApprovers] = useLocalStorage<WorkflowApprover[]>('workflow_approvers', []);
  const [workflowReports,   setWorkflowReports]   = useLocalStorage<ReportSubmission[]>('workflow_reports', []);
  const [settings,          setSettings]          = useLocalStorage<PayrollSettings>('payroll_settings', {
    holidayType: 'sun_holiday',
    year:  new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  const [loginState, setLoginState] = useState<LoginState | null>(null);
  const [tab, setTab] = useState<Tab>('timesheet');

  const handleLogin = (role: UserRole, employee: Employee | null) => {
    setLoginState({ role, employee });
    setTab('timesheet');
  };

  if (!loginState) {
    return (
      <div className="relative">
        {onBack && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={onBack}
              className="text-sm text-gray-500 border border-gray-200 bg-white rounded-lg px-3 py-1"
            >
              ← 日報に戻る
            </button>
          </div>
        )}
        <LoginScreen employees={employees} adminPin={adminPin} onLogin={handleLogin} />
      </div>
    );
  }

  const isAdmin = loginState.role === 'admin';
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const monthPrefix = `${settings.year}-${pad2(settings.month)}`;

  const payrollItems = employees
    .map(emp =>
      calcMonthlyPayroll(
        emp,
        workLogs.filter(l => l.employeeId === emp.id && l.date.startsWith(monthPrefix)),
        settings.holidayType,
      ),
    )
    .filter(i => i.regularHours + i.overtimeHours + i.lateNightHours + i.holidayHours > 0);

  const visibleTabs = TABS.filter(t => !t.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-blue-200 text-sm">← 日報</button>
            )}
            <div>
              <h1 className="text-lg font-bold">給与管理</h1>
              <p className="text-blue-200 text-xs">{isAdmin ? '管理者' : loginState.employee?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setLoginState(null)}
            className="text-blue-200 text-sm border border-blue-400 rounded-lg px-3 py-1"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="bg-white border-b border-gray-200 sticky top-[72px] z-10">
        <div className="max-w-lg mx-auto flex">
          {visibleTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-bold border-b-2 transition ${
                tab === t.key ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 pb-8">
        {tab === 'payroll' && isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">年</p>
                <select
                  value={settings.year}
                  onChange={e => setSettings(s => ({ ...s, year: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50"
                >
                  {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}年</option>)}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">月</p>
                <select
                  value={settings.month}
                  onChange={e => setSettings(s => ({ ...s, month: Number(e.target.value) }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">休日</p>
                <select
                  value={settings.holidayType}
                  onChange={e => setSettings(s => ({ ...s, holidayType: e.target.value as HolidayType }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-gray-50"
                >
                  <option value="sun_holiday">日曜のみ</option>
                  <option value="sat_sun_holiday">土日</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {tab === 'timesheet' && (
          <TimesheetInput
            employees={employees}
            logs={workLogs}
            onUpdate={setWorkLogs}
            filterEmployeeId={isAdmin ? undefined : loginState.employee?.id}
          />
        )}
        {tab === 'master' && isAdmin && (
          <EmployeeMaster
            employees={employees}
            adminPin={adminPin}
            onUpdate={setEmployees}
            onUpdateAdminPin={setAdminPin}
          />
        )}
        {tab === 'payroll' && isAdmin && (
          <PayrollSummary
            items={payrollItems}
            year={settings.year}
            month={settings.month}
          />
        )}
        {tab === 'workflow' && isAdmin && (
          <div className="space-y-4">
            <WorkflowSettings
              approvers={workflowApprovers}
              onUpdate={setWorkflowApprovers}
            />
            <ReportApproval
              reports={workflowReports}
              onUpdate={setWorkflowReports}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollApp;
