  /**
 * Simple validation middleware for status endpoint
 */

const validateWeekStartStatus = (req, res, next) => {
  const { weekStart } = req.params;
  console.log('Validating weekStart in statusValidation:', weekStart);
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    console.log('Invalid date format:', weekStart);
    return res.status(400).json({
      error: 'Invalid Week Start',
      message: 'Week start must be a valid date in YYYY-MM-DD format'
    });
  }
  
  // Validate it's a Monday
  const date = new Date(weekStart);
  console.log('Parsed date:', date, 'Day of week:', date.getDay());
  
  if (date.toString() === 'Invalid Date') {
    console.log('Invalid date object:', weekStart);
    return res.status(400).json({
      error: 'Invalid Week Start',
      message: 'Week start must be a valid date'
    });
  }
  
  if (date.getDay() !== 1) {
    console.log('Not a Monday:', weekStart, 'Day:', date.getDay(), 'Adjusting to Monday');
    const dayOfWeek = date.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Adjust to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    const adjustedWeekStart = `${year}-${month}-${day}`;
    req.params.weekStart = adjustedWeekStart;
    console.log('Adjusted weekStart to:', adjustedWeekStart);
  }
  
  console.log('WeekStart validation passed:', weekStart);
  next();
};

module.exports = {
  validateWeekStartStatus
};
