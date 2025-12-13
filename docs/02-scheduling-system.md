# Scheduling System Documentation

## Overview

The Scheduling System is the core engine of the Auto Shift Scheduler application, responsible for automated shift assignment, constraint-based scheduling, and intelligent employee matching using advanced algorithms for fairness and efficiency.

## Architecture

### Core Components

#### 1. Schedule Generation Service (`scheduleGenerationService.js`)
**Location**: `server/features/schedule/services/scheduleGenerationService.js`

**Purpose**: Orchestrates the complete schedule generation workflow

**Key Responsibilities**:
- Manages schedule generation lifecycle (draft → published → archived)
- Coordinates with AI suggestion engine
- Handles bulk assignment storage
- Manages schedule versioning and status

#### 2. Shift Scheduler (`scheduler.js`)
**Location**: `server/features/schedule/services/scheduler.js`

**Purpose**: Core scheduling algorithm implementation

**Key Features**:
- Constraint-based employee assignment
- Fairness engine integration
- Availability matching
- Skill-based assignment
- Multi-day schedule generation

### Scheduling Algorithm Deep Dive

#### Main Generation Flow

```javascript
async generateSchedule(startDate, endDate) {
  try {
    // 1. Data Collection Phase
    const [employees, shiftTemplates] = await Promise.all([
      this.getEmployees(startDate),      // Get employees with availability
      this.getShiftTemplates()           // Get shift templates
    ]);

    // 2. Initialization Phase
    employees.forEach(emp => emp.currentWeeklyHours = 0);
    const sortedShifts = this.sortShifts(shiftTemplates);
    const dates = this.getDatesInRange(startDate, endDate);
    const dailyAssignments = new Map(); // Prevent double shifts

    // 3. Assignment Phase
    const assignments = [];
    const conflicts = [];

    for (const date of dates) {
      dailyAssignments.set(date, new Set());
      
      for (const shift of sortedShifts) {
        const shiftWithDate = { ...shift, date };
        
        // Find available employees
        const availableEmployees = this.findAvailableEmployees(employees, shiftWithDate);
        
        // Filter out already assigned employees for this date
        const unassignedEmployees = availableEmployees.filter(emp =>
          !dailyAssignments.get(date).has(emp.id)
        );

        if (unassignedEmployees.length === 0) {
          conflicts.push({
            type: 'no_available_employees',
            shiftId: shift.id,
            date: date,
            message: `No available employees for ${shift.title} on ${date}`
          });
          continue;
        }

        // Rank and assign employees
        const rankedEmployees = await this.rankEmployees(unassignedEmployees, shiftWithDate);
        const assigned = this.assignEmployeesToShift(rankedEmployees, shiftWithDate);
        
        assignments.push(...assigned);
        
        // Update tracking
        assigned.forEach(assignment => {
          dailyAssignments.get(date).add(assignment.employeeId);
          const employee = employees.find(emp => emp.id === assignment.employeeId);
          if (employee) {
            const shiftHours = this.calculateShiftHours(shift);
            employee.currentWeeklyHours += shiftHours;
          }
        });
      }
    }

    return {
      assignments,
      conflicts,
      coverageRate: this.calculateCoverageRate(sortedShifts, assignments),
      totalShifts: sortedShifts.length * dates.length,
      assignedShifts: assignments.length
    };

  } catch (error) {
    console.error('Error generating schedule:', error);
    throw error;
  }
}
```

#### Employee Availability Integration

```javascript
// Get employees with submitted availability for the week
async getEmployees(startDate) {
  const [results] = await db.query('SELECT * FROM employees');
  const employees = results.map(employee => formatEmployee(employee));

  // Calculate week start for availability lookup
  const weekStartStr = this.getWeekStart(startDate);

  // Fetch submitted availability for each employee
  for (const employee of employees) {
    try {
      const availabilityService = require('../../availability/services/availabilityService');
      const submittedAvailability = await availabilityService.getAvailability(employee.id, weekStartStr);

      // Override default availability with submitted availability if available
      if (submittedAvailability && submittedAvailability.availability) {
        employee.availability = submittedAvailability.availability;
      }
    } catch (error) {
      console.warn(`Could not fetch availability for employee ${employee.id}, using default:`, error.message);
      // Keep default availability from employee record
    }
  }

  return employees;
}
```

#### Shift Prioritization Logic

```javascript
// Sort shifts by priority and time for optimal assignment order
sortShifts(shifts) {
  return shifts.sort((a, b) => {
    // First by priority (high → medium → low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }

    // Then by start time (earlier shifts first)
    return new Date(`1970-01-01T${a.startTime}`) - new Date(`1970-01-01T${b.startTime}`);
  });
}
```

### Advanced Constraint Engine

#### 1. Availability Matcher (`availabilityMatcher.js`)
**Location**: `server/features/schedule/services/availabilityMatcher.js`

**Purpose**: Sophisticated availability checking with multiple constraint types

```javascript
class AvailabilityMatcher {
  static isEmployeeAvailable(employee, shift) {
    const dayOfWeek = this.getDayOfWeek(shift.date);
    const availability = employee.availability[dayOfWeek];
    
    if (!availability || !availability.available) {
      return false;
    }

    // Check time constraints if specified
    if (availability.preferredStart && availability.preferredEnd) {
      const shiftStart = new Date(`1970-01-01T${shift.startTime}`);
      const shiftEnd = new Date(`1970-01-01T${shift.endTime}`);
      const prefStart = new Date(`1970-01-01T${availability.preferredStart}`);
      const prefEnd = new Date(`1970-01-01T${availability.preferredEnd}`);
      
      // Shift must fall within preferred time window
      return shiftStart >= prefStart && shiftEnd <= prefEnd;
    }

    return true; // Available anytime
  }

  static calculateAvailabilityScore(employee, shift) {
    const dayOfWeek = this.getDayOfWeek(shift.date);
    const availability = employee.availability[dayOfWeek];
    
    if (!availability.preferredStart || !availability.preferredEnd) {
      return 0.5; // Neutral score for anytime availability
    }

    const shiftStart = new Date(`1970-01-01T${shift.startTime}`);
    const shiftEnd = new Date(`1970-01-01T${shift.endTime}`);
    const preferredStart = new Date(`1970-01-01T${availability.preferredStart}`);
    const preferredEnd = new Date(`1970-01-01T${availability.preferredEnd}`);

    // Perfect match within preferred window
    if (shiftStart >= preferredStart && shiftEnd <= preferredEnd) {
      return 1.0;
    }

    // Calculate overlap percentage for partial matches
    const overlap = Math.max(0, Math.min(shiftEnd, preferredEnd) - Math.max(shiftStart, preferredStart));
    const totalDuration = shiftEnd - shiftStart;
    
    return overlap / totalDuration;
  }
}
```

#### 2. Fairness Engine (`fairnessEngine.js`)
**Location**: `server/features/schedule/services/fairnessEngine.js`

**Purpose**: Ensures equitable distribution of shifts across employees

```javascript
class FairnessEngine {
  static calculateFairnessScore(employee, weekStart, currentAssignments, pastAssignments) {
    const weeklyHours = this.getWeeklyHours(employee, currentAssignments);
    const maxHours = employee.maxHoursPerWeek || 40;
    const utilizationRate = weeklyHours / maxHours;
    
    // Prefer employees with lower utilization
    const utilizationScore = Math.max(0, 1 - utilizationRate);
    
    // Consider historical assignment frequency
    const historicalScore = this.getHistoricalFairnessScore(employee, pastAssignments);
    
    // Combine scores with weights
    return (utilizationScore * 0.7) + (historicalScore * 0.3);
  }

  static getHistoricalFairnessScore(employee, pastAssignments) {
    const employeeAssignments = pastAssignments.filter(a => a.employeeId === employee.id);
    const avgAssignments = pastAssignments.length / this.getUniqueEmployeeCount(pastAssignments);
    
    if (avgAssignments === 0) return 1.0;
    
    const employeeCount = employeeAssignments.length;
    const fairnessRatio = avgAssignments / Math.max(employeeCount, 1);
    
    // Higher score for employees with fewer historical assignments
    return Math.min(1.0, fairnessRatio);
  }

  static enforceMaxHoursConstraint(employee, shift, currentWeeklyHours) {
    const shiftHours = this.calculateShiftDuration(shift);
    const maxHours = employee.maxHoursPerWeek || 40;
    
    return (currentWeeklyHours + shiftHours) <= maxHours;
  }
}
```

#### 3. Station Manager (`stationManager.js`)
**Location**: `server/features/schedule/services/stationManager.js`

**Purpose**: Skill-based matching and station requirements

```javascript
class StationManager {
  static hasRequiredSkills(employee, requiredStations) {
    if (!requiredStations || requiredStations.length === 0) {
      return true; // No specific skills required
    }

    const employeeStations = Array.isArray(employee.station) 
      ? employee.station 
      : [employee.station];

    // Check if employee has at least one required station/skill
    return requiredStations.some(required => 
      employeeStations.includes(required)
    );
  }

  static calculateSkillMatchScore(employee, requiredStations) {
    if (!requiredStations || requiredStations.length === 0) {
      return 1.0; // Perfect match when no specific skills required
    }

    const employeeStations = Array.isArray(employee.station) 
      ? employee.station 
      : [employee.station];

    const matchedStations = requiredStations.filter(required =>
      employeeStations.includes(required)
    );

    return matchedStations.length / requiredStations.length;
  }

  static getStationPriority(station) {
    const priorityMap = {
      'Manager': 10,
      'Shift Lead': 9,
      'Senior Server': 8,
      'Server': 7,
      'Host': 6,
      'Busser': 5,
      'Kitchen': 4,
      'Prep': 3,
      'Dishwasher': 2,
      'General': 1
    };

    return priorityMap[station] || 1;
  }
}
```

#### 4. Employee Ranker (`employeeRanker.js`)
**Location**: `server/features/schedule/services/employeeRanker.js`

**Purpose**: Comprehensive employee scoring and ranking system

```javascript
class EmployeeRanker {
  static async rankEmployeesForShift(employees, shift, weekStart, currentAssignments, pastAssignments) {
    const rankings = [];

    for (const employee of employees) {
      // Calculate individual scoring components
      const availabilityScore = AvailabilityMatcher.calculateAvailabilityScore(employee, shift);
      const skillScore = StationManager.calculateSkillMatchScore(employee, shift.requiredStation);
      const fairnessScore = FairnessEngine.calculateFairnessScore(employee, weekStart, currentAssignments, pastAssignments);
      const experienceScore = this.calculateExperienceScore(employee, shift);
      const preferenceScore = this.calculatePreferenceScore(employee, shift);

      // Weighted total score calculation
      const totalScore = (
        availabilityScore * 0.25 +    // 25% - Can they work?
        skillScore * 0.30 +           // 30% - Are they qualified?
        fairnessScore * 0.25 +        // 25% - Is it fair?
        experienceScore * 0.15 +      // 15% - How experienced?
        preferenceScore * 0.05        // 5% - Do they prefer this?
      );

      rankings.push({
        employee,
        totalScore,
        breakdown: {
          availability: availabilityScore,
          skills: skillScore,
          fairness: fairnessScore,
          experience: experienceScore,
          preference: preferenceScore
        }
      });
    }

    // Sort by total score (highest first)
    return rankings.sort((a, b) => b.totalScore - a.totalScore);
  }

  static calculateExperienceScore(employee, shift) {
    // Factor in employee's experience with similar shifts
    const experienceMonths = employee.experienceMonths || 0;
    const departmentMatch = employee.department === shift.department ? 1.0 : 0.7;
    
    // Normalize experience (0-24 months = 0-1 score)
    const experienceNormalized = Math.min(experienceMonths / 24, 1.0);
    
    return experienceNormalized * departmentMatch;
  }

  static calculatePreferenceScore(employee, shift) {
    // Check if employee has expressed preferences for this type of shift
    const preferences = employee.shiftPreferences || {};
    const shiftType = this.categorizeShift(shift);
    
    if (preferences[shiftType]) {
      return preferences[shiftType] === 'preferred' ? 1.0 : 
             preferences[shiftType] === 'acceptable' ? 0.7 : 0.3;
    }
    
    return 0.5; // Neutral when no preference specified
  }

  static categorizeShift(shift) {
    const startHour = parseInt(shift.startTime.split(':')[0]);
    
    if (startHour < 11) return 'morning';
    if (startHour < 17) return 'afternoon';
    return 'evening';
  }
}
```

### Bulk Assignment Storage

#### Professional Database Operations

```javascript
// Store schedule assignments with professional bulk insertion
async storeAssignments(generationId, assignments) {
  // Input validation
  if (!generationId || typeof generationId !== 'number') {
    throw new Error('Invalid generationId: must be a valid number');
  }

  if (!Array.isArray(assignments)) {
    throw new Error('Invalid assignments: must be an array');
  }

  if (assignments.length === 0) {
    console.log(`No assignments to store for generation ${generationId}`);
    return;
  }

  // Validate each assignment
  for (let i = 0; i < assignments.length; i++) {
    const assignment = assignments[i];
    if (!assignment.shiftId || !assignment.employeeId || !assignment.date) {
      throw new Error(`Invalid assignment at index ${i}: shiftId, employeeId, and date are required`);
    }
    if (typeof assignment.shiftId !== 'number' || typeof assignment.employeeId !== 'number') {
      throw new Error(`Invalid assignment at index ${i}: shiftId and employeeId must be numbers`);
    }
  }

  const connection = await db.promise().getConnection();
  const startTime = Date.now();

  try {
    // Start transaction for atomicity
    await connection.beginTransaction();

    // Prepare values for bulk insert
    const values = assignments.map(assignment => [
      generationId,
      assignment.shiftId,
      assignment.employeeId,
      assignment.date,
      new Date()
    ]);

    // Bulk insert with IGNORE to handle potential duplicates gracefully
    const [result] = await connection.query(
      'INSERT IGNORE INTO schedule_assignments (schedule_generation_id, shift_id, employee_id, assignment_date, assigned_at) VALUES ?',
      [values]
    );

    // Commit transaction
    await connection.commit();

    const duration = Date.now() - startTime;
    console.log(`Successfully stored ${result.affectedRows} assignments for generation ${generationId} in ${duration}ms`);

    // Log any skipped duplicates
    const skipped = assignments.length - result.affectedRows;
    if (skipped > 0) {
      console.warn(`${skipped} assignments were skipped (possible duplicates) for generation ${generationId}`);
    }

  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error(`Failed to store assignments for generation ${generationId}:`, error);
    throw new Error(`Database error while storing assignments: ${error.message}`);
  } finally {
    connection.release();
  }
}
```

### Frontend Schedule Management

#### Schedule View Component (`ScheduleView.tsx`)
**Location**: `frontend/src/features/schedule/components/ScheduleView.tsx`

**Purpose**: Main interface for viewing and managing schedules

**Key Features**:
- Weekly calendar view
- Shift assignment interface
- Real-time conflict detection
- Drag-and-drop assignment
- Multiple view modes (card, table, calendar)

#### Core Logic Flow

```typescript
// Schedule data processing and display
const shiftsToDisplay: Shift[] = useMemo(() => {
  if (finalSchedule && finalSchedule.length > 0) {
    const groupedByShift: Record<string, GroupedShift> = {};

    finalSchedule.forEach(assignment => {
      const shiftKey = `${assignment.shift_id}-${assignment.date}`;
      if (!groupedByShift[shiftKey]) {
        groupedByShift[shiftKey] = {
          id: assignment.shift_id.toString(),
          title: assignment.shift_title,
          date: assignment.date,
          startTime: isReadOnly ? formatTo12Hour(assignment.startTime) : assignment.startTime,
          endTime: isReadOnly ? formatTo12Hour(assignment.endTime) : assignment.endTime,
          assignedEmployees: [],
          assignedEmployeeNames: [],
          assignedEmployeeStations: [],
          requiredEmployees: 1,
          priority: 'medium' as const,
          department: assignment.department || '',
          requiredStation: Array.isArray(assignment.required_stations) ? assignment.required_stations : [],
          isCompleted: false,
        };
      }
      groupedByShift[shiftKey].assignedEmployees.push(assignment.employee_id.toString());
      groupedByShift[shiftKey].assignedEmployeeNames.push(assignment.employee_name);
      groupedByShift[shiftKey].assignedEmployeeStations.push(Array.isArray(assignment.required_stations) ? assignment.required_stations : []);
    });

    return Object.values(groupedByShift);
  }

  return [];
}, [finalSchedule, isReadOnly]);
```

#### Week Navigation Logic

```typescript
// Keyboard navigation for week changes
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const newWeek = new Date(currentWeek);
      newWeek.setDate(newWeek.getDate() - 7);
      setCurrentWeek(newWeek);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const newWeek = new Date(currentWeek);
      newWeek.setDate(newWeek.getDate() + 7);
      setCurrentWeek(newWeek);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentWeek]);

// Fetch schedule when week changes
useEffect(() => {
  const weekStart = currentWeek.getFullYear() + '-' +
    String(currentWeek.getMonth() + 1).padStart(2, '0') + '-' +
    String(currentWeek.getDate()).padStart(2, '0');
  if (lastCalledWeekRef.current === weekStart) return;
  lastCalledWeekRef.current = weekStart;
  onRefreshData(weekStart);
}, [currentWeek]);
```

### AI Suggestion Engine Integration

#### Suggestion Generation

```javascript
// Generate AI suggestions for schedule optimization
async generateAISuggestions(generationId, assignments) {
  try {
    // Get all employees and shifts for the week
    const [employees] = await db.query('SELECT * FROM employees');
    const weekStart = await this.getWeekStartFromGeneration(generationId);
    const endDate = this.getWeekEndDate(weekStart);

    const [shifts] = await db.query(
      'SELECT * FROM shifts WHERE date BETWEEN ? AND ?',
      [weekStart, endDate]
    );

    // Generate suggestions using AI engine
    const suggestions = [];

    // Generate employee suggestions for unassigned shifts
    for (const shift of shifts) {
      const assignedEmployees = assignments.filter(a => a.shiftId === shift.id).length;
      const requiredEmployees = shift.required_employees || 1;

      if (assignedEmployees < requiredEmployees) {
        try {
          const employeeSuggestions = await SuggestionEngine.getEmployeeSuggestions(shift.id, 3);
          for (const suggestion of employeeSuggestions) {
            suggestions.push({
              generationId,
              type: 'assignment',
              confidence: suggestion.score,
              changes: {
                shiftId: shift.id,
                employeeId: suggestion.employee.id,
                action: 'assign'
              },
              reason: suggestion.reasons.join(', ')
            });
          }
        } catch (error) {
          console.warn(`Could not generate suggestions for shift ${shift.id}:`, error);
        }
      }
    }

    // Store suggestions in database
    for (const suggestion of suggestions.slice(0, 10)) { // Limit to top 10
      await db.query(
        'INSERT INTO ai_suggestions (schedule_generation_id, suggestion_type, confidence_score, suggested_changes) VALUES (?, ?, ?, ?)',
        [generationId, suggestion.type, suggestion.confidence, JSON.stringify(suggestion.changes)]
      );
    }

    return suggestions.slice(0, 10);

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    return [];
  }
}
```

### Performance Optimizations

#### 1. Database Query Optimization

```javascript
// Optimized query for schedule data with proper indexing
const getScheduleWithAssignments = async (weekStart, weekEnd) => {
  const query = `
    SELECT 
      s.id as shift_id,
      s.title as shift_title,
      s.start_time,
      s.end_time,
      s.date,
      s.required_stations,
      s.department,
      e.id as employee_id,
      e.name as employee_name,
      e.department as employee_department
    FROM shifts s
    LEFT JOIN schedule_assignments sa ON s.id = sa.shift_id
    LEFT JOIN employees e ON sa.employee_id = e.id
    WHERE s.date BETWEEN ? AND ?
    ORDER BY s.date, s.start_time, e.name
  `;
  
  const [results] = await db.query(query, [weekStart, weekEnd]);
  return results;
};
```

#### 2. Caching Strategy

```javascript
// Implement Redis caching for frequently accessed data
const cacheScheduleData = async (weekStart, scheduleData) => {
  const cacheKey = `schedule:${weekStart}`;
  const cacheExpiry = 300; // 5 minutes
  
  await redis.setex(cacheKey, cacheExpiry, JSON.stringify(scheduleData));
};

const getCachedScheduleData = async (weekStart) => {
  const cacheKey = `schedule:${weekStart}`;
  const cached = await redis.get(cacheKey);
  
  return cached ? JSON.parse(cached) : null;
};
```

#### 3. Batch Processing

```javascript
// Process multiple weeks in parallel for better performance
const generateMultipleWeeks = async (startDate, numberOfWeeks) => {
  const weekPromises = [];
  
  for (let i = 0; i < numberOfWeeks; i++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + (i * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weekPromises.push(
      this.generateSchedule(
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      )
    );
  }
  
  return await Promise.all(weekPromises);
};
```

## Best Practices

1. **Algorithm Design**: Use constraint-based approach for flexibility
2. **Data Integrity**: Implement proper validation and error handling
3. **Performance**: Cache frequently accessed data and use bulk operations
4. **Fairness**: Ensure equitable distribution of shifts
5. **Flexibility**: Support multiple constraint types and priorities
6. **Monitoring**: Log performance metrics and scheduling conflicts

## Future Enhancements

1. **Machine Learning**: Implement ML-based preference learning
2. **Advanced Constraints**: Support for complex business rules
3. **Real-time Optimization**: Dynamic schedule adjustment
4. **Mobile Integration**: Native mobile scheduling interface
5. **Analytics**: Advanced scheduling analytics and reporting