const express = require('express');
const db = require('../../../shared/config/database');
const { formatShift } = require('../../../shared/utils/formatUtils');

const router = express.Router();

// POST assign employee to shift
router.post('/:id/assign', async (req, res, next) => {
  const { id } = req.params;
  const { employeeId } = req.body;
  
  try {
    // First get the current shift to check assigned employees
    const [shiftResults] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [id]);
    
    if (shiftResults.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const shift = shiftResults[0];
    let assignedEmployees = [];
    
    try {
      assignedEmployees = Array.isArray(shift.assignedEmployees) ? shift.assignedEmployees : [];
      if (typeof shift.assignedEmployees === 'string') {
        assignedEmployees = JSON.parse(shift.assignedEmployees);
      }
    } catch (e) {
      console.error('Error parsing assigned employees:', e);
      assignedEmployees = [];
    }
    
    // Check if employee is already assigned
    if (assignedEmployees.includes(employeeId)) {
      return res.status(400).json({ error: 'Employee already assigned to this shift' });
    }
    
    // Add employee to assigned list
    assignedEmployees.push(employeeId);
    
    // Update the shift
    const updateQuery = 'UPDATE shifts SET assignedEmployees = ? WHERE id = ?';
    await db.promise().query(updateQuery, [JSON.stringify(assignedEmployees), id]);
    
    // Return the updated shift
    const [updatedShift] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [id]);
    const formattedShift = formatShift(updatedShift[0]);
    
    res.json(formattedShift);
  } catch (error) {
    next(error);
  }
});

// POST unassign employee from shift
router.post('/:id/unassign', async (req, res, next) => {
  const { id } = req.params;
  const { employeeId } = req.body;
  
  try {
    // First get the current shift to check assigned employees
    const [shiftResults] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [id]);
    
    if (shiftResults.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }
    
    const shift = shiftResults[0];
    let assignedEmployees = [];
    
    try {
      assignedEmployees = Array.isArray(shift.assignedEmployees) ? shift.assignedEmployees : [];
      if (typeof shift.assignedEmployees === 'string') {
        assignedEmployees = JSON.parse(shift.assignedEmployees);
      }
    } catch (e) {
      console.error('Error parsing assigned employees:', e);
      assignedEmployees = [];
    }
    
    // Check if employee is assigned
    if (!assignedEmployees.includes(employeeId)) {
      return res.status(400).json({ error: 'Employee not assigned to this shift' });
    }
    
    // Remove employee from assigned list
    assignedEmployees = assignedEmployees.filter(empId => empId !== employeeId);
    
    // Update the shift
    const updateQuery = 'UPDATE shifts SET assignedEmployees = ? WHERE id = ?';
    await db.promise().query(updateQuery, [JSON.stringify(assignedEmployees), id]);
    
    // Return the updated shift
    const [updatedShift] = await db.promise().query('SELECT * FROM shifts WHERE id = ?', [id]);
    const formattedShift = formatShift(updatedShift[0]);
    
    res.json(formattedShift);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
