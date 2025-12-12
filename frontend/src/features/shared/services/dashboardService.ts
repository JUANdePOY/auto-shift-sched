import type { WeeklySchedule, ScheduleConflict } from '../types';

const API_URL = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  assignments: Array<{
    shift_id: number;
    employee_id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    employee_name: string;
    requiredEmployees: number;
  }>;
  conflicts: ScheduleConflict[];
  coverageRate: number;
  totalShifts: number;
  coveredShifts: number;
}

export interface EmployeeUtilization {
  weekStart: string;
  averageUtilization: number;
  employeesScheduled: number;
  totalEmployees: number;
  employeeDetails: Array<{
    employeeId: string;
    employeeName: string;
    maxHoursPerWeek: number;
    scheduledHours: string;
    utilizationPercentage: number;
  }>;
}

export interface MonthlyOverview {
  month: string;
  currentMonth: {
    totalShifts: number;
    totalAssignments: number;
    uniqueEmployees: number;
    totalHours: string;
    averageCoverageRate: number;
  };
  percentageChanges: {
    assignmentsChange: number;
    shiftsCovered: number;
  };
}

export interface ActivityItem {
  type: string;
  description: string;
  timeAgo: string;
}

export const dashboardService = {
  /**
   * Get weekly schedule summary with conflicts
   */
  async getWeekSummary(weekStart: string): Promise<WeekSummary> {
    const response = await fetch(`${API_URL}/schedule/dashboard/week-summary/${weekStart}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch week summary: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Get employee utilization for a week
   */
  async getEmployeeUtilization(weekStart: string): Promise<EmployeeUtilization> {
    const response = await fetch(`${API_URL}/schedule/dashboard/employee-utilization/${weekStart}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch employee utilization: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Get monthly overview statistics
   */
  async getMonthlyOverview(): Promise<MonthlyOverview> {
    const response = await fetch(`${API_URL}/schedule/dashboard/monthly-overview`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch monthly overview: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Get recent activity feed
   */
  async getRecentActivity(): Promise<ActivityItem[]> {
    const response = await fetch(`${API_URL}/schedule/dashboard/recent-activity`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch recent activity: ${response.statusText}`);
    }
    return response.json();
  },
};
