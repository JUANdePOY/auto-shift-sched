/**
 * Simple error handler utility for consistent error creation and logging
 */

function createAppError(message, code, details = null) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function logError(error, context = '') {
  console.error(`[${context}] Error:`, error.message);
  if (error.details) {
    console.error('Details:', error.details);
  }
}

module.exports = {
  createAppError,
  logError
};
