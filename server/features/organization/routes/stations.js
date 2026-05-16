const express = require('express');
const db = require('../../../shared/config/database');

const router = express.Router();

// GET all stations
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM stations ORDER BY name ASC');

    const stations = rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description || '',
      departmentId: row.departmentId ? row.departmentId.toString() : null,
      createdAt: row.createdAt || new Date().toISOString(),
      updatedAt: row.updatedAt || new Date().toISOString()
    }));

    res.json(stations);
  } catch (error) {
    next(error);
  }
});

// POST create new station
router.post('/', async (req, res, next) => {
  try {
    const { name, departmentId, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Station name is required' });
    }

    try {
      const [result] = await db.query(
        'INSERT INTO stations (name, departmentId, description) VALUES (?, ?, ?)',
        [name, departmentId || null, description || null]
      );

      const [newStation] = await db.query('SELECT * FROM stations WHERE id = ?', [result.insertId]);
      const station = newStation[0];
      res.status(201).json({
        id: station.id.toString(),
        name: station.name,
        description: station.description || '',
        departmentId: station.departmentId ? station.departmentId.toString() : null,
        createdAt: station.createdAt || new Date().toISOString(),
        updatedAt: station.updatedAt || new Date().toISOString()
      });
    } catch (err) {
      // If description column doesn't exist, try without it
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        const [result] = await db.query(
          'INSERT INTO stations (name, departmentId) VALUES (?, ?)',
          [name, departmentId || null]
        );

        const [newStation] = await db.query('SELECT * FROM stations WHERE id = ?', [result.insertId]);
        const station = newStation[0];
        res.status(201).json({
          id: station.id.toString(),
          name: station.name,
          description: '',
          departmentId: station.departmentId ? station.departmentId.toString() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        throw err;
      }
    }
  } catch (error) {
    next(error);
  }
});

// PUT update station
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, departmentId, description } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (departmentId !== undefined) {
      updates.push('departmentId = ?');
      values.push(departmentId || null);
    }

    // Only add description update if provided
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const [result] = await db.query(
      `UPDATE stations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const [updatedStation] = await db.query('SELECT * FROM stations WHERE id = ?', [id]);

    const station = updatedStation[0];
    res.json({
      id: station.id.toString(),
      name: station.name,
      description: station.description || '',
      departmentId: station.departmentId ? station.departmentId.toString() : null,
      createdAt: station.createdAt || new Date().toISOString(),
      updatedAt: station.updatedAt || new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// DELETE station
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await db.query('DELETE FROM stations WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Station not found' });
    }

    res.json({ message: 'Station deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
