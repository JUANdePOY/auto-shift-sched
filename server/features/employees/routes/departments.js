const express = require('express');
const db = require('../../../shared/config/database');

const router = express.Router();

// GET all departments with their stations
router.get('/', async (req, res, next) => {
  try {
    // First, get all departments
    const [departments] = await db.query('SELECT * FROM departments');
    
    // For each department, get its stations
    const departmentsWithStations = await Promise.all(departments.map(async (department) => {
      const [stations] = await db.query('SELECT * FROM stations WHERE departmentId = ?', [department.id]);
      return {
        ...department,
        id: department.id.toString(),
        stations: Array.isArray(stations) ? stations.map(station => ({
          ...station,
          id: station.id.toString(),
          createdAt: station.createdAt || new Date().toISOString(),
          updatedAt: station.updatedAt || new Date().toISOString(),
          departmentId: station.departmentId ? station.departmentId.toString() : null
        })) : []
      };
    }));
    
    res.json(departmentsWithStations);
  } catch (error) {
    next(error);
  }
});

// GET stations by department ID
router.get('/:id/stations', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [stations] = await db.query('SELECT * FROM stations WHERE departmentId = ?', [id]);
    
    const formattedStations = stations.map(station => ({
      ...station,
      id: station.id.toString(),
      createdAt: station.createdAt || new Date().toISOString(),
      updatedAt: station.updatedAt || new Date().toISOString(),
      departmentId: station.departmentId ? station.departmentId.toString() : null
    }));
    
    res.json(formattedStations);
  } catch (error) {
    next(error);
  }
});

// POST create new department
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    // Try to insert with description first, fall back to just name if column doesn't exist
    try {
      const query = 'INSERT INTO departments (name, description) VALUES (?, ?)';
      const values = [name, description || null];
      const [result] = await db.query(query, values);
      
      const [newDepartment] = await db.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
      const formattedDepartment = {
        ...newDepartment[0],
        id: newDepartment[0].id.toString(),
        createdAt: newDepartment[0].createdAt || new Date().toISOString(),
        updatedAt: newDepartment[0].updatedAt || new Date().toISOString()
      };
      res.status(201).json(formattedDepartment);
    } catch (err) {
      // If description column doesn't exist, try without it
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await db.query('INSERT INTO departments (name) VALUES (?)', [name]);
        const [newDepartment] = await db.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
        const formattedDepartment = {
          ...newDepartment[0],
          id: newDepartment[0].id.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        res.status(201).json(formattedDepartment);
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
});

// PUT update department
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    try {
      const query = 'UPDATE departments SET name = ?, description = ? WHERE id = ?';
      const values = [name, description || null, id];
      
      const [result] = await db.query(query, values);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Department not found' });
      }
      
      const [updatedDepartment] = await db.query('SELECT * FROM departments WHERE id = ?', [id]);
      const formattedDepartment = {
        ...updatedDepartment[0],
        id: updatedDepartment[0].id.toString(),
        createdAt: updatedDepartment[0].createdAt || new Date().toISOString(),
        updatedAt: updatedDepartment[0].updatedAt || new Date().toISOString()
      };
      
      res.json(formattedDepartment);
    } catch (err) {
      // If description column doesn't exist, try without it
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await db.query('UPDATE departments SET name = ? WHERE id = ?', [name, id]);
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Department not found' });
        }
        
        const [updatedDepartment] = await db.query('SELECT * FROM departments WHERE id = ?', [id]);
        const formattedDepartment = {
          ...updatedDepartment[0],
          id: updatedDepartment[0].id.toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        res.json(formattedDepartment);
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
});

// DELETE department
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First, delete all stations associated with this department
    await db.query('DELETE FROM stations WHERE departmentId = ?', [id]);
    
    // Then, delete the department
    const [result] = await db.query('DELETE FROM departments WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
