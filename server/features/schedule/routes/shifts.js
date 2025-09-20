const express = require('express');
const db = require('../../../shared/config/database');
const { formatShift, safeJsonParse } = require('../../../shared/utils/formatUtils');

const router = express.Router();

// GET all shifts
router.get('/', async (req, res, next) => {
  try {
    const [results] = await db.promise().query('SELECT * FROM shifts');
    
    const shifts = results.map(shift => formatShift(shift));
    res.json(shifts);
  } catch (error) {
    next(error);
  }
});

// GET shifts by date range
router.get('/range', async (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate query parameters are required' });
  }
  
  try {
    const query = 'SELECT * FROM shifts WHERE date BETWEEN ? AND ?';
    const [results] = await db.promise().query(query, [startDate, endDate]);
    
    const shifts = results.map(shift => formatShift(shift));
    res.json(shifts);
  } catch (error) {
    next(error);
  }
});

// POST create new shift
router.post('/', async (req, res, next) => {
  const { title, startTime, endTime, date, requiredStation, requiredEmployees, assignedEmployees, isCompleted, priority, department } = req.body;
  
  const query = `
    INSERT INTO shifts (title, startTime, endTime, date, requiredStation, requiredEmployees, assignedEmployees, isCompleted, priority, department)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    title,
    startTime,
    endTime,
    date,
    JSON.stringify(requiredStation || []),
    requiredEmployees || 1,
    JSON.stringify(assignedEmployees || []),
    Boolean(isCompleted),
    priority || 'medium',
    department || 'general'
  ];
  
  try {
    const [result] = await db.promise().query(query, values);
    
    // Return the newly created shift
    const [newShift] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [result.insertId]);
    const formattedShift = formatShift(newShift[0]);
    
    res.status(201).json(formattedShift);
  } catch (error) {
    next(error);
  }
});

// PUT update shift
router.put('/:id', async (req, res, next) => {
  const { id } = req.params;
  const { title, startTime, endTime, date, requiredStation, requiredEmployees, assignedEmployees, isCompleted, priority, department } = req.body;
  
  const query = `
    UPDATE shifts 
    SET title = ?, startTime = ?, endTime = ?, date = ?, requiredStation = ?, requiredEmployees = ?, assignedEmployees = ?, isCompleted = ?, priority = ?, department = ?
    WHERE id = ?
  `;
  
  const values = [
    title,
    startTime,
    endTime,
    date,
    JSON.stringify(requiredStation || []),
    requiredEmployees,
    JSON.stringify(assignedEmployees || []),
    Boolean(isCompleted),
    priority,
    department,
    id
  ];
  
  try {
    const [result] = await db.promise().query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    // Return the updated shift
    const [updatedShift] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [id]);
    const formattedShift = formatShift(updatedShift[0]);
    
    res.json(formattedShift);
  } catch (error) {
    next(error);
  }
});

// POST bulk create shifts
router.post('/bulk', async (req, res, next) => {
  const shifts = req.body;

  if (!Array.isArray(shifts)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Request body must be an array of shifts'
    });
  }

  if (shifts.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'At least one shift must be provided'
    });
  }

  if (shifts.length > 50) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Maximum 50 shifts can be created at once'
    });
  }

  const connection = await db.promise().getConnection();
  const startTime = Date.now();
  const createdShifts = [];
  const errors = [];

  try {
    await connection.beginTransaction();

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      const { title, startTime, endTime, date, requiredStation, requiredEmployees, assignedEmployees, isCompleted, priority, department } = shift;

      // Validation
      if (!title || !startTime || !endTime || !date) {
        errors.push({ index: i, error: 'title, startTime, endTime, and date are required' });
        continue;
      }

      const query = `
        INSERT INTO shifts (title, startTime, endTime, date, requiredStation, requiredEmployees, assignedEmployees, isCompleted, priority, department)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const values = [
        title,
        startTime,
        endTime,
        date,
        JSON.stringify(requiredStation || []),
        requiredEmployees || 1,
        JSON.stringify(assignedEmployees || []),
        Boolean(isCompleted),
        priority || 'medium',
        department || 'general'
      ];

      try {
        const [result] = await connection.query(query, values);

        // Get the created shift
        const [newShift] = await connection.query('SELECT * FROM shifts WHERE id = ?', [result.insertId]);
        createdShifts.push(formatShift(newShift[0]));

      } catch (shiftError) {
        errors.push({ index: i, error: shiftError.message });
      }
    }

    if (errors.length > 0 && createdShifts.length === 0) {
      // No shifts created successfully, rollback
      await connection.rollback();
      return res.status(400).json({
        error: 'Bulk Creation Failed',
        message: 'No shifts were created due to validation errors',
        errors
      });
    }

    await connection.commit();

    const duration = Date.now() - startTime;
    console.log(`Bulk created ${createdShifts.length} shifts in ${duration}ms`);

    res.status(201).json({
      message: `Successfully created ${createdShifts.length} shifts`,
      shifts: createdShifts,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in bulk shift creation:', error);
    next(error);
  } finally {
    connection.release();
  }
});

// DELETE shift
router.delete('/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    const [result] = await db.promise().query('DELETE FROM shifts WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    res.json({ message: 'Shift deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
