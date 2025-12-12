const crewService = require('./server/features/crew/services/crewService');

async function testProfile() {
  try {
    const profile = await crewService.getProfile(5);
    console.log('Profile for employee 5:');
    console.log('Station field:', profile.station);
    console.log('Stations array:', profile.stations);
    console.log('Stations length:', profile.stations ? profile.stations.length : 'undefined');
    console.log('Stations type:', typeof profile.stations);
    if (profile.stations) {
      profile.stations.forEach((station, index) => {
        console.log(`Station ${index}: "${station}" (type: ${typeof station})`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testProfile();
