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
