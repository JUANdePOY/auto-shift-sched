export interface CrewShift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  station: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface CrewAvailability {
  id: string;
  weekStart: string;
  preferences: {
    [day: string]: {
      available: boolean;
      preferredTimes: string[];
      startTime?: string;
      endTime?: string;
      requestRestDay: boolean;
      notes?: string;
    };
  };
  submittedAt: string;
}

export interface CrewProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  station?: string;
  maxHoursPerWeek: number;
  currentWeeklyHours: number;
  role: string;
  totalHoursThisMonth: number;
  totalHoursThisWeek: number;
  averageHoursPerWeek: number;
  upcomingShifts: number;
}

export interface CrewStats {
  totalHoursWorked: number;
  shiftsCompleted: number;
  averageShiftLength: number;
  reliabilityScore: number;
}
