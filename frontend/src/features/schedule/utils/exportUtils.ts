import * as XLSX from 'xlsx';

interface ExportShift {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  // Date may be a date-only string, an ISO string, or a Date object
  date: string | Date;
  requiredStation: string[];
  requiredEmployees: number;
  assignedEmployees: string[];
  assignedEmployeeNames?: string[];
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  department: string;
}

export const exportScheduleToExcel = (
  shifts: ExportShift[],
  weekStart: Date,
  options?: { writeFileFn?: (wb: any, filename: string) => void }
) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Calculate week end date
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  // Prepare summary data
  const summaryData = [
    ['Weekly Schedule Export'],
    [`Week of: ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`],
    [`Total Shifts: ${shifts.length}`],
    [`Generated on: ${new Date().toLocaleString()}`],
    [''], // Empty row
  ];

  // Create summary worksheet
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Define days of the week starting from Monday
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Column widths for the Details sheet
  const colWidths = [
    { wch: 8 },  // Shift ID
    { wch: 25 }, // Shift Title
    { wch: 10 }, // Start Time
    { wch: 10 }, // End Time
    { wch: 15 }, // Duration
    { wch: 15 }, // Department
    { wch: 18 }, // Required Employees
    { wch: 22 }, // Assigned Employees Count
    { wch: 30 }, // Assigned Employee Names
    { wch: 25 }, // Assigned Employee IDs
    { wch: 20 }, // Required Stations
    { wch: 10 }, // Priority
    { wch: 10 }, // Status
    { wch: 12 }, // Coverage %
  ];

  // Day-specific widths (omit Department and several detail-only columns)
  const dayRemovedIdx = new Set([5, 6, 7, 9, 10, 11, 12, 13]); // Dept, Required Employees, Assigned Count, Assigned IDs, Required Stations, Priority, Status, Coverage
  const dayColWidths = colWidths.filter((_, idx) => !dayRemovedIdx.has(idx));

  // For each day of the week, create a sheet with a top header and the day's shifts
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = formatDateToYYYYMMDD(currentDate);

    // Filter shifts for this date
    const dayShifts = shifts.filter(shift => formatDateToYYYYMMDD(shift.date) === dateStr);

    // Sort shifts by start time
    const sortedDayShifts = [...dayShifts].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Prepare data for this day's sheet (exclude Department and detail-only columns)
    const data = sortedDayShifts.map(shift => ({
      'Shift ID': shift.id,
      'Shift Title': shift.title,
      'Start Time': formatTimeTo12Hour(shift.startTime),
      'End Time': formatTimeTo12Hour(shift.endTime),
      'Duration (hours)': calculateDuration(shift.startTime, shift.endTime),
      'Assigned Employee Names': shift.assignedEmployeeNames?.join('; ') || 'Unassigned',
    }));

    // Day header (two info rows plus an empty row)
    const dayHeader = [
      [`${daysOfWeek[i]} - ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`],
      [`Shifts: ${dayShifts.length}`],
      [''], // Empty row
    ];

    // Create worksheet starting with the header, then add JSON data below it
    const ws = XLSX.utils.aoa_to_sheet(dayHeader);

    if (data.length > 0) {
      // Add data starting after the header rows, letting sheet_add_json write column headers
      XLSX.utils.sheet_add_json(ws, data, { origin: `A${dayHeader.length + 1}` });
    } else {
      // No shifts: write a placeholder message
      XLSX.utils.sheet_add_aoa(ws, [['No shifts for this day']], { origin: `A${dayHeader.length + 1}` });
    }

    // Use day-specific column widths (no Department column)
    ws['!cols'] = dayColWidths;

    // Append sheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, daysOfWeek[i]);
  }

  // Add a 'Details' sheet that lists all shifts for the week (with date included)
  const detailsData = [...shifts]
    .map(shift => ({
      Date: formatDateToYYYYMMDD(shift.date),
      'Shift ID': shift.id,
      'Shift Title': shift.title,
      'Start Time': formatTimeTo12Hour(shift.startTime),
      'End Time': formatTimeTo12Hour(shift.endTime),
      'Duration (hours)': calculateDuration(shift.startTime, shift.endTime),

      Department: shift.department || 'Not specified',
      'Required Employees': shift.requiredEmployees,
      'Assigned Employees Count': shift.assignedEmployees?.length || 0,
      'Assigned Employee Names': shift.assignedEmployeeNames?.join('; ') || 'Unassigned',
      'Assigned Employee IDs': shift.assignedEmployees?.join('; ') || 'Unassigned',
      'Required Stations': shift.requiredStation?.join('; ') || 'Not specified',
      Priority: shift.priority.charAt(0).toUpperCase() + shift.priority.slice(1),
      Status: shift.isCompleted ? 'Completed' : 'Pending',
      'Coverage %': shift.requiredEmployees > 0 ? Math.round((shift.assignedEmployees?.length || 0) / shift.requiredEmployees * 100) : 0,
    }))
    .sort((a, b) => (a.Date === b.Date ? String(a['Start Time']).localeCompare(String(b['Start Time'])) : String(a.Date).localeCompare(String(b.Date))));

  const detailsWs = XLSX.utils.json_to_sheet(detailsData);
  // Optionally set column widths for details as well
  detailsWs['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, detailsWs, 'Details');

  // Generate filename with week start and end dates
  const weekStartStr = formatDateToYYYYMMDD(weekStart);
  const weekEndStr = formatDateToYYYYMMDD(weekEnd);
  const filename = `weekly_schedule_${weekStartStr}_to_${weekEndStr}.xlsx`;

  // Write file (allow tests to override write behavior)
  const writer = options?.writeFileFn ?? XLSX.writeFile;
  writer(wb, filename);
};

// Normalize various date inputs to a YYYY-MM-DD string (works with date-only strings,
// ISO/datetime strings and Date objects). Prefers extracting the date from strings
// to avoid timezone-induced shifts when an input contains time or zone.
export const formatDateToYYYYMMDD = (input: string | Date | undefined | null): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  if (!input && input !== 0) return '';

  if (typeof input === 'string') {
    const datePart = input.trim().split('T')[0].split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;

    const parsed = new Date(input);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
    }

    return '';
  }

  if (input instanceof Date) {
    return `${input.getFullYear()}-${pad(input.getMonth() + 1)}-${pad(input.getDate())}`;
  }

  return '';
};

// Helper function to calculate duration between start and end times
const calculateDuration = (startTime: string, endTime: string): number => {
  try {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    const durationMinutes = endMinutes >= startMinutes
      ? endMinutes - startMinutes
      : (24 * 60 - startMinutes) + endMinutes;

    return Math.round((durationMinutes / 60) * 100) / 100; // Round to 2 decimal places
  } catch {
    return 0;
  }
};

// Convert a 24-hour time string (HH:MM) to 12-hour format with AM/PM (e.g., "16:00" -> "4:00 PM")
const formatTimeTo12Hour = (time: string): string => {
  if (!time) return '';
  const m = time.toString().trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return time;
  let h = Number(m[1]);
  const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${min} ${ampm}`;
};
