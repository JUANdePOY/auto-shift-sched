const express = require('express');
const ScheduleGenerationService = require('../services/scheduleGenerationService');
const SuggestionEngine = require('../../ai-suggestions/services/suggestionEngine');

const router = express.Router();

// Generate new schedule
router.post('/generate', async (req, res, next) => {
  try {
    const { weekStart, options } = req.body;
    const generatedBy = req.user?.id || 1; // Default to user 1 if not authenticated

    if (!weekStart) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'weekStart is required'
      });
    }

    const schedule = await ScheduleGenerationService.generateSchedule(weekStart, generatedBy, options);

    res.status(201).json({
      message: 'Schedule generated successfully',
      schedule
    });

  } catch (error) {
    console.error('Error generating schedule:', error);
    next(error);
  }
});

// Get schedule for a week
router.get('/week/:weekStart', async (req, res, next) => {
  try {
    const { weekStart } = req.params;
    const schedule = await ScheduleGenerationService.getScheduleByWeek(weekStart);

    if (!schedule) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No schedule found for this week'
      });
    }

    res.json(schedule);

  } catch (error) {
    console.error('Error fetching schedule:', error);
    next(error);
  }
});

// Get schedule by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const schedule = await ScheduleGenerationService.getScheduleById(parseInt(id));

    res.json(schedule);

  } catch (error) {
    console.error('Error fetching schedule:', error);
    next(error);
  }
});

// Publish schedule
router.put('/:id/publish', async (req, res, next) => {
  try {
    const { id } = req.params;
    const publishedBy = req.user?.id || 1;

    const schedule = await ScheduleGenerationService.publishSchedule(parseInt(id), publishedBy);

    res.json({
      message: 'Schedule published successfully',
      schedule
    });

  } catch (error) {
    console.error('Error publishing schedule:', error);
    next(error);
  }
});

// Get AI suggestions for schedule
router.get('/:id/suggestions', async (req, res, next) => {
  try {
    const { id } = req.params;
    const generationId = parseInt(id);

    // Get suggestions from database
    const db = require('../../../shared/config/database');
    const [suggestions] = await db.promise().query(
      `SELECT * FROM ai_suggestions
       WHERE schedule_generation_id = ?
       ORDER BY confidence_score DESC`,
      [generationId]
    );

    const formattedSuggestions = suggestions.map(suggestion => ({
      id: suggestion.id,
      type: suggestion.suggestion_type,
      confidence: suggestion.confidence_score,
      changes: JSON.parse(suggestion.suggested_changes),
      applied: suggestion.applied,
      appliedAt: suggestion.applied_at
    }));

    res.json(formattedSuggestions);

  } catch (error) {
    console.error('Error fetching AI suggestions:', error);
    next(error);
  }
});

// Apply AI suggestion
router.post('/:id/suggestions/:suggestionId/apply', async (req, res, next) => {
  try {
    const { id, suggestionId } = req.params;
    const appliedBy = req.user?.id || 1;

    const schedule = await ScheduleGenerationService.applyAISuggestion(
      parseInt(id),
      parseInt(suggestionId),
      appliedBy
    );

    res.json({
      message: 'AI suggestion applied successfully',
      schedule
    });

  } catch (error) {
    console.error('Error applying AI suggestion:', error);
    next(error);
  }
});

// Get schedule summary
router.get('/summary/:weekStart', async (req, res, next) => {
  try {
    const { weekStart } = req.params;
    const summary = await ScheduleGenerationService.getScheduleSummary(weekStart);

    if (!summary) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No schedule summary found for this week'
      });
    }

    res.json(summary);

  } catch (error) {
    console.error('Error fetching schedule summary:', error);
    next(error);
  }
});

// Get all schedule generations
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const db = require('../../../shared/config/database');
    let query = 'SELECT * FROM schedule_generations';
    let params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY generated_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [schedules] = await db.promise().query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM schedule_generations';
    let countParams = [];

    if (status) {
      countQuery += ' WHERE status = ?';
      countParams.push(status);
    }

    const [countResult] = await db.promise().query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      schedules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching schedules:', error);
    next(error);
  }
});

// Delete draft schedule
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const db = require('../../../shared/config/database');

    // Check if schedule is draft
    const [schedule] = await db.promise().query(
      'SELECT status FROM schedule_generations WHERE id = ?',
      [id]
    );

    if (schedule.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Schedule not found'
      });
    }

    if (schedule[0].status !== 'draft') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only draft schedules can be deleted'
      });
    }

    // Delete schedule (cascade will delete assignments and suggestions)
    await db.promise().query('DELETE FROM schedule_generations WHERE id = ?', [id]);

    res.json({
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    next(error);
  }
});

module.exports = router;
