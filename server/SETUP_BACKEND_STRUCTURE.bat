@echo off
echo Creating backend feature-based directory structure...

REM Create feature directories
mkdir features\employees\routes
mkdir features\employees\validation
mkdir features\employees\services
mkdir features\employees\models

mkdir features\schedule\routes
mkdir features\schedule\services
mkdir features\schedule\models

mkdir features\ai-suggestions\routes
mkdir features\ai-suggestions\services

REM Create shared directories
mkdir shared\middleware
mkdir shared\utils
mkdir shared\config

echo Directory structure created successfully!
echo.
echo Next steps:
echo 1. Move existing files to their new locations
echo 2. Update import paths in files
echo 3. Update main index.js to use new structure
pause
