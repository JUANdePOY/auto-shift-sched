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

module.exports = router;
