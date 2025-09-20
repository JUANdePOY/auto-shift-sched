# Auto Shift Scheduler

A full-stack application for automated employee shift scheduling with React TypeScript frontend and Node.js/Express backend with MySQL database.

## Features

- **Employee Management**: CRUD operations for employees with skills and availability tracking
- **Shift Scheduling**: Create, view, update, and delete shifts with required skills and employee assignments
- **Weekly View**: Calendar interface for viewing and managing weekly schedules
- **Automated Scheduling**: (Planned) Algorithm for automatically assigning employees to shiftsc based on skills and availability

## Tech Stack

### Frontend
- React 18 with TypeScript
- React Router for navigation
- Axios for API calls
- CSS Modules for styling

### Backend
- Node.js with Express
- MySQL database with connection pooling
- CORS enabled for frontend communication
- RESTful API design

### Database
- MySQL with XAMPP/WAMP
- Tables: employees, shifts, timeoff (planned)

## Project Structure

```
auto-shift-sched/
├── server/                 # Backend Express server
│   └── index.js           # Main server file with all API routes
├── frontend/              # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service functions
│   │   └── App.tsx        # Main app component
├── insert_sample_data.js  # Script to insert sample employee data
├── insert_weekly_schedule.sql # SQL script for sample schedule data
├── insert_schedule.sh     # Shell script to insert schedule data via API
├── test_schedule_api.sh   # Test script for schedule API endpoints
└── PROJECT_TODO.md        # Complete project task list
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MySQL (XAMPP/WAMP recommended)
- npm or yarn

### 1. Database Setup
```bash
# Start MySQL server (XAMPP/WAMP)
# Create database (auto-shift-sched will be created automatically)
```

### 2. Backend Setup
```bash
cd server
npm install
npm start
```
Server runs on http://localhost:3001

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend runs on http://localhost:3000

### 4. Insert Sample Data
```bash
# Insert sample employees
node insert_sample_data.js

# Insert sample schedule (make sure server is running)
./insert_schedule.sh
```

## API Endpoints

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Shifts/Schedule
- `GET /api/shifts` - Get all shifts
- `GET /api/shifts/range?startDate=&endDate=` - Get shifts by date range
- `POST /api/shifts` - Create new shift
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

## Testing

```bash
# Test schedule API endpoints
./test_schedule_api.sh

# Test with curl
curl http://localhost:3001/api/employees
curl http://localhost:3001/api/shifts
```

## Current Status

✅ **Completed:**
- Backend server with employee and schedule APIs
- Frontend React app with employee management
- Database schema and sample data insertion
- Basic schedule view component

🚧 **In Progress:**
- Timeoff request management
- User authentication
- Automated scheduling algorithm

## Next Steps

1. Complete timeoff management system
2. Implement user authentication
3. Develop automated scheduling algorithm
4. Add advanced filtering and search
5. Implement notifications system
6. Add reporting and analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
