import type { Employee, Shift, AISuggestion, ScheduleConflict, WeeklySchedule } from '../types';

export const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Manager',
    skills: ['leadership', 'customer_service', 'cash_handling'],
    availability: {
      monday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
      tuesday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
      wednesday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
      thursday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
      friday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
      saturday: { available: false },
      sunday: { available: false }
    },
    maxHoursPerWeek: 40,
    currentWeeklyHours: 32
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@company.com',
    role: 'Sales Associate',
    skills: ['customer_service', 'sales', 'inventory'],
    availability: {
      monday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' },
      tuesday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' },
      wednesday: { available: false },
      thursday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' },
      friday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' },
      saturday: { available: true, preferredStart: '10:00', preferredEnd: '18:00' },
      sunday: { available: true, preferredStart: '10:00', preferredEnd: '18:00' }
    },
    maxHoursPerWeek: 35,
    currentWeeklyHours: 28
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    email: 'emma.rodriguez@company.com',
    role: 'Cashier',
    skills: ['cash_handling', 'customer_service'],
    availability: {
      monday: { available: true, preferredStart: '08:00', preferredEnd: '16:00' },
      tuesday: { available: true, preferredStart: '08:00', preferredEnd: '16:00' },
      wednesday: { available: true, preferredStart: '08:00', preferredEnd: '16:00' },
      thursday: { available: false },
      friday: { available: true, preferredStart: '08:00', preferredEnd: '16:00' },
      saturday: { available: true, preferredStart: '09:00', preferredEnd: '17:00' },
      sunday: { available: false }
    },
    maxHoursPerWeek: 30,
    currentWeeklyHours: 24
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.wilson@company.com',
    role: 'Stock Clerk',
    skills: ['inventory', 'stocking', 'organization'],
    availability: {
      monday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
      tuesday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
      wednesday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
      thursday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
      friday: { available: true, preferredStart: '06:00', preferredEnd: '14:00' },
      saturday: { available: false },
      sunday: { available: true, preferredStart: '07:00', preferredEnd: '15:00' }
    },
    maxHoursPerWeek: 40,
    currentWeeklyHours: 35
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    role: 'Part-time Associate',
    skills: ['customer_service', 'cash_handling'],
    availability: {
      monday: { available: false },
      tuesday: { available: false },
      wednesday: { available: true, preferredStart: '16:00', preferredEnd: '22:00' },
      thursday: { available: true, preferredStart: '16:00', preferredEnd: '22:00' },
      friday: { available: true, preferredStart: '16:00', preferredEnd: '22:00' },
      saturday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' },
      sunday: { available: true, preferredStart: '12:00', preferredEnd: '20:00' }
    },
    maxHoursPerWeek: 25,
    currentWeeklyHours: 18
  }
];

export const mockShifts: Shift[] = [
  {
    id: 's1',
    title: 'Morning Shift - Customer Service',
    startTime: '08:00',
    endTime: '16:00',
    date: '2025-01-20',
    requiredSkills: ['customer_service'],
    requiredEmployees: 2,
    assignedEmployees: ['3'],
    isCompleted: false,
    priority: 'high',
    department: 'retail'
  },
  {
    id: 's2',
    title: 'Afternoon Shift - Sales',
    startTime: '12:00',
    endTime: '20:00',
    date: '2025-01-20',
    requiredSkills: ['sales', 'customer_service'],
    requiredEmployees: 2,
    assignedEmployees: ['2'],
    isCompleted: false,
    priority: 'medium',
    department: 'retail'
  },
  {
    id: 's3',
    title: 'Evening Shift - Operations',
    startTime: '16:00',
    endTime: '22:00',
    date: '2025-01-20',
    requiredSkills: ['customer_service', 'cash_handling'],
    requiredEmployees: 1,
    assignedEmployees: [],
    isCompleted: false,
    priority: 'medium',
    department: 'retail'
  },
  {
    id: 's4',
    title: 'Stock Management',
    startTime: '06:00',
    endTime: '14:00',
    date: '2025-01-21',
    requiredSkills: ['inventory', 'stocking'],
    requiredEmployees: 1,
    assignedEmployees: ['4'],
    isCompleted: false,
    priority: 'high',
    department: 'warehouse'
  }
];

// AI Suggestion Engine
export class AISchedulingEngine {
  static generateSuggestions(
    shifts: Shift[],
    employees: Employee[]
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Find understaffed shifts
    shifts.forEach(shift => {
      if (shift.assignedEmployees.length < shift.requiredEmployees) {
        const availableEmployees = this.findAvailableEmployees(shift, employees);
        const bestMatch = this.findBestEmployeeMatch(shift, availableEmployees);
        
        if (bestMatch) {
          suggestions.push({
            id: `suggest_${shift.id}_${bestMatch.id}`,
            type: 'assignment',
            title: `Assign ${bestMatch.name} to ${shift.title}`,
            description: `${bestMatch.name} has the required skills and is available during this time slot.`,
            confidence: this.calculateConfidence(shift, bestMatch),
            impact: {
              efficiency: 85,
              satisfaction: 78,
              coverage: 95
            },
            action: {
              type: 'assign',
              shiftId: shift.id,
              employeeId: bestMatch.id
            }
          });
        }
      }
    });

    // Suggest optimizations for overstaffed shifts
    shifts.forEach(shift => {
      if (shift.assignedEmployees.length > shift.requiredEmployees) {
        const leastOptimalEmployee = this.findLeastOptimalEmployee(shift, employees);
        if (leastOptimalEmployee) {
          suggestions.push({
            id: `optimize_${shift.id}_${leastOptimalEmployee.id}`,
            type: 'optimization',
            title: `Optimize staffing for ${shift.title}`,
            description: `Consider reassigning ${leastOptimalEmployee.name} to improve schedule efficiency.`,
            confidence: 72,
            impact: {
              efficiency: 90,
              satisfaction: 65,
              coverage: 88
            },
            action: {
              type: 'unassign',
              shiftId: shift.id,
              employeeId: leastOptimalEmployee.id
            }
          });
        }
      }
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private static findAvailableEmployees(shift: Shift, employees: Employee[]): Employee[] {
    const shiftDate = new Date(shift.date);
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = dayNames[shiftDate.getDay()];
    
    return employees.filter(employee => {
      const availability = employee.availability[dayOfWeek];
      if (!availability?.available) return false;
      
      // Check if employee already assigned to this shift
      if (shift.assignedEmployees.includes(employee.id)) return false;
      
      // Check time conflicts (simplified)
      return true;
    });
  }

  private static findBestEmployeeMatch(shift: Shift, availableEmployees: Employee[]): Employee | null {
    let bestScore = -1;
    let bestEmployee: Employee | null = null;

    availableEmployees.forEach(employee => {
      let score = 0;
      
      // Skill matching (most important factor)
      const matchingSkills = shift.requiredSkills.filter(skill => 
        employee.skills.includes(skill)
      ).length;
      score += (matchingSkills / shift.requiredSkills.length) * 60;
      
      // Availability preference
      score += 25;
      
      // Work-life balance (prefer employees with lower current hours)
      const utilizationRate = employee.currentWeeklyHours / employee.maxHoursPerWeek;
      score += (1 - utilizationRate) * 15;
      
      if (score > bestScore) {
        bestScore = score;
        bestEmployee = employee;
      }
    });

    return bestEmployee;
  }

  private static findLeastOptimalEmployee(shift: Shift, employees: Employee[]): Employee | null {
    const assignedEmployees = employees.filter(emp => 
      shift.assignedEmployees.includes(emp.id)
    );
    
    if (assignedEmployees.length <= shift.requiredEmployees) return null;
    
    // Return the employee with lowest skill match if overstaffed
    return assignedEmployees.reduce((lowest, current) => {
      const currentSkillMatch = shift.requiredSkills.filter(skill => 
        current.skills.includes(skill)
      ).length;
      const lowestSkillMatch = shift.requiredSkills.filter(skill => 
        lowest.skills.includes(skill)
      ).length;
      
      return currentSkillMatch < lowestSkillMatch ? current : lowest;
    });
  }

  private static calculateConfidence(shift: Shift, employee: Employee): number {
    const skillMatch = shift.requiredSkills.filter(skill => 
      employee.skills.includes(skill)
    ).length / shift.requiredSkills.length;
    
    return Math.round(60 + (skillMatch * 30));
  }

  static calculateScheduleEfficiency(shifts: Shift[], employees: Employee[]): number {
    if (shifts.length === 0) return 100;
    
    let totalScore = 0;
    let maxScore = 0;
    
    shifts.forEach(shift => {
      maxScore += 100; // Each shift can have a max score of 100
      
      // Coverage score (40 points)
      const coverageRate = Math.min(shift.assignedEmployees.length / shift.requiredEmployees, 1);
      totalScore += coverageRate * 40;
      
      // Skill matching score (35 points)
      let skillMatchScore = 0;
      shift.assignedEmployees.forEach(empId => {
        const employee = employees.find(emp => emp.id === empId);
        if (employee) {
          const matchingSkills = shift.requiredSkills.filter(skill => 
            employee.skills.includes(skill)
          ).length;
          skillMatchScore += (matchingSkills / shift.requiredSkills.length) * 35;
        }
      });
      totalScore += skillMatchScore / Math.max(shift.assignedEmployees.length, 1);
      
      // Priority fulfillment (25 points)
      if (shift.priority === 'high' && coverageRate === 1) {
        totalScore += 25;
      } else if (shift.priority === 'medium' && coverageRate >= 0.5) {
        totalScore += 20;
      } else if (shift.priority === 'low' && coverageRate > 0) {
        totalScore += 15;
      }
    });
    
    return Math.round((totalScore / maxScore) * 100);
  }
}

export const mockConflicts: ScheduleConflict[] = [
  {
    type: 'unavailable',
    severity: 'warning',
    employeeId: '2',
    shiftId: 's3',
    message: 'Mike Chen is not available on Wednesday evenings'
  }
];

export const mockWeeklySchedule: WeeklySchedule = {
  weekStart: '2025-01-20',
  shifts: mockShifts,
  conflicts: mockConflicts,
  suggestions: AISchedulingEngine.generateSuggestions(mockShifts, mockEmployees),
  coverageRate: 85,
  scheduleEfficiency: AISchedulingEngine.calculateScheduleEfficiency(mockShifts, mockEmployees)
};