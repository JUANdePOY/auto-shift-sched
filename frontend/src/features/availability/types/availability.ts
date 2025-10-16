export interface AvailabilityDay {
  available: boolean;
  preferredStart?: string;
  preferredEnd?: string;
  startTime?: string;
  endTime?: string;
  timeBlocks?: TimeBlock[];
}

export interface TimeBlock {
  startTime: string;
  endTime: string;
  type?: 'available' | 'unavailable';
}

export interface Availability {
  monday?: AvailabilityDay;
  tuesday?: AvailabilityDay;
  wednesday?: AvailabilityDay;
  thursday?: AvailabilityDay;
  friday?: AvailabilityDay;
  saturday?: AvailabilityDay;
  sunday?: AvailabilityDay;
  [key: string]: AvailabilityDay | undefined;
}

export interface AvailabilitySubmission {
  employeeId: number;
  weekStart: string;
  availability: Availability;
  isLocked?: boolean;
  submissionDate?: string;
  status?: 'not_submitted' | 'submitted' | 'locked';
}

export interface AdminAvailabilitySubmission extends AvailabilitySubmission {
  id: number;
  employeeName: string;
  department: string;
  station: string | string[];
}

export interface AvailabilityStatus {
  weekStart: string;
  totalEmployees: number;
  submissions: number;
  locked: boolean;
  submissionRate: number;
}

export interface AvailabilityHistory {
  employeeId: number;
  history: AvailabilityHistoryItem[];
  totalSubmissions: number;
}

export interface AvailabilityHistoryItem {
  weekStart: string;
  availability: Availability;
  submissionDate: string;
  isLocked: boolean;
  status: string;
}
