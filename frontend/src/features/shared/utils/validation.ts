/**
 * Validation utilities for form inputs and data
 */

import type { EmployeeFormData, WeeklyAvailability } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'range' | 'custom';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return {
      field: 'email',
      message: 'Email is required',
      type: 'required'
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'Please enter a valid email address',
      type: 'format'
    };
  }

  return null;
}

/**
 * Validates a name (2-50 characters, letters and spaces only)
 */
export function validateName(name: string, field: string = 'name'): ValidationError | null {
  if (!name) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
      type: 'required'
    };
  }

  if (name.length < 2) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least 2 characters`,
      type: 'range'
    };
  }

  if (name.length > 50) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be less than 50 characters`,
      type: 'range'
    };
  }

  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} can only contain letters, spaces, hyphens, and apostrophes`,
      type: 'format'
    };
  }

  return null;
}

/**
 * Validates hours (0-168, must be a number)
 */
export function validateHours(hours: number, field: string, min: number = 0, max: number = 168): ValidationError | null {
  if (hours === undefined || hours === null) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
      type: 'required'
    };
  }

  if (typeof hours !== 'number' || isNaN(hours)) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be a valid number`,
      type: 'format'
    };
  }

  if (hours < min) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${min}`,
      type: 'range'
    };
  }

  if (hours > max) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} cannot exceed ${max}`,
      type: 'range'
    };
  }

  return null;
}

/**
 * Validates time format (HH:MM)
 */
export function validateTime(time: string, field: string): ValidationError | null {
  if (!time) {
    return null; // Time is optional
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return {
      field,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} must be in HH:MM format`,
      type: 'format'
    };
  }

  return null;
}

/**
 * Validates employee form data
 */
export function validateEmployeeFormData(data: Partial<EmployeeFormData>): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate name
  const nameError = validateName(data.name || '', 'name');
  if (nameError) errors.push(nameError);

  // Validate email
  const emailError = validateEmail(data.email || '');
  if (emailError) errors.push(emailError);

  // Validate department
  if (!data.department) {
    errors.push({
      field: 'department',
      message: 'Department is required',
      type: 'required'
    });
  }

  // Validate max hours
  if (data.maxHoursPerWeek !== undefined) {
    const hoursError = validateHours(data.maxHoursPerWeek, 'maxHoursPerWeek', 0, 168);
    if (hoursError) errors.push(hoursError);
  }

  // Validate current hours
  if (data.currentWeeklyHours !== undefined) {
    const hoursError = validateHours(data.currentWeeklyHours, 'currentWeeklyHours', 0, 168);
    if (hoursError) errors.push(hoursError);
  }

  // Validate availability times
  if (data.availability) {
    Object.entries(data.availability).forEach(([day, availability]) => {
      if (availability.available) {
        const startError = validateTime(availability.preferredStart || '', `${day}.preferredStart`);
        if (startError) errors.push(startError);

        const endError = validateTime(availability.preferredEnd || '', `${day}.preferredEnd`);
        if (endError) errors.push(endError);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  const formatted: Record<string, string> = {};

  errors.forEach(error => {
    if (!formatted[error.field]) {
      formatted[error.field] = error.message;
    }
  });

  return formatted;
}

/**
 * Creates a default availability object
 */
export function createDefaultAvailability(): WeeklyAvailability {
  return {
    monday: { available: false },
    tuesday: { available: false },
    wednesday: { available: false },
    thursday: { available: false },
    friday: { available: false },
    saturday: { available: false },
    sunday: { available: false }
  };
}
