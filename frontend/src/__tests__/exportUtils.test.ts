import { describe, it, expect } from 'vitest';
import { formatDateToYYYYMMDD, exportScheduleToExcel } from '../features/schedule/utils/exportUtils';
import * as XLSX from 'xlsx';

describe('formatDateToYYYYMMDD', () => {
  it('returns unchanged for date-only string', () => {
    expect(formatDateToYYYYMMDD('2025-11-10')).toBe('2025-11-10');
  });

  it('parses space-separated datetime strings', () => {
    expect(formatDateToYYYYMMDD('2025-11-10 00:00:00')).toBe('2025-11-10');
  });

  it('parses ISO strings with timezone', () => {
    expect(formatDateToYYYYMMDD('2025-11-10T00:00:00.000Z')).toBe('2025-11-10');
  });

  it('handles Date objects', () => {
    const d = new Date(2025, 11 - 1, 10); // November 10, months are 0-based
    expect(formatDateToYYYYMMDD(d)).toBe('2025-11-10');
  });

  it('returns empty string for invalid input', () => {
    // @ts-ignore - intentionally testing invalid input
    expect(formatDateToYYYYMMDD('not a date')).toBe('');
  });
});

describe('exportScheduleToExcel', () => {
  it('creates a workbook with Details sheet and daily sheets', () => {
    const shifts = [
      {
        id: 's1',
        title: 'Morning',
        startTime: '08:00',
        endTime: '12:00',
        date: '2025-12-15',
        requiredStation: ['front'],
        requiredEmployees: 2,
        assignedEmployees: ['e1'],
        assignedEmployeeNames: ['Alice'],
        isCompleted: false,
        priority: 'medium',
        department: 'Sales',
      },
      {
        id: 's2',
        title: 'Evening',
        startTime: '16:00',
        endTime: '20:00',
        date: '2025-12-16',
        requiredStation: ['back'],
        requiredEmployees: 1,
        assignedEmployees: [],
        assignedEmployeeNames: [],
        isCompleted: false,
        priority: 'low',
        department: 'Kitchen',
      },
    ];

    const weekStart = new Date('2025-12-15');

    let capturedWb: any = null;
    const writer = (wb: any, _filename: string) => { capturedWb = wb; };

    exportScheduleToExcel(shifts as any, weekStart, { writeFileFn: writer });

    expect(capturedWb).toBeTruthy();
    expect(Array.isArray(capturedWb.SheetNames)).toBe(true);
    // Should include our Details sheet
    expect(capturedWb.SheetNames).toContain('Details');
    // Details sheet should contain the two shifts
    const details = XLSX.utils.sheet_to_json(capturedWb.Sheets['Details']) as Record<string, unknown>[];
    expect(details.length).toBe(2);

    // Day sheet (Monday) should NOT include Department column — read starting at the data header row
    const monday = XLSX.utils.sheet_to_json(capturedWb.Sheets['Monday'], { range: 3 }) as Record<string, unknown>[];
    expect(monday.length).toBe(1);
    // Day sheet should not include these detail-only columns
    expect(Object.keys(monday[0])).not.toContain('Department');
    expect(Object.keys(monday[0])).not.toContain('Required Employees');
    expect(Object.keys(monday[0])).not.toContain('Assigned Employees Count');
    expect(Object.keys(monday[0])).not.toContain('Assigned Employee IDs');
    expect(Object.keys(monday[0])).not.toContain('Required Stations');
    expect(Object.keys(monday[0])).not.toContain('Priority');
    expect(Object.keys(monday[0])).not.toContain('Status');
    expect(Object.keys(monday[0])).not.toContain('Coverage %');
    // Still includes assigned names
    expect(Object.keys(monday[0])).toContain('Assigned Employee Names');

    // Start / End times should be in 12-hour format
    expect(monday[0]['Start Time']).toBe('8:00 AM');
    expect(monday[0]['End Time']).toBe('12:00 PM');

    // Details should still include Department and other details
    expect(Object.keys(details[0])).toContain('Department');
    expect(Object.keys(details[0])).toContain('Assigned Employee IDs');
    expect(Object.keys(details[0])).toContain('Required Stations');
    expect(Object.keys(details[0])).toContain('Priority');
    expect(Object.keys(details[0])).toContain('Status');
    expect(Object.keys(details[0])).toContain('Coverage %');

    // Details times should be 12-hour as well
    expect(details[0]['Start Time']).toBe('8:00 AM');
    expect(details[1]['Start Time']).toBe('4:00 PM');

    // Details should still include Department and other details
    expect(Object.keys(details[0])).toContain('Department');
    expect(Object.keys(details[0])).toContain('Assigned Employee IDs');
    expect(Object.keys(details[0])).toContain('Required Stations');
    expect(Object.keys(details[0])).toContain('Priority');
    expect(Object.keys(details[0])).toContain('Status');
    expect(Object.keys(details[0])).toContain('Coverage %');
  });
});
