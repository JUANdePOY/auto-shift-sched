// Helper function to determine shift type based on start time
export const getShiftType = (time: string): 'opener' | 'mid' | 'closer' | 'graveyard' => {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour >= 6 && hour < 12) return 'opener';
  if (hour >= 12 && hour < 18) return 'mid';
  if (hour >= 18 && hour < 24) return 'closer';
  return 'graveyard'; // 00:00 to 05:59
};

// Helper function to calculate end time (start + 6 hours)
export const calculateEndTime = (startTime: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  startDate.setHours(startDate.getHours() + 6);
  return startDate.toTimeString().slice(0, 5); // HH:MM format
};

// Helper function to format time for database (ensure HH:MM:SS format)
export const formatTimeForDB = (time: string): string => {
  return time.length === 5 ? `${time}:00` : time;
};

// Helper function to format time for display (ensure HH:MM format)
export const formatTimeForDisplay = (time: string): string => {
  return time.slice(0, 5);
};
