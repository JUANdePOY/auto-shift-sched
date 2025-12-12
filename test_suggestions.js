const SuggestionEngine = require('./server/features/ai-suggestions/services/suggestionEngine.js');

async function test() {
  try {
    console.log('Testing AI suggestions...');
    const suggestions = await SuggestionEngine.getEmployeeSuggestions('1841', '2025-09-01', 5);
    console.log('Suggestions found:', suggestions.length);
    if (suggestions.length > 0) {
      suggestions.forEach((s, i) => {
        console.log(`${i+1}. ${s.employee.name} - Score: ${s.score}`);
      });
    } else {
      console.log('No suggestions found');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

test();
