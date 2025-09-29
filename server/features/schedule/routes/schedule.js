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
    const [results] = await db.promise().query(query, [startDate, endDate]);

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
    const [results] = await db.promise().query(query, params);
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
  const { shiftId } = req.body;

  if (!shiftId) {
    return res.status(400).json({ error: 'shiftId is required' });
  }

  try {
    const suggestions = await SuggestionEngine.getEmployeeSuggestions(shiftId);
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

  const connection = await db.promise().getConnection();

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
    // Fetch final schedule assignments directly filtered by date_schedule
    const [finalRows] = await db.promise().query(
      `SELECT fs.shift_id, fs.employee_id, s.title as shift_title, fs.date_schedule as date, s.startTime, s.endTime, e.name as employee_name, fs.required_stations
       FROM final_schedule fs
       JOIN shifts s ON fs.shift_id = s.id
       JOIN employees e ON fs.employee_id = e.id
       WHERE fs.date_schedule = ?
       ORDER BY s.startTime`,
      [date]
    );

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

    // Fetch final schedule for the week
    const query = `
      SELECT fs.shift_id, fs.employee_id, s.title as shift_title, LEFT(fs.date_schedule, 10) as date, s.startTime, s.endTime, e.name as employee_name, fs.required_stations
      FROM final_schedule fs
      JOIN shifts s ON fs.shift_id = s.id
      JOIN employees e ON fs.employee_id = e.id
      WHERE LEFT(fs.date_schedule, 10) BETWEEN ? AND ?
    `;
    const [results] = await db.promise().query(query, [startDate, endDate]);

    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
