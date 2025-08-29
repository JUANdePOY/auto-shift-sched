const express = require('express');
const db = require('../config/database');
const { formatEmployee, safeJsonParse } = require('../utils/formatUtils');
const { 
  employeeValidationRules, 
  handleValidationErrors,
  validateEmployeeId 
} = require('../validation/employeeValidation');

const router = express.Router();

// GET all employees
router.get('/', async (req, res, next) => {
  try {
    const [results] = await db.promise().query('SELECT * FROM employees');
    
    const employees = results.map(employee => formatEmployee(employee));
    res.json(employees);
  } catch (error) {
    next(error);
  }
});

// GET single employee by ID
router.get('/:id', validateEmployeeId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [results] = await db.promise().query('SELECT * FROM employees WHERE id = ?', [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Employee not found' 
      });
    }
    
    const employee = formatEmployee(results[0]);
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ 
      error: 'Database Error', 
      message: 'Failed to fetch employee' 
    });
  }
});

// POST create new employee
router.post('/', employeeValidationRules, handleValidationErrors, async (req, res, next) => {
  try {
    const { name, email, department, station, availability, maxHoursPerWeek, currentWeeklyHours } = req.body;
    
    const query = `
      INSERT INTO employees (name, email, department, station, availability, maxHoursPerWeek, currentWeeklyHours)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      name,
      email,
      department,
      JSON.stringify(station),
      JSON.stringify(availability),
      maxHoursPerWeek || 0,
      currentWeeklyHours || 0
    ];
    
    const [result] = await db.promise().query(query, values);
    
    // Return the newly created employee
    const [newEmployee] = await db.promise().query('SELECT * FROM employees WHERE id = ?', [result.insertId]);
    const formattedEmployee = formatEmployee(newEmployee[0]);
    
    res.status(201).json(formattedEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'Employee with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Database Error', 
      message: 'Failed to create employee' 
    });
  }
});

// PUT update employee
router.put('/:id', validateEmployeeId, employeeValidationRules, handleValidationErrors, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, department, station, availability, maxHoursPerWeek, currentWeeklyHours } = req.body;
    
    const query = `
      UPDATE employees 
      SET name = ?, email = ?, department = ?, station = ?, availability = ?, maxHoursPerWeek = ?, currentWeeklyHours = ?
      WHERE id = ?
    `;
    
    const values = [
      name,
      email,
      department,
      JSON.stringify(station),
      JSON.stringify(availability),
      maxHoursPerWeek,
      currentWeeklyHours,
      id
    ];
    
    const [result] = await db.promise().query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Employee not found' 
      });
    }
    
    // Return the updated employee
    const [updatedEmployee] = await db.promise().query('SELECT * FROM employees WHERE id = ?', [id]);
    const formattedEmployee = formatEmployee(updatedEmployee[0]);
    
    res.json(formattedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Conflict', 
        message: 'Employee with this email already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Database Error', 
      message: 'Failed to update employee' 
    });
  }
});

// DELETE employee
router.delete('/:id', validateEmployeeId, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await db.promise().query('DELETE FROM employees WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Not Found', 
        message: 'Employee not found' 
      });
    }
    
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ 
      error: 'Database Error', 
      message: 'Failed to delete employee' 
    });
  }
});

module.exports = router;
