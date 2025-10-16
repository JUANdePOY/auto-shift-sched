const db = require('../../../shared/config/database');
const ShiftScheduler = require('./scheduler');
const SuggestionEngine = require('../../ai-suggestions/services/suggestionEngine');

/**
 * Schedule Generation Service
 * Handles the complete schedule generation workflow
 */
class ScheduleGenerationService {
  constructor() {
    this.status = {
      DRAFT: 'draft',
      PUBLISHED: 'published',
      ARCHIVED: 'archived'
    };
  }

  /**
   * Generate a new schedule for a week
   * @param {string} weekStart - Week start date (YYYY-MM-DD)
   * @param {number} generatedBy - User ID who generated the schedule
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated schedule with metadata
   */
  async generateSchedule(weekStart, generatedBy, options = {}) {
    try {
      // Check if schedule already exists for this week
      const existingSchedule = await this.getScheduleByWeek(weekStart);
      if (existingSchedule && existingSchedule.status === this.status.PUBLISHED) {
        throw new Error('Published schedule already exists for this week');
      }

      // Generate automated schedule
      const endDate = this.getWeekEndDate(weekStart);
      const scheduleResult = await ShiftScheduler.generateSchedule(weekStart, endDate);

      // Create schedule generation record
      const generationId = await this.createScheduleGeneration(weekStart, generatedBy, options);

      // Store assignments
      await this.storeAssignments(generationId, scheduleResult.assignments);

      // Generate AI suggestions for optimization
      const suggestions = await this.generateAISuggestions(generationId, scheduleResult.assignments);

      return {
        generationId,
        weekStart,
        assignments: scheduleResult.assignments,
        conflicts: scheduleResult.conflicts,
        coverageRate: scheduleResult.coverageRate,
        suggestions,
        status: this.status.DRAFT
      };

    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Get schedule for a specific week
   * @param {string} weekStart - Week start date
   * @returns {Promise<Object|null>} Schedule data or null
   */
  async getScheduleByWeek(weekStart) {
    const [results] = await db.query(
      'SELECT * FROM schedule_generations WHERE week_start = ? ORDER BY generated_at DESC LIMIT 1',
      [weekStart]
    );

    if (results.length === 0) return null;

    const schedule = results[0];
    const assignments = await this.getScheduleAssignments(schedule.id);

    return {
      id: schedule.id,
      weekStart: schedule.week_start,
      generatedAt: schedule.generated_at,
      generatedBy: schedule.generated_by,
      status: schedule.status,
      notes: schedule.notes,
      assignments
    };
  }

  /**
   * Publish a draft schedule
   * @param {number} generationId - Schedule generation ID
   * @param {number} publishedBy - User ID publishing the schedule
   * @returns {Promise<Object>} Updated schedule
   */
  async publishSchedule(generationId, publishedBy) {
    try {
      // Update schedule status
      await db.query(
        'UPDATE schedule_generations SET status = ?, notes = CONCAT(IFNULL(notes, ""), " Published by user ", ?) WHERE id = ?',
        [this.status.PUBLISHED, publishedBy, generationId]
      );

      // Archive any previous published schedules for this week
      const [schedule] = await db.query(
        'SELECT week_start FROM schedule_generations WHERE id = ?',
        [generationId]
      );

      if (schedule.length > 0) {
        await db.query(
          'UPDATE schedule_generations SET status = ? WHERE week_start = ? AND status = ? AND id != ?',
          [this.status.ARCHIVED, schedule[0].week_start, this.status.PUBLISHED, generationId]
        );
      }

      return await this.getScheduleById(generationId);

    } catch (error) {
      console.error('Error publishing schedule:', error);
      throw error;
    }
  }

  /**
   * Apply AI suggestion to schedule
   * @param {number} generationId - Schedule generation ID
   * @param {number} suggestionId - AI suggestion ID
   * @param {number} appliedBy - User ID applying the suggestion
   * @returns {Promise<Object>} Updated schedule
   */
  async applyAISuggestion(generationId, suggestionId, appliedBy) {
    try {
      // Get suggestion details
      const [suggestion] = await db.query(
        'SELECT * FROM ai_suggestions WHERE id = ? AND schedule_generation_id = ?',
        [suggestionId, generationId]
      );

      if (suggestion.length === 0) {
        throw new Error('Suggestion not found');
      }

      const suggestionData = suggestion[0];
      const changes = JSON.parse(suggestionData.suggested_changes);

      // Apply changes based on suggestion type
      await this.applySuggestionChanges(generationId, changes, suggestionData.suggestion_type);

      // Mark suggestion as applied
      await db.query(
        'UPDATE ai_suggestions SET applied = TRUE, applied_at = NOW() WHERE id = ?',
        [suggestionId]
      );

      return await this.getScheduleById(generationId);

    } catch (error) {
      console.error('Error applying AI suggestion:', error);
      throw error;
    }
  }

  /**
   * Get schedule assignments
   * @param {number} generationId - Schedule generation ID
   * @returns {Promise<Array>} List of assignments
   */
  async getScheduleAssignments(generationId) {
    const [results] = await db.query(
      `SELECT sa.*, e.name as employee_name, s.title as shift_title, sa.assignment_date as date, s.start_time, s.end_time
       FROM schedule_assignments sa
       JOIN employees e ON sa.employee_id = e.id
       JOIN shifts s ON sa.shift_id = s.id
       WHERE sa.schedule_generation_id = ?
       ORDER BY sa.assignment_date, s.start_time`,
      [generationId]
    );

    return results;
  }

  /**
   * Get schedule by ID
   * @param {number} generationId - Schedule generation ID
   * @returns {Promise<Object>} Schedule data
   */
  async getScheduleById(generationId) {
    const [results] = await db.query(
      'SELECT * FROM schedule_generations WHERE id = ?',
      [generationId]
    );

    if (results.length === 0) {
      throw new Error('Schedule not found');
    }

    const schedule = results[0];
    const assignments = await this.getScheduleAssignments(generationId);

    return {
      id: schedule.id,
      weekStart: schedule.week_start,
      generatedAt: schedule.generated_at,
      generatedBy: schedule.generated_by,
      status: schedule.status,
      notes: schedule.notes,
      assignments
    };
  }

  /**
   * Create schedule generation record
   * @param {string} weekStart - Week start date
   * @param {number} generatedBy - User ID
   * @param {Object} options - Generation options
   * @returns {Promise<number>} Generation ID
   */
  async createScheduleGeneration(weekStart, generatedBy, options) {
    const [result] = await db.query(
      'INSERT INTO schedule_generations (week_start, generated_by, status, notes) VALUES (?, ?, ?, ?)',
      [weekStart, generatedBy, this.status.DRAFT, options.notes || 'Auto-generated schedule']
    );

    return result.insertId;
  }

  /**
   * Store schedule assignments with professional bulk insertion
   * @param {number} generationId - Schedule generation ID
   * @param {Array} assignments - List of assignments [{shiftId, employeeId, date}]
   * @throws {Error} If validation fails or database operation fails
   */
  async storeAssignments(generationId, assignments) {
    // Input validation
    if (!generationId || typeof generationId !== 'number') {
      throw new Error('Invalid generationId: must be a valid number');
    }

    if (!Array.isArray(assignments)) {
      throw new Error('Invalid assignments: must be an array');
    }

    if (assignments.length === 0) {
      console.log(`No assignments to store for generation ${generationId}`);
      return;
    }

    // Validate each assignment
    for (let i = 0; i < assignments.length; i++) {
      const assignment = assignments[i];
      if (!assignment.shiftId || !assignment.employeeId || !assignment.date) {
        throw new Error(`Invalid assignment at index ${i}: shiftId, employeeId, and date are required`);
      }
      if (typeof assignment.shiftId !== 'number' || typeof assignment.employeeId !== 'number') {
        throw new Error(`Invalid assignment at index ${i}: shiftId and employeeId must be numbers`);
      }
    }

    const connection = await db.promise().getConnection();
    const startTime = Date.now();

    try {
      // Start transaction for atomicity
      await connection.beginTransaction();

      // Prepare values for bulk insert
      const values = assignments.map(assignment => [
        generationId,
        assignment.shiftId,
        assignment.employeeId,
        assignment.date,
        new Date()
      ]);

      // Bulk insert with IGNORE to handle potential duplicates gracefully
      const [result] = await connection.query(
        'INSERT IGNORE INTO schedule_assignments (schedule_generation_id, shift_id, employee_id, assignment_date, assigned_at) VALUES ?',
        [values]
      );

      // Commit transaction
      await connection.commit();

      const duration = Date.now() - startTime;
      console.log(`Successfully stored ${result.affectedRows} assignments for generation ${generationId} in ${duration}ms`);

      // Log any skipped duplicates
      const skipped = assignments.length - result.affectedRows;
      if (skipped > 0) {
        console.warn(`${skipped} assignments were skipped (possible duplicates) for generation ${generationId}`);
      }

    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error(`Failed to store assignments for generation ${generationId}:`, error);
      throw new Error(`Database error while storing assignments: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  /**
   * Generate AI suggestions for schedule optimization
   * @param {number} generationId - Schedule generation ID
   * @param {Array} assignments - Current assignments
   * @returns {Promise<Array>} List of suggestions
   */
  async generateAISuggestions(generationId, assignments) {
    try {
      // Get all employees and shifts for the week
      const [employees] = await db.query('SELECT * FROM employees');
      const weekStart = await this.getWeekStartFromGeneration(generationId);
      const endDate = this.getWeekEndDate(weekStart);

      const [shifts] = await db.query(
        'SELECT * FROM shifts WHERE date BETWEEN ? AND ?',
        [weekStart, endDate]
      );

      // Generate suggestions using AI engine
      const suggestions = [];

      // Generate employee suggestions for unassigned shifts
      for (const shift of shifts) {
        const assignedEmployees = assignments.filter(a => a.shiftId === shift.id).length;
        const requiredEmployees = shift.required_employees || 1;

        if (assignedEmployees < requiredEmployees) {
          try {
            const employeeSuggestions = await SuggestionEngine.getEmployeeSuggestions(shift.id, 3);
            for (const suggestion of employeeSuggestions) {
              suggestions.push({
                generationId,
                type: 'assignment',
                confidence: suggestion.score,
                changes: {
                  shiftId: shift.id,
                  employeeId: suggestion.employee.id,
                  action: 'assign'
                },
                reason: suggestion.reasons.join(', ')
              });
            }
          } catch (error) {
            console.warn(`Could not generate suggestions for shift ${shift.id}:`, error);
          }
        }
      }

      // Store suggestions in database
      for (const suggestion of suggestions.slice(0, 10)) { // Limit to top 10
        await db.query(
          'INSERT INTO ai_suggestions (schedule_generation_id, suggestion_type, confidence_score, suggested_changes) VALUES (?, ?, ?, ?)',
          [generationId, suggestion.type, suggestion.confidence, JSON.stringify(suggestion.changes)]
        );
      }

      return suggestions.slice(0, 10);

    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return [];
    }
  }

  /**
   * Apply suggestion changes to schedule
   * @param {number} generationId - Schedule generation ID
   * @param {Object} changes - Changes to apply
   * @param {string} suggestionType - Type of suggestion
   */
  async applySuggestionChanges(generationId, changes, suggestionType) {
    switch (suggestionType) {
      case 'assignment':
        if (changes.action === 'assign') {
          // Get week start for date
          const weekStart = await this.getWeekStartFromGeneration(generationId);
          await db.query(
            'INSERT INTO schedule_assignments (schedule_generation_id, shift_id, employee_id, assignment_date, assigned_at) VALUES (?, ?, ?, ?, NOW())',
            [generationId, changes.shiftId, changes.employeeId, weekStart]
          );
        }
        break;

      case 'swap':
        // Implement employee swap logic
        break;

      case 'optimization':
        // Implement optimization changes
        break;
    }
  }

  /**
   * Get week start date from generation ID
   * @param {number} generationId - Schedule generation ID
   * @returns {Promise<string>} Week start date
   */
  async getWeekStartFromGeneration(generationId) {
    const [result] = await db.query(
      'SELECT week_start FROM schedule_generations WHERE id = ?',
      [generationId]
    );

    if (result.length === 0) {
      throw new Error('Schedule generation not found');
    }

    return result[0].week_start;
  }

  /**
   * Calculate week end date
   * @param {string} weekStart - Week start date
   * @returns {string} Week end date
   */
  getWeekEndDate(weekStart) {
    const startDate = new Date(weekStart);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate.toISOString().split('T')[0];
  }

  /**
   * Get schedule summary statistics
   * @param {string} weekStart - Week start date
   * @returns {Promise<Object>} Schedule summary
   */
  async getScheduleSummary(weekStart) {
    const [result] = await db.query(
      'SELECT * FROM schedule_summary WHERE week_start = ?',
      [weekStart]
    );

    return result.length > 0 ? result[0] : null;
  }
}

module.exports = new ScheduleGenerationService();
