const SuggestionEngine = require('./server/features/ai-suggestions/services/suggestionEngine.js');

async function testChickenSuggestions() {
  try {
    console.log('Testing suggestions for chicken expert shift on November 19, 2025...');
    const suggestions = await SuggestionEngine.getEmployeeSuggestions('1857', '2025-11-19', 10);
    console.log('Suggestions found:', suggestions.length);
    if (suggestions.length > 0) {
      suggestions.forEach((s, i) => {
        console.log(`${i+1}. ${s.employee.name} (ID: ${s.employee.id}) - Score: ${s.score}`);
        console.log('   Reasons:', s.reasons.join(', '));
        console.log('   Stations:', s.employee.station);
        console.log('   Availability:', JSON.stringify(s.employee.availability, null, 2));
        console.log('---');
      });
    } else {
      console.log('No suggestions found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testChickenSuggestions();
