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
    
    // Fetch shifts for the week
    const query = 'SELECT * FROM shifts WHERE date BETWEEN ? AND ?';
    const [results] = await db.promise().query(query, [startDate, endDate]);
    
    const shifts = results.map(shift => formatShift(shift));
    
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
  
  let query = 'SELECT * FROM shifts';
  let params = [];
  
  if (startDate && endDate) {
    query += ' WHERE date BETWEEN ? AND ?';
    params = [startDate, endDate];
  }
  
  try {
    const [results] = await db.promise().query(query, params);
    const shifts = results.map(shift => formatShift(shift));
    
    // Simple conflict detection - in a real implementation, this would be more sophisticated
    const conflicts = detectScheduleConflicts(shifts);
    
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

      // If shiftId is a string (temporary ID), we need to find or create the actual shift
      if (typeof shiftId === 'string' && shiftId.startsWith('shift-')) {
        // Try to find existing shift by title, date, and time
        const [existingShifts] = await connection.query(
          'SELECT id FROM shifts WHERE title = ? AND date = ? AND startTime = ? AND endTime = ? LIMIT 1',
          [assignment.shiftTitle, date, assignment.startTime || assignment.time, assignment.endTime || assignment.time]
        );

        if (existingShifts.length > 0) {
          shiftId = existingShifts[0].id;
        } else {
          // Create new shift if it doesn't exist
          const shiftData = {
            title: assignment.shiftTitle,
            startTime: assignment.startTime || assignment.time,
            endTime: assignment.endTime || assignment.time,
            date: date,
            requiredStation: assignment.requiredStations || [],
            requiredEmployees: 1,
            assignedEmployees: [assignment.employeeId],
            isCompleted: true,
            priority: 'medium',
            department: assignment.department
          };

          const [shiftResult] = await connection.query(
            'INSERT INTO shifts (title, startTime, endTime, date, requiredStation, requiredEmployees, assignedEmployees, isCompleted, priority, department) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              shiftData.title,
              shiftData.startTime,
              shiftData.endTime,
              shiftData.date,
              JSON.stringify(shiftData.requiredStation),
              shiftData.requiredEmployees,
              JSON.stringify(shiftData.assignedEmployees),
              shiftData.isCompleted,
              shiftData.priority,
              shiftData.department
            ]
          );
          shiftId = shiftResult.insertId;
        }
      }

      // Check if this assignment already exists to avoid duplicates
      const [existingAssignment] = await connection.query(
        'SELECT id FROM final_schedule WHERE schedule_generation_id = ? AND shift_id = ? AND employee_id = ?',
        [scheduleGenerationId, shiftId, assignment.employeeId]
      );

      if (existingAssignment.length === 0) {
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
    }

    // Insert all assignments into final_schedule table
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
