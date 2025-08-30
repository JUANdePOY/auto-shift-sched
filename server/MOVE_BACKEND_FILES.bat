@echo off
echo Moving backend files to feature-based structure...

REM Move employee-related files
move routes\employees.js features\employees\routes\
move validation\employeeValidation.js features\employees\validation\

REM Move schedule-related files  
move routes\schedule.js features\schedule\routes\
move routes\shifts.js features\schedule\routes\
move routes\assignments.js features\schedule\routes\
move utils\scheduler.js features\schedule\services\

REM Move AI suggestions files
move utils\suggestionEngine.js features\ai-suggestions\services\

REM Move department files
move routes\departments.js features\employees\routes\

REM Move shared utilities and middleware
move middleware\errorHandler.js shared\middleware\
move utils\errorHandler.js shared\utils\
move utils\formatUtils.js shared\utils\
move config\database.js shared\config\

echo Files moved successfully!
echo.
echo Next steps:
echo 1. Update import paths in all moved files
echo 2. Update main index.js to use new structure
echo 3. Test that all functionality works correctly
pause
