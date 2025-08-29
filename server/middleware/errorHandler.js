/**
 * Error handling middleware for Express
 * @param {Error} err - The error object
 * @param {import('express').Request} req - The request object
 * @param {import('express').Response} res - The response object
 * @param {import('express').NextFunction} next - The next function
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Database errors
  if (err.code === 'ER_NO_SUCH_TABLE' || err.code === 'ER_BAD_FIELD_ERROR') {
    return res.status(500).json({ 
      error: 'Database configuration error', 
      message: 'Please run /setup-database first' 
    });
  }

  // MySQL connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({ 
      error: 'Database connection error', 
      message: 'Cannot connect to database. Please check your MySQL server.' 
    });
  }

  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

module.exports = errorHandler;
