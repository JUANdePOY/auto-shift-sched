const availabilityService = require('./server/features/availability/services/availabilityService');

async function debugAvailabilityCheck() {
  try {
    // Test with a specific employee and date
    const employeeId = 5; // Sarah Johnson
    const date = '2024-10-01'; // Example date
    const startTime = '09:00';
    const endTime = '15:00';

    console.log(`Checking availability for employee ${employeeId} on ${date} from ${startTime} to ${endTime}`);

    const result = await availabilityService.checkEmployeeAvailability(employeeId, date, startTime, endTime);
    console.log('Result:', result);

    // Check what week this date falls into
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    const weekStartStr = weekStart.toISOString().split('T')[0];
    console.log(`Date ${date} falls in week starting ${weekStartStr}`);

    // Check if there's availability submission for this week
    const availability = await availabilityService.getAvailability(employeeId, weekStartStr);
    console.log('Availability submission:', {
      status: availability.status,
      hasAvailability: !!availability.availability,
      weekStart: availability.weekStart
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

debugAvailabilityCheck();
