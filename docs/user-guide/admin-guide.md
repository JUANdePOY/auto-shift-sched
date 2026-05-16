# Auto Shift Scheduler - Administrator Guide

This guide provides step-by-step instructions for administrators to manage the Auto Shift Scheduler system.

## Table of Contents
1. [System Access](#1-system-access)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Employee Management](#3-employee-management)
4. [Shift Management](#4-shift-management)
5. [Availability Management](#5-availability-management)
6. [Reports](#6-reports)

---

## 1. System Access

### 1.1 Logging In
1. Open your web browser and navigate to `http://localhost:3000`
2. You will see the login screen:
   ![Login Screen](placeholder-for-login-screen.png)
   *Take screenshot of the login page here*
3. Enter your administrator credentials:
   - Username: `admin` (or your assigned admin username)
   - Password: `admin123` (or your assigned password)
4. Click the "Login" button

### 1.2 Password Change (First Login)
If prompted to change your password:
1. Enter your current password
2. Enter a new password
3. Confirm the new password
4. Click "Save Changes"

---

## 2. Dashboard Overview

After logging in, you will be redirected to the Administrator Dashboard.

### 2.1 Dashboard Components
The dashboard consists of the following widgets:
1. **Schedule Coverage** - Shows percentage of shifts covered for the current week
2. **Employee Utilization** - Displays active vs. inactive employees
3. **Department Distribution** - Breakdown of employees by department
4. **Availability Status** - Shows how many employees have submitted availability
5. **Monthly Performance** - Trends in schedule coverage over the past 6 months
6. **Recent Activity** - Log of recent scheduling actions
7. **Today's Shifts** - List of shifts scheduled for today

*Take screenshot of the full dashboard here*

### 2.2 Navigation Menu
Located on the left side:
- Dashboard (current page)
- Employees
- Shifts
- Availability
- Reports
- Settings

*Take screenshot of the navigation menu here*

---

## 3. Employee Management

### 3.1 Viewing Employees
1. Click "Employees" in the navigation menu
2. You will see a list of all employees:
   ![Employee List](placeholder-for-employee-list.png)
   *Take screenshot of the employee list page*
3. Use the search bar to filter employees by name, email, or department
4. Use the dropdown filters to show active/inactive employees or by department

### 3.2 Adding a New Employee
1. On the Employees page, click the "+ New Employee" button (top-right)
2. Fill in the form:
   - First Name
   - Last Name
   - Email
   - Department
   - Position/Role
   - Skills (select from available options)
   - Availability (optional - can be set later)
   - Status (Active/Inactive)
3. Click "Save Employee"
   ![Add Employee Form](placeholder-for-add-employee-form.png)
   *Take screenshot of the add employee form*

### 3.3 Editing an Employee
1. On the Employees list, find the employee you wish to edit
2. Click the "Edit" icon (pencil) next to the employee's name
3. Modify the information in the form that appears
4. Click "Save Changes"

### 3.4 Deactivating/Deleting an Employee
1. On the Employees list, find the employee
2. Click the "More Actions" icon (three dots) next to the employee
3. Select "Deactivate" to temporarily disable the employee
   OR select "Delete" to permanently remove (use with caution)
4. Confirm the action in the popup dialog

---

## 4. Shift Management

### 4.1 Viewing Shifts
1. Click "Shifts" in the navigation menu
2. You will see a calendar view of shifts:
   ![Shift Calendar](placeholder-for-shift-calendar.png)
   *Take screenshot of the shift calendar view*
3. Use the date navigator at the top to move between weeks/months
4. Switch between "Week View", "Day View", and "List View" using the buttons

### 4.2 Creating a New Shift
1. On the Shifts page, click the "+ Create Shift" button
2. Or click on an empty time slot in the calendar view
3. Fill in the shift details:
   - Shift Name/Title
   - Date
   - Start Time
   - End Time
   - Department
   - Required Skills
   - Minimum Employees Needed
   - Maximum Employees Allowed
   - Description (optional)
4. Click "Save Shift"
   ![Create Shift Form](placeholder-for-create-shift-form.png)
   *Take screenshot of the create shift form*

### 4.3 Editing a Shift
1. On the shift calendar, click on the shift you wish to edit
2. Or find the shift in the list view and click "Edit"
3. Modify the shift details in the form
4. Click "Save Changes"

### 4.4 Assigning Employees to Shifts
1. Open the shift details by clicking on a shift in the calendar
2. In the shift detail panel, click the "Assign Employees" button
3. A list of eligible employees (based on skills and availability) will appear
4. Check the boxes next to employees you wish to assign
5. Click "Confirm Assignment"
   ![Assign Employees](placeholder-for-assign-employees.png)
   *Take screenshot of the employee assignment interface*

### 4.5 Deleting a Shift
1. Open the shift details
2. Click the "Delete Shift" button (usually at the bottom)
3. Confirm the deletion in the popup dialog

---

## 5. Availability Management

### 5.1 Viewing Employee Availability
1. Click "Availability" in the navigation menu
2. You will see a calendar showing who is available when:
   ![Availability Calendar](placeholder-for-availability-calendar.png)
   *Take screenshot of the availability calendar*
3. Use filters to show specific departments or date ranges
4. Green indicates available, red indicates unavailable, gray indicates no preference submitted

### 5.2 Requesting Availability Updates
1. As an admin, you can request employees to submit their availability
2. Click the "Request Availability" button
3. Select the date range for which you need availability
4. Choose to send to all employees or specific departments
5. Customize the message (optional)
6. Click "Send Requests"
   ![Request Availability](placeholder-for-request-availability.png)
   *Take screenshot of the request availability form*

### 5.3 Bulk Availability Actions
1. On the availability calendar, you can:
   - Approve multiple availability submissions at once
   - Send reminders to employees who haven't responded
   - Export availability data to CSV

---

## 6. Reports

### 6.1 Accessing Reports
1. Click "Reports" in the navigation menu
2. Select the type of report you wish to generate:
   - Schedule Coverage Report
   - Employee Hours Report
   - Department Utilization Report
   - Availability Completion Report

### 6.2 Generating a Report
1. Select a report type
2. Choose the date range
3. Select specific departments or employees (optional)
4. Click "Generate Report"
5. The report will display on screen with options to:
   - Export to PDF
   - Export to Excel
   - Print
   ![Report Generation](placeholder-for-report-generation.png)
   *Take screenshot of the report generation interface*

### 6.3 Scheduling Automated Reports
1. In the Reports section, click "Scheduled Reports"
2. Click "+ New Scheduled Report"
3. Configure:
   - Report type
   - Frequency (daily, weekly, monthly)
   - Date range
   - Recipients (email addresses)
   - Format (PDF, Excel)
4. Click "Save Schedule"

---

## Troubleshooting

### Common Issues
- **Cannot Login**: Verify credentials, ensure Caps Lock is off, contact administrator if locked out
- **Page Not Loading**: Refresh the browser, clear cache, check if server is running (localhost:3001 for API)
- **Missing Buttons**: Ensure you have administrator privileges, contact system administrator if access is denied

### Getting Help
- Refer to the user manual available in the Help section
- Contact system administrator at admin@company.com
- For technical issues, contact IT support at support@company.com

---
*Document last updated: May 16, 2026*