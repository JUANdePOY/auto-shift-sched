/**
 * Validation middleware for employee routes
 */

const { body, param, validationResult } = require('express-validator');
const { createAppError, logError } = require('../../../shared/utils/errorHandler');

/**
 * Validation rules for creating/updating employees
 */
const employeeValidationRules = [
  // Name validation
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  // Email validation
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  // Department validation
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isIn(['Service', 'Production'])
    .withMessage('Department must be either "Service" or "Production"'),

  // Station validation
  body('station')
    .custom((value) => {
      if (Array.isArray(value)) {
        // Validate each station in the array
        return value.every(station => typeof station === 'string' && station.trim().length > 0);
      }
      return typeof value === 'string' && value.trim().length > 0;
    })
    .withMessage('Station must be a string or array of strings'),

  // Max hours validation
  body('maxHoursPerWeek')
    .isInt({ min: 0, max: 168 })
    .withMessage('Max hours per week must be between 0 and 168')
    .optional({ nullable: true }),

  // Current hours validation
  body('currentWeeklyHours')
    .isInt({ min: 0, max: 168 })
    .withMessage('Current weekly hours must be between 0 and 168')
    .optional({ nullable: true }),

  // Availability validation
  body('availability')
    .optional()
    .isObject()
    .withMessage('Availability must be an object')
    .custom((availability) => {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of days) {
        if (availability[day]) {
          const dayAvail = availability[day];
          if (typeof dayAvail.available !== 'boolean') {
            throw new Error(`Availability for ${day} must have a boolean 'available' property`);
          }
          
          if (dayAvail.preferredStart && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayAvail.preferredStart)) {
            throw new Error(`Preferred start time for ${day} must be in HH:MM format`);
          }
          
          if (dayAvail.preferredEnd && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dayAvail.preferredEnd)) {
            throw new Error(`Preferred end time for ${day} must be in HH:MM format`);
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
    
    logError(appError, 'employeeValidation');
    
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
  param('id')
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

module.exports = {
  employeeValidationRules,
  handleValidationErrors,
  validateEmployeeId
};
