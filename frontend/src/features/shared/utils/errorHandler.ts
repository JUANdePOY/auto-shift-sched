/**
 * Error handling utility for consistent error management across the application
 */

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
  isNetworkError?: boolean;
  isServerError?: boolean;
  isValidationError?: boolean;
}

/**
 * Creates a standardized error object from various error types
 */
export function createAppError(error: unknown, defaultMessage: string): AppError {
  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
      code: 'unknown_error',
      details: error
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      code: 'unknown_error'
    };
  }

  return {
    message: defaultMessage,
    code: 'unknown_error',
    details: error
  };
}

/**
 * Handles network errors specifically
 */
export function handleNetworkError(error: unknown, context: string): AppError {
  const appError = createAppError(error, `Network error occurred while ${context}`);
  return {
    ...appError,
    isNetworkError: true
  };
}

/**
 * Handles server errors (HTTP error responses)
 */
export function handleServerError(error: unknown, context: string): AppError {
  const appError = createAppError(error, `Server error occurred while ${context}`);
  return {
    ...appError,
    isServerError: true
  };
}

/**
 * Handles validation errors
 */
export function handleValidationError(error: unknown, context: string): AppError {
  const appError = createAppError(error, `Validation error occurred while ${context}`);
  return {
    ...appError,
    isValidationError: true
  };
}

/**
 * Logs errors consistently with context information
 */
export function logError(error: AppError, context: string) {
  console.error(`[${context}]`, {
    message: error.message,
    code: error.code,
    type: error.isNetworkError ? 'network' : 
          error.isServerError ? 'server' : 
          error.isValidationError ? 'validation' : 'unknown',
    details: error.details
  });
}

/**
 * Determines if an error should be shown to the user
 */
export function shouldShowErrorToUser(error: AppError): boolean {
  // Don't show network errors that might be temporary
  if (error.isNetworkError) {
    return false;
  }
  
  // Show validation and server errors to user
  return Boolean(error.isValidationError || error.isServerError);
}
