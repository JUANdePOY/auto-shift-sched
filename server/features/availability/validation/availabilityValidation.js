/**
 * Validation middleware for availability routes
 */

const { body, param, validationResult } = require('express-validator');
const { createAppError, logError } = require('../../../shared/utils/errorHandler');

/**
 * Validation rules for availability submissions
 */
const availabilityValidationRules = [
  // Employee ID validation
  body('employeeId')
    .isInt({ min: 1 })
    .withMessage('Employee ID must be a positive integer')
    .toInt(),

  // Week start validation (YYYY-MM-DD format)
  body('weekStart')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Week start must be a valid date in YYYY-MM-DD format')
    .custom((value) => {
      const date = new Date(value);
      
      // Ensure it's a Monday (start of week)
      if (date.getDay() !== 1) {
        throw new Error('Week start must be a Monday');
      }
      
      return true;
    }),

  // Availability validation
  body('availability')
    .isObject()
    .withMessage('Availability must be an object')
    .custom((availability) => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of days) {
        if (availability[day]) {
          const dayAvail = availability[day];
          
          // Check required available property
          if (typeof dayAvail.available !== 'boolean') {
            throw new Error(`Availability for ${day} must have a boolean 'available' property`);
          }
          
          // Validate preferred times if provided
          if (dayAvail.preferredStart && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayAvail.preferredStart)) {
            throw new Error(`Preferred start time for ${day} must be in HH:MM format`);
          }
          
          if (dayAvail.preferredEnd && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayAvail.preferredEnd)) {
            throw new Error(`Preferred end time for ${day} must be in HH:MM format`);
          }
          
          // Validate time blocks if provided
          if (dayAvail.timeBlocks && Array.isArray(dayAvail.timeBlocks)) {
            for (const block of dayAvail.timeBlocks) {
              if (!block.startTime || !block.endTime) {
                throw new Error(`Time blocks for ${day} must have startTime and endTime`);
              }
              if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(block.startTime)) {
                throw new Error(`Start time in time block for ${day} must be in HH:MM format`);
              }
              if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(block.endTime)) {
                throw new Error(`End time in time block for ${day} must be in HH:MM format`);
              }
            }
          }
        }
      }
      return true;
    })
];

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    const appError = createAppError(
      'Validation failed', 
      'VALIDATION_ERROR',
      validationErrors
    );
    
    logError(appError, 'availabilityValidation');
    
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: validationErrors
    });
  }
  
  next();
};

/**
 * Middleware to validate employee ID parameter
 */
const validateEmployeeId = [
  param('employeeId')
    .isInt({ min: 1 })
    .withMessage('Employee ID must be a positive integer')
    .toInt(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid Employee ID',
        message: errors.array()[0].msg
      });
    }
    next();
  }
];

/**
 * Middleware to validate week start parameter (for routes with employeeId)
 */
const validateWeekStart = [
  param('weekStart')
    .isDate({ format: 'YYYY-MM-DD' })
    .withMessage('Week start must be a valid date in YYYY-MM-DD format')
    .custom((value) => {
      const date = new Date(value);
      if (date.getDay() !== 1) {
        throw new Error('Week start must be a Monday');
      }
      return true;
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Invalid Week Start',
        message: errors.array()[0].msg
      });
    }
    next();
  }
];

/**
 * Middleware to validate week start parameter for status endpoint
 */
const validateWeekStartStatus = (req, res, next) => {
  const { weekStart } = req.params;
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return res.status(400).json({
      error: 'Invalid Week Start',
      message: 'Week start must be a valid date in YYYY-MM-DD format'
    });
  }
  
  // Validate it's a Monday
  const date = new Date(weekStart);
  if (date.toString() === 'Invalid Date') {
    return res.status(400).json({
      error: 'Invalid Week Start',
      message: 'Week start must be a valid date'
    });
  }
  
  if (date.getDay() !== 1) {
    return res.status(400).json({
      error: 'Invalid Week Start',
      message: 'Week start must be a Monday'
    });
  }
  
  next();
};

module.exports = {
  availabilityValidationRules,
  handleValidationErrors,
  validateEmployeeId,
  validateWeekStart,
  validateWeekStartStatus
};
