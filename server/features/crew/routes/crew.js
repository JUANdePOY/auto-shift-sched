const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../auth/middleware/auth');
const crewService = require('../services/crewService');

// Apply authentication middleware to all crew routes
router.use(authenticateToken);

// Middleware to check if user can access their own data or is admin
const checkAccess = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;

  if (userRole === 'admin' || parseInt(id) === userId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

// Get crew profile
router.get('/:id/profile', checkAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await crewService.getProfile(id);
    res.json(profile);
  } catch (error) {
    console.error('Error fetching crew profile:', error);
    res.status(500).json({ error: 'Failed to fetch crew profile' });
  }
});

// Get upcoming shifts for crew member
router.get('/:id/shifts/upcoming', checkAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const shifts = await crewService.getUpcomingShifts(id);
    res.json(shifts);
  } catch (error) {
    console.error('Error fetching upcoming shifts:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming shifts' });
  }
});

// Get crew stats
router.get('/:id/stats', checkAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await crewService.getStats(id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching crew stats:', error);
    res.status(500).json({ error: 'Failed to fetch crew stats' });
  }
});

// Update crew availability
router.put('/:id/availability', checkAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    const result = await crewService.updateAvailability(id, availability);
    res.json(result);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

module.exports = router;
