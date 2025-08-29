/**
 * Safely parses JSON string or returns object if already parsed
 * @param {*} data - JSON string or already parsed object
 * @param {*} defaultValue - Default value to return on error
 * @returns {*} Parsed JSON or original object or default value
 */
function safeJsonParse(data, defaultValue = []) {
  // If data is already an object/array, return it directly
  if (typeof data === 'object' && data !== null) {
    return data;
  }
  
  // If data is not a string, return default
  if (!data || typeof data !== 'string') {
    return defaultValue;
  }
  
  try {
    const parsed = JSON.parse(data);
    // If parsed data is a string (not an array), return it as a single-element array
    if (typeof parsed === 'string') {
      return [parsed];
    }
    return parsed;
  } catch (e) {
    console.error('JSON parse error:', e.message);
    // If it's a simple quoted string, return it as a single-element array
    if (data.startsWith('"') && data.endsWith('"')) {
      return [data.slice(1, -1)];
    }
    return defaultValue;
  }
}

/**
 * Formats employee data from database to match frontend interface
 * @param {Object} employee - Database employee object
 * @returns {Object} Formatted employee object
 */
function formatEmployee(employee) {
  const formatted = {
    id: employee.id.toString(),
    name: employee.name,
    email: employee.email,
    department: employee.department,
    station: safeJsonParse(employee.station),
    availability: safeJsonParse(employee.availability, {}),
    maxHoursPerWeek: employee.maxHoursPerWeek,
    currentWeeklyHours: employee.currentWeeklyHours
  };
  
  return formatted;
}

/**
 * Formats shift data from database to match frontend interface
 * @param {Object} shift - Database shift object
 * @returns {Object} Formatted shift object
 */
function formatShift(shift) {
  return {
    id: shift.id.toString(),
    title: shift.title,
    startTime: shift.startTime,
    endTime: shift.endTime,
    date: shift.date,
    requiredSkills: safeJsonParse(shift.requiredSkills, []),
    requiredEmployees: shift.requiredEmployees,
    assignedEmployees: safeJsonParse(shift.assignedEmployees, []),
    isCompleted: Boolean(shift.isCompleted),
    priority: shift.priority,
    department: shift.department
  };
}

module.exports = {
  safeJsonParse,
  formatEmployee,
  formatShift
};
