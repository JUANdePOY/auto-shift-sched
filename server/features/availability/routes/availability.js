const express = require('express');
const db = require('../../../shared/config/database');
const { formatEmployee, safeJsonParse } = require('../../../shared/utils/formatUtils');
const { 
  availabilityValidationRules, 
  handleValidationErrors,
  validateEmployeeId,
  validateWeekStart 
} = require('../validation/availabilityValidation');
const availabilityService = require('../services/availabilityService');

const router = express.Router();

const { validateWeekStartStatus } = require('../validation/statusValidation');


// GET availability submission status for a week
router.get('/status/:weekStart', validateWeekStartStatus, async (req, res, next) => {
  try {
    const { weekStart } = req.params;
    const statusData = await availabilityService.getAvailabilityStatus(weekStart);
    res.json(statusData);
  } catch (error) {
    console.error('Error checking availability status:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to check availability status'
    });
  }
});

// GET all availability submissions for a week (admin view)
router.get('/week/:weekStart', validateWeekStartStatus, async (req, res, next) => {
  try {
    const { weekStart } = req.params;
    console.log('Received weekStart in /week/:weekStart:', weekStart);
    const submissions = await availabilityService.getWeeklySubmissions(weekStart);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching weekly submissions:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to fetch weekly submissions'
    });
  }
});

// GET availability for specific employee and week
router.get('/:employeeId/:weekStart', validateEmployeeId, validateWeekStart, async (req, res, next) => {
  try {
    const { employeeId, weekStart } = req.params;

    const [results] = await db.query(
      `SELECT * FROM availability_submissions
       WHERE employee_id = ? AND week_start = ?
       ORDER BY submission_date DESC LIMIT 1`,
      [employeeId, weekStart]
    );

    if (results.length === 0) {
      // Return default availability if no submission exists
      // Check if employee exists
      const [employeeResult] = await db.query(
        'SELECT id FROM employees WHERE id = ?',
        [employeeId]
      );

      if (employeeResult.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Employee not found'
        });
      }

      // Return default empty availability since availability is now in submissions table
      const availability = {};

      return res.json({
        employeeId: parseInt(employeeId),
        weekStart,
        availability,
        isLocked: false,
        submissionDate: null,
        status: 'not_submitted'
      });
    }

    const submission = results[0];
    res.json({
      employeeId: submission.employee_id,
      weekStart: submission.week_start,
      availability: safeJsonParse(submission.availability, {}),
      isLocked: submission.is_locked,
      submissionDate: submission.submission_date,
      status: submission.is_locked ? 'locked' : 'submitted'
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to fetch availability'
    });
  }
});

// POST submit availability for a week
router.post('/submit', availabilityValidationRules, handleValidationErrors, async (req, res, next) => {
  try {
    const { employeeId, weekStart, availability } = req.body;

    // Check if submissions are locked for this week
    const [lockCheck] = await db.query(
      'SELECT is_locked FROM availability_submissions WHERE week_start = ? AND employee_id = ? ORDER BY submission_date DESC LIMIT 1',
      [weekStart, employeeId]
    );

    if (lockCheck.length > 0 && lockCheck[0].is_locked) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Availability submissions are locked for this week'
      });
    }

    // Check submission window (future weeks only)
    const currentDate = new Date();
    const submissionWeek = new Date(weekStart);
    if (submissionWeek <= currentDate) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot submit availability for past or current weeks'
      });
    }

    const query = `
      INSERT INTO availability_submissions (employee_id, week_start, availability, submission_date)
      VALUES (?, ?, ?, NOW())
    `;

    await db.query(query, [
      employeeId,
      weekStart,
      JSON.stringify(availability)
    ]);

    res.status(201).json({
      message: 'Availability submitted successfully',
      employeeId,
      weekStart,
      availability
    });
  } catch (error) {
    console.error('Error submitting availability:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to submit availability'
    });
  }
});

// POST admin submit/update availability for a week (bypasses locks and date checks)
router.post('/admin/submit', availabilityValidationRules, handleValidationErrors, async (req, res, next) => {
  try {
    const { employeeId, weekStart, availability } = req.body;

    // Delete existing submissions first to avoid duplicates
    await db.query(
      'DELETE FROM availability_submissions WHERE employee_id = ? AND week_start = ?',
      [employeeId, weekStart]
    );

    const query = `
      INSERT INTO availability_submissions (employee_id, week_start, availability, submission_date, is_locked)
      VALUES (?, ?, ?, NOW(), FALSE)
    `;

    await db.query(query, [
      employeeId,
      weekStart,
      JSON.stringify(availability)
    ]);

    res.status(201).json({
      message: 'Availability updated successfully by admin',
      employeeId,
      weekStart,
      availability
    });
  } catch (error) {
    console.error('Error submitting admin availability:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to submit admin availability'
    });
  }
});

// PUT lock availability submissions for a week (admin only)
router.put('/lock', async (req, res, next) => {
  try {
    const { weekStart } = req.body;

    // Lock all submissions for the week
    const [result] = await db.query(
      `UPDATE availability_submissions
       SET is_locked = TRUE
       WHERE week_start = ? AND is_locked = FALSE`,
      [weekStart]
    );

    res.json({
      message: `Availability locked for week starting ${weekStart}`,
      lockedCount: result.affectedRows
    });
  } catch (error) {
    console.error('Error locking availability:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to lock availability'
    });
  }
});

// GET availability history for an employee
router.get('/history/:employeeId', validateEmployeeId, async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    const [results] = await db.query(
      `SELECT week_start, availability, submission_date, is_locked
       FROM availability_submissions
       WHERE employee_id = ?
       ORDER by week_start DESC, submission_date DESC`,
      [employeeId]
    );

    const history = results.map(submission => ({
      weekStart: submission.week_start,
      availability: safeJsonParse(submission.availability, {}),
      submissionDate: submission.submission_date,
      isLocked: submission.is_locked,
      status: submission.is_locked ? 'locked' : 'submitted'
    }));

    res.json({
      employeeId: parseInt(employeeId),
      history,
      totalSubmissions: results.length
    });
  } catch (error) {
    console.error('Error fetching availability history:', error);
    res.status(500).json({
      error: 'Database Error',
      message: 'Failed to fetch availability history'
    });
  }
});



module.exports = router;
