const express = require('express');
const db = require('../../../shared/config/database');
const { formatShift } = require('../../../shared/utils/formatUtils');
const ShiftScheduler = require('../services/scheduler');
const SuggestionEngine = require('../../ai-suggestions/services/suggestionEngine');

const router = express.Router();


// GET weekly schedule with conflicts
router.get('/week', async (req, res, next) => {
  const { startDate } = req.query;

  if (!startDate) {
    return res.status(400).json({ error: 'startDate query parameter is required' });
  }

  try {
    // Calculate end date (7 days after start date)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 6); // 7 days total including start date
    const endDate = endDateObj.toISOString().split('T')[0];

    // Fetch assigned shifts for the week from schedule_assignments
    const query = `
      SELECT sa.*, s.title, s.startTime, s.endTime, s.requiredEmployees,
             e.name as employee_name, sa.assignment_date as date
      FROM schedule_assignments sa
      JOIN shifts s ON sa.shift_id = s.id
      JOIN employees e ON sa.employee_id = e.id
      WHERE sa.assignment_date BETWEEN ? AND ?
      ORDER BY sa.assignment_date, s.startTime
    `;
    const [results] = await db.query(query, [startDate, endDate]);

    const shifts = results.map(row => ({
      id: row.shift_id,
      title: row.title,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      requiredEmployees: row.requiredEmployees,
      assignedEmployees: [{
        id: row.employee_id,
        name: row.employee_name
      }],
      department: row.department || 'General'
    }));

    // For now, return empty conflicts and suggestions
    // In a real implementation, you would detect conflicts here
    const weeklySchedule = {
      weekStart: startDate,
      shifts: shifts,
      conflicts: [],
      suggestions: [],
      coverageRate: calculateCoverageRate(shifts),
      scheduleEfficiency: 75 // Placeholder
    };

    res.json(weeklySchedule);
  } catch (error) {
    next(error);
  }
});

// GET schedule conflicts
router.get('/conflicts', async (req, res, next) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT sa.*, s.title, s.startTime, s.endTime, e.name as employee_name, sa.assignment_date as date
    FROM schedule_assignments sa
    JOIN shifts s ON sa.shift_id = s.id
    JOIN employees e ON sa.employee_id = e.id
  `;
  let params = [];

  if (startDate && endDate) {
    query += ' WHERE sa.assignment_date BETWEEN ? AND ?';
    params = [startDate, endDate];
  }

  try {
    const [results] = await db.query(query, params);
    const assignments = results.map(row => ({
      id: row.id,
      shiftId: row.shift_id,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      shiftTitle: row.title,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime
    }));

    // Simple conflict detection - in a real implementation, this would be more sophisticated
    const conflicts = detectScheduleConflicts(assignments);

    res.json(conflicts);
  } catch (error) {
    next(error);
  }
});

// POST generate automated schedule
router.post('/generate', async (req, res, next) => {
  const { startDate, endDate } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const schedule = await ShiftScheduler.generateSchedule(startDate, endDate);
    res.json(schedule);
  } catch (error) {
    console.error('Error in schedule generation:', error);
    next(error);
  }
});

// POST suggest employees for a shift
router.post('/suggest-employee', async (req, res, next) => {
  const { shiftId, date } = req.body;

  if (!shiftId) {
    return res.status(400).json({ error: 'shiftId is required' });
  }

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const suggestions = await SuggestionEngine.getEmployeeSuggestions(shiftId, date);
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

// POST suggest top unassigned employees for a shift
router.post('/suggest-unassigned', async (req, res, next) => {
  const { shiftId, date } = req.body;

  if (!shiftId) {
    return res.status(400).json({ error: 'shiftId is required' });
  }

  if (!date) {
    return res.status(400).json({ error: 'date is required' });
  }

  try {
    const suggestions = await SuggestionEngine.getTopUnassignedSuggestions(shiftId, date);
    res.json(suggestions);
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate coverage rate
function calculateCoverageRate(shifts) {
  if (shifts.length === 0) return 100;

  const coveredShifts = shifts.filter(shift =>
    shift.assignedEmployees.length >= shift.requiredEmployees
  ).length;

  return Math.round((coveredShifts / shifts.length) * 100);
}

// Helper function to detect schedule conflicts
function detectScheduleConflicts(shifts) {
  const conflicts = [];

  // Simple conflict detection logic
  // This is a placeholder - in a real implementation, you would:
  // 1. Check for overlapping shifts for the same employee
  // 2. Check for station mismatches
  // 3. Check for overtime violations
  // 4. Check for availability conflicts

  // For now, return empty array as conflicts detection is complex
  // and requires employee data and more sophisticated logic

  return conflicts;
}

router.post('/save-final', async (req, res, next) => {
  const { date, assignments, notes } = req.body;

  if (!date || !assignments || !Array.isArray(assignments)) {
    return res.status(400).json({ error: 'date and assignments array are required' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // First, create a schedule generation record
    const generationQuery = `
      INSERT INTO schedule_generations (week_start, generated_by, status, notes)
      VALUES (?, 1, 'published', ?)
    `;
    const [generationResult] = await connection.query(generationQuery, [date, notes || 'Final schedule saved']);
    const scheduleGenerationId = generationResult.insertId;

    // Process each assignment
    const finalAssignments = [];

    for (const assignment of assignments) {
      let shiftId = assignment.shiftId;

      // If shiftId is a string (temporary ID), we need to find or create the actual shift template
      if (typeof shiftId === 'string' && shiftId.startsWith('shift-')) {
        // Try to find existing shift template by title and time (no date since templates don't have dates)
        const [existingShifts] = await connection.query(
          'SELECT id FROM shifts WHERE title = ? AND startTime = ? AND endTime = ? LIMIT 1',
          [assignment.shiftTitle, assignment.startTime || assignment.time, assignment.endTime || assignment.time]
        );

        if (existingShifts.length > 0) {
          shiftId = existingShifts[0].id;
        } else {
          // Create new shift template if it doesn't exist
          const shiftData = {
            title: assignment.shiftTitle,
            startTime: assignment.startTime || assignment.time,
            endTime: assignment.endTime || assignment.time,
            requiredEmployees: 1,
            department: assignment.department,
            priority: 'medium'
          };

          const [shiftResult] = await connection.query(
            'INSERT INTO shifts (title, startTime, endTime, requiredEmployees, department, priority) VALUES (?, ?, ?, ?, ?, ?)',
            [
              shiftData.title,
              shiftData.startTime,
              shiftData.endTime,
              shiftData.requiredEmployees,
              shiftData.department,
              shiftData.priority
            ]
          );
          shiftId = shiftResult.insertId;
        }
      }

      // Create assignment record with the specific date
      const [existingAssignment] = await connection.query(
        'SELECT id FROM schedule_assignments WHERE schedule_generation_id = ? AND shift_id = ? AND employee_id = ? AND assignment_date = ?',
        [scheduleGenerationId, shiftId, assignment.employeeId, date]
      );

      if (existingAssignment.length === 0) {
        await connection.query(
          'INSERT INTO schedule_assignments (schedule_generation_id, shift_id, employee_id, assignment_date, assigned_at) VALUES (?, ?, ?, ?, NOW())',
          [scheduleGenerationId, shiftId, assignment.employeeId, date]
        );
      }

      // Also save to final_schedule for legacy compatibility
      finalAssignments.push([
        scheduleGenerationId,
        shiftId,
        assignment.employeeId,
        assignment.timeIn || null,
        assignment.timeOut || null,
        assignment.employeeName,
        assignment.shiftTitle,
        assignment.department,
        date,
        JSON.stringify(assignment.requiredStations || [])
      ]);
    }

    // Insert all assignments into final_schedule table for legacy compatibility
    if (finalAssignments.length > 0) {
      const assignmentQuery = `
        INSERT INTO final_schedule (schedule_generation_id, shift_id, employee_id, time_in, time_out, employee_name, shift_title, department, date_schedule, required_stations)
        VALUES ?
      `;
      await connection.query(assignmentQuery, [finalAssignments]);
    }

    await connection.commit();

    res.json({
      success: true,
      scheduleGenerationId,
      message: 'Final schedule saved successfully',
      totalAssignments: finalAssignments.length
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error saving final schedule:', error);
    next(error);
  } finally {
    connection.release();
  }
});


// GET final schedule for a specific date
router.get('/final/:date', async (req, res, next) => {
  const { date } = req.params;

  if (!date) {
    return res.status(400).json({ error: 'Date parameter is required' });
  }

  try {
    // Fetch final schedule assignments with LEFT JOIN to handle missing shift/employee references
    // Use data from final_schedule as fallback when JOINs fail
    const [finalRows] = await db.query(
      `SELECT
         fs.shift_id,
         fs.employee_id,
         COALESCE(s.title, fs.shift_title) as shift_title,
         DATE(fs.date_schedule) as date,
         COALESCE(s.startTime, fs.time_in) as startTime,
         COALESCE(s.endTime, fs.time_out) as endTime,
         COALESCE(e.name, fs.employee_name) as employee_name,
         fs.required_stations
       FROM final_schedule fs
       LEFT JOIN shifts s ON fs.shift_id = s.id
       LEFT JOIN employees e ON fs.employee_id = e.id
       WHERE DATE(fs.date_schedule) = ?
       ORDER BY COALESCE(s.startTime, fs.time_in)`,
      [date]
    );

    // Parse required_stations JSON for each row
    finalRows.forEach(row => {
      if (row.required_stations) {
        try {
          row.required_stations = JSON.parse(row.required_stations);
        } catch (e) {
          console.warn('Failed to parse required_stations JSON:', row.required_stations);
          row.required_stations = [];
        }
      } else {
        row.required_stations = [];
      }
    });

    res.json(finalRows);
  } catch (error) {
    next(error);
  }
});

// GET final schedule for a week
router.get('/final/week/:startDate', async (req, res, next) => {
  const { startDate } = req.params;

  if (!startDate) {
    return res.status(400).json({ error: 'startDate parameter is required' });
  }

  try {
    // Calculate end date (7 days after start date)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 6); // 7 days total including start date
    const endDate = endDateObj.toISOString().split('T')[0];

    // Fetch final schedule for the week - use LEFT JOIN and COALESCE to handle missing shift references
    const query = `
      SELECT fs.shift_id, fs.employee_id, COALESCE(s.title, fs.shift_title) as shift_title, DATE(fs.date_schedule) as date, COALESCE(s.startTime, fs.time_in) as startTime, COALESCE(s.endTime, fs.time_out) as endTime, COALESCE(e.name, fs.employee_name) as employee_name, fs.required_stations
      FROM final_schedule fs
      LEFT JOIN shifts s ON fs.shift_id = s.id
      LEFT JOIN employees e ON fs.employee_id = e.id
      WHERE DATE(fs.date_schedule) BETWEEN ? AND ?
    `;
    const [results] = await db.query(query, [startDate, endDate]);

    // Parse required_stations JSON for each row
    results.forEach(row => {
      if (row.required_stations) {
        try {
          row.required_stations = JSON.parse(row.required_stations);
        } catch (e) {
          console.warn('Failed to parse required_stations JSON:', row.required_stations);
          row.required_stations = [];
        }
      } else {
        row.required_stations = [];
      }
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET dashboard data - weekly schedule summary with conflicts
router.get('/dashboard/week-summary/:weekStart', async (req, res, next) => {
  const { weekStart } = req.params;

  try {
    // Calculate end date (7 days after start date)
    const startDateObj = new Date(weekStart);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 6);
    const endDate = endDateObj.toISOString().split('T')[0];

    // Fetch final schedule for the week
    const [assignments] = await db.query(
      `SELECT fs.shift_id, fs.employee_id, s.title, DATE(fs.date_schedule) as date,
              s.startTime, s.endTime, e.name as employee_name, s.requiredEmployees
       FROM final_schedule fs
       LEFT JOIN shifts s ON fs.shift_id = s.id
       LEFT JOIN employees e ON fs.employee_id = e.id
       WHERE DATE(fs.date_schedule) BETWEEN ? AND ?
       ORDER BY DATE(fs.date_schedule), s.startTime`,
      [weekStart, endDate]
    );

    // Fetch all shifts for the week to calculate coverage
    const [allShifts] = await db.query(
      `SELECT DISTINCT s.id, s.title, s.startTime, s.endTime, s.requiredEmployees, COALESCE(COUNT(fs.employee_id), 0) as assignedCount
       FROM shifts s
       LEFT JOIN final_schedule fs ON s.id = fs.shift_id AND fs.date_schedule BETWEEN ? AND ?
       GROUP BY s.id, s.title, s.startTime, s.endTime, s.requiredEmployees`,
      [weekStart, endDate]
    );

    // Calculate coverage rate
    const coveredShifts = allShifts.filter(s => s.assignedCount >= s.requiredEmployees).length;
    const coverageRate = allShifts.length > 0 ? Math.round((coveredShifts / allShifts.length) * 100) : 0;

    // Detect conflicts (overlapping shifts for same employee)
    const conflictMap = new Map();
    assignments.forEach(assignment => {
      if (!assignment.employee_id) return;
      
      assignments.forEach(other => {
        if (other.employee_id !== assignment.employee_id || other.date !== assignment.date) return;
        if (assignment.shift_id >= other.shift_id) return; // Avoid duplicates
        
        // Check if times overlap
        if (assignment.startTime < other.endTime && assignment.endTime > other.startTime) {
          const conflictKey = `${assignment.employee_id}-${assignment.date}-${assignment.shift_id}-${other.shift_id}`;
          conflictMap.set(conflictKey, {
            type: 'overlap',
            severity: 'error',
            employeeId: assignment.employee_id,
            employeeName: assignment.employee_name,
            shiftIds: [assignment.shift_id, other.shift_id],
            message: `${assignment.employee_name} assigned to overlapping shifts on ${assignment.date}`
          });
        }
      });
    });

    const conflicts = Array.from(conflictMap.values());

    res.json({
      weekStart,
      weekEnd: endDate,
      assignments,
      conflicts,
      coverageRate,
      totalShifts: allShifts.length,
      coveredShifts
    });
  } catch (error) {
    next(error);
  }
});

// GET dashboard data - employee utilization for current week
router.get('/dashboard/employee-utilization/:weekStart', async (req, res, next) => {
  const { weekStart } = req.params;

  try {
    // Calculate end date (7 days after start date)
    const startDateObj = new Date(weekStart);
    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 6);
    const endDate = endDateObj.toISOString().split('T')[0];

    // Get all non-admin employees
    const [employees] = await db.query('SELECT id, name, maxHoursPerWeek FROM employees WHERE role != ?', ['admin']);

    // Get scheduled hours for each non-admin employee
    const [assignments] = await db.query(
      `SELECT e.id, e.name, e.maxHoursPerWeek,
              SUM(TIME_TO_SEC(TIMEDIFF(s.endTime, s.startTime)) / 3600) as scheduledHours
       FROM employees e
       LEFT JOIN final_schedule fs ON e.id = fs.employee_id AND DATE(fs.date_schedule) BETWEEN ? AND ?
       LEFT JOIN shifts s ON fs.shift_id = s.id
       WHERE e.role != ?
       GROUP BY e.id, e.name, e.maxHoursPerWeek`,
      [weekStart, endDate, 'admin']
    );

    // Calculate utilization percentage for each employee and overall
    const employeeUtilization = assignments.map(emp => {
      const maxHours = emp.maxHoursPerWeek || 40;
      const scheduled = emp.scheduledHours || 0;
      const utilization = (scheduled / maxHours) * 100;
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        maxHoursPerWeek: maxHours,
        scheduledHours: parseFloat(scheduled || 0).toFixed(2),
        utilizationPercentage: Math.min(utilization, 100)
      };
    });

    // Calculate average utilization
    const totalUtilization = employeeUtilization.reduce((sum, emp) => sum + emp.utilizationPercentage, 0);
    const averageUtilization = employeeUtilization.length > 0 
      ? Math.round(totalUtilization / employeeUtilization.length)
      : 0;

    // Count employees scheduled vs total
    const employeesScheduled = employeeUtilization.filter(emp => emp.scheduledHours > 0).length;

    res.json({
      weekStart,
      averageUtilization,
      employeesScheduled,
      totalEmployees: employees.length,
      employeeDetails: employeeUtilization
    });
  } catch (error) {
    next(error);
  }
});

// GET dashboard data - monthly overview
router.get('/dashboard/monthly-overview', async (req, res, next) => {
  try {
    // Get dates for current month and last month
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString().split('T')[0];
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString().split('T')[0];
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      .toISOString().split('T')[0];
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
      .toISOString().split('T')[0];

    // Get current month stats (excluding admin employees)
    const [currentStats] = await db.query(
      `SELECT 
         COUNT(DISTINCT fs.shift_id) as totalShifts,
         COUNT(fs.employee_id) as totalAssignments,
         COUNT(DISTINCT fs.employee_id) as uniqueEmployees,
         SUM(TIME_TO_SEC(TIMEDIFF(s.endTime, s.startTime)) / 3600) as totalHours
       FROM final_schedule fs
       LEFT JOIN shifts s ON fs.shift_id = s.id
       LEFT JOIN employees e ON fs.employee_id = e.id
       WHERE fs.date_schedule BETWEEN ? AND ? AND (e.role != ? OR e.role IS NULL)`,
      [currentMonthStart, currentMonthEnd, 'admin']
    );

    // Get last month stats for comparison (excluding admin employees)
    const [lastStats] = await db.query(
      `SELECT 
         COUNT(DISTINCT fs.shift_id) as totalShifts,
         COUNT(fs.employee_id) as totalAssignments,
         COUNT(DISTINCT fs.employee_id) as uniqueEmployees,
         SUM(TIME_TO_SEC(TIMEDIFF(s.endTime, s.startTime)) / 3600) as totalHours
       FROM final_schedule fs
       LEFT JOIN shifts s ON fs.shift_id = s.id
       LEFT JOIN employees e ON fs.employee_id = e.id
       WHERE fs.date_schedule BETWEEN ? AND ? AND (e.role != ? OR e.role IS NULL)`,
      [lastMonthStart, lastMonthEnd, 'admin']
    );

    // Calculate coverage rate for current month
    const [monthShifts] = await db.query(
      `SELECT COUNT(DISTINCT s.id) as totalShifts,
              COUNT(CASE WHEN a.assigned_count >= s.requiredEmployees THEN 1 END) as coveredShifts
       FROM shifts s
       LEFT JOIN (
         SELECT shift_id, COUNT(*) as assigned_count
         FROM final_schedule
         WHERE date_schedule BETWEEN ? AND ?
         GROUP BY shift_id
       ) a ON s.id = a.shift_id`,
      [currentMonthStart, currentMonthEnd]
    );

    const currentMonth = currentStats[0] || {};
    const lastMonth = lastStats[0] || {};

    const coverageRate = monthShifts[0]?.totalShifts > 0 
      ? Math.round((monthShifts[0].coveredShifts / monthShifts[0].totalShifts) * 100)
      : 0;

    // Calculate percentage changes
    const assignmentChange = lastMonth.totalAssignments > 0 
      ? Math.round(((currentMonth.totalAssignments - lastMonth.totalAssignments) / lastMonth.totalAssignments) * 100)
      : 0;

    res.json({
      month: today.toISOString().split('T')[0].slice(0, 7), // YYYY-MM format
      currentMonth: {
        totalShifts: currentMonth.totalShifts || 0,
        totalAssignments: currentMonth.totalAssignments || 0,
        uniqueEmployees: currentMonth.uniqueEmployees || 0,
        totalHours: parseFloat(currentMonth.totalHours || 0).toFixed(2),
        averageCoverageRate: coverageRate
      },
      percentageChanges: {
        assignmentsChange: assignmentChange,
        shiftsCovered: coverageRate
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET dashboard data - recent activity
router.get('/dashboard/recent-activity', async (req, res, next) => {
  try {
    const activities = [];

    // Get recent schedule publications
    const [schedulePublications] = await db.query(
      `SELECT 'schedule_published' as type, generated_at as date, CONCAT('Schedule published for week of ', week_start) as description
       FROM schedule_generations
       WHERE status = 'published'
       ORDER BY generated_at DESC
       LIMIT 5`
    );

    // Get recent availability submissions
    const [availabilitySubmissions] = await db.query(
      `SELECT 'availability_submitted' as type, submission_date as date, 
              CONCAT('Availability submitted by employee for week of ', week_start) as description
       FROM availability_submissions
       ORDER BY submission_date DESC
       LIMIT 5`
    );

    // Get recent employee additions
    const [newEmployees] = await db.query(
      `SELECT 'employee_added' as type, created_at as date, 
              CONCAT('New employee added: ', name) as description
       FROM employees
       WHERE created_at IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // Get recent shift assignments
    const [shiftAssignments] = await db.query(
      `SELECT 'shift_assigned' as type, assigned_at as date,
              CONCAT('Employee assigned to shift on ', assignment_date) as description
       FROM schedule_assignments
       ORDER BY assigned_at DESC
       LIMIT 5`
    );

    // Combine all activities and sort by date
    const allActivities = [
      ...schedulePublications,
      ...availabilitySubmissions,
      ...newEmployees,
      ...shiftAssignments
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    // Format activities with readable timestamps
    const formattedActivities = allActivities.map(activity => {
      const activityDate = new Date(activity.date);
      const now = new Date();
      const diffMs = now - activityDate;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeAgo = 'Just now';
      if (diffHours > 0 && diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays > 0) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      }

      return {
        type: activity.type,
        description: activity.description,
        timeAgo
      };
    });

    res.json(formattedActivities);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
