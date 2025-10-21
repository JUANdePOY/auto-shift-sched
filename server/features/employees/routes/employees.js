const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../../../shared/config/database');

const router = express.Router();

// Get all employees
router.get('/', async (req, res) => {
  try {
    const [employees] = await db.execute(
      'SELECT id, name, email, role, department, station, position, maxHoursPerWeek, currentWeeklyHours, created_at, updated_at FROM employees'
    );

    // Parse JSON fields and fetch availability
    const formattedEmployees = await Promise.all(employees.map(async emp => {
      let station = [];
      if (emp.station) {
        try {
          station = JSON.parse(emp.station);
        } catch (e) {
          // If not valid JSON, treat as single station name
          station = [emp.station];
        }
      }

      // Fetch current week's availability from availability_submissions
      let availability = {};
      try {
        const availabilityService = require('../../availability/services/availabilityService');
        const currentWeekStart = new Date();
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Monday of current week
        const weekStartStr = currentWeekStart.toISOString().split('T')[0];

        const availabilityData = await availabilityService.getAvailability(emp.id, weekStartStr);
        if (availabilityData && availabilityData.availability) {
          availability = availabilityData.availability;
        }
      } catch (error) {
        console.warn(`Could not fetch availability for employee ${emp.id}:`, error.message);
        // Keep availability as empty object
      }

      return {
        ...emp,
        station,
        availability
      };
    }));

    res.json(formattedEmployees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [employees] = await db.execute(
      'SELECT id, name, email, role, department, station, position, maxHoursPerWeek, currentWeeklyHours, created_at, updated_at FROM employees WHERE id = ?',
      [id]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employee = employees[0];
    let station = [];
    if (employee.station) {
      try {
        station = JSON.parse(employee.station);
      } catch (e) {
        // If not valid JSON, treat as single station name
        station = [employee.station];
      }
    }
    employee.station = station;

    // Fetch current week's availability from availability_submissions
    let availability = {};
    try {
      const availabilityService = require('../../availability/services/availabilityService');
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay() + 1); // Monday of current week
      const weekStartStr = currentWeekStart.toISOString().split('T')[0];

      const availabilityData = await availabilityService.getAvailability(employee.id, weekStartStr);
      if (availabilityData && availabilityData.availability) {
        availability = availabilityData.availability;
      }
    } catch (error) {
      console.warn(`Could not fetch availability for employee ${employee.id}:`, error.message);
      // Keep availability as empty object
    }

    employee.availability = availability;

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create new employee
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role = 'crew', department, station, position, maxHoursPerWeek = 40, currentWeeklyHours = 0 } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if email already exists
    const [existing] = await db.execute('SELECT id FROM employees WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Set default password to employee's name if not provided
    const defaultPassword = password || name;

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

    // Insert employee
    const [result] = await db.execute(
      `INSERT INTO employees (name, email, password, role, department, station, position, maxHoursPerWeek, currentWeeklyHours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        hashedPassword,
        role,
        department,
        station ? JSON.stringify(station) : null,
        position || null,
        maxHoursPerWeek,
        currentWeeklyHours
      ]
    );

    // Return created employee (without password)
    const [newEmployee] = await db.execute(
      'SELECT id, name, email, role, department, station, position, maxHoursPerWeek, currentWeeklyHours, created_at, updated_at FROM employees WHERE id = ?',
      [result.insertId]
    );

    const employee = newEmployee[0];
    let parsedStation = [];
    if (employee.station) {
      try {
        parsedStation = JSON.parse(employee.station);
      } catch (e) {
        // If not valid JSON, treat as single station name
        parsedStation = [employee.station];
      }
    }
    employee.station = parsedStation;

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, department, station, position, maxHoursPerWeek, currentWeeklyHours } = req.body;

    // Check if employee exists
    const [existing] = await db.execute('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if email is taken by another employee
    if (email) {
      const [emailCheck] = await db.execute('SELECT id FROM employees WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (station !== undefined) {
      updates.push('station = ?');
      values.push(station ? JSON.stringify(station) : null);
    }
    if (position !== undefined) {
      updates.push('position = ?');
      values.push(position);
    }
    if (maxHoursPerWeek !== undefined) {
      updates.push('maxHoursPerWeek = ?');
      values.push(maxHoursPerWeek);
    }
    if (currentWeeklyHours !== undefined) {
      updates.push('currentWeeklyHours = ?');
      values.push(currentWeeklyHours);
    }


    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Execute update
    const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);
    await db.execute(query, values);

    // Return updated employee
    const [updatedEmployee] = await db.execute(
      'SELECT id, name, email, role, department, station, position, maxHoursPerWeek, currentWeeklyHours, created_at, updated_at FROM employees WHERE id = ?',
      [id]
    );

    const employee = updatedEmployee[0];
    let parsedStation = [];
    if (employee.station) {
      try {
        parsedStation = JSON.parse(employee.station);
      } catch (e) {
        // If not valid JSON, treat as single station name
        parsedStation = [employee.station];
      }
    }
    employee.station = parsedStation;

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if employee exists
    const [existing] = await db.execute('SELECT id FROM employees WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete employee
    await db.execute('DELETE FROM employees WHERE id = ?', [id]);

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
