const express = require('express');
const db = require('../../../shared/config/database');

const router = express.Router();

// GET all departments with their stations
router.get('/', async (req, res, next) => {
  try {
    // First, get all departments
    const [departments] = await db.promise().query('SELECT * FROM departments');
    
    // For each department, get its stations
    const departmentsWithStations = await Promise.all(departments.map(async (department) => {
      const [stations] = await db.promise().query('SELECT * FROM stations WHERE departmentId = ?', [department.id]);
      return {
        ...department,
        id: department.id.toString(),
        stations: stations.map(station => ({
          ...station,
          id: station.id.toString(),
          departmentId: station.departmentId.toString()
        }))
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
    const [stations] = await db.promise().query('SELECT * FROM stations WHERE departmentId = ?', [id]);
    
    const formattedStations = stations.map(station => ({
      ...station,
      id: station.id.toString(),
      departmentId: station.departmentId.toString()
    }));
    
    res.json(formattedStations);
  } catch (error) {
    next(error);
  }
});

// POST create new department
router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    
    const query = 'INSERT INTO departments (name) VALUES (?)';
    const values = [name];
    
    const [result] = await db.promise().query(query, values);
    
    // Return the newly created department
    const [newDepartment] = await db.promise().query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    const formattedDepartment = {
      ...newDepartment[0],
      id: newDepartment[0].id.toString()
    };
    
    res.status(201).json(formattedDepartment);
  } catch (error) {
    next(error);
  }
});

// PUT update department
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const query = 'UPDATE departments SET name = ? WHERE id = ?';
    const values = [name, id];
    
    const [result] = await db.promise().query(query, values);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    // Return the updated department
    const [updatedDepartment] = await db.promise().query('SELECT * FROM departments WHERE id = ?', [id]);
    const formattedDepartment = {
      ...updatedDepartment[0],
      id: updatedDepartment[0].id.toString()
    };
    
    res.json(formattedDepartment);
  } catch (error) {
    next(error);
  }
});

// DELETE department
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First, delete all stations associated with this department
    await db.promise().query('DELETE FROM stations WHERE departmentId = ?', [id]);
    
    // Then, delete the department
    const [result] = await db.promise().query('DELETE FROM departments WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
