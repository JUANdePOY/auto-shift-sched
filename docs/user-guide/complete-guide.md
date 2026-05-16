# Auto Shift Scheduler - Complete User Guide

This document provides comprehensive instructions for both administrators and regular users of the Auto Shift Scheduler system. It includes step-by-step procedures and indicates where to take screenshots for documentation purposes.

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Access](#2-system-access)
3. [Administrator Guide](#3-administrator-guide)
4. [User Guide](#4-user-guide)
5. [Screenshot Guide](#5-screenshot-guide)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Introduction

The Auto Shift Scheduler is a full-stack application designed to streamline employee shift scheduling. It features separate interfaces for administrators (who manage the system) and employees/users (who view schedules and submit availability).

This guide covers:
- How to access the system
- Administrator-specific functions
- Employee/user-specific functions
- Where to capture screenshots for documentation

Separate detailed guides are available:
- [Administrator Guide](./user-guide/admin-guide.md)
- [User Guide](./user-guide/user-guide.md)

---

## 2. System Access

Both administrators and users access the system through the same login portal:

### 2.1 Logging In
1. Open your web browser (Chrome, Firefox, Safari, or Edge recommended)
2. Navigate to: `http://localhost:3000`
3. You will see the login screen (see [Screenshot #1](#screenshot-1-login-screen))
4. Enter your credentials:
   - **Administrators**: Use admin credentials provided during setup
   - **Users**: Use employee ID/email and password provided by administrator
5. Click the "Login" button

### 2.2 First-Time Login
If logging in for the first time:
1. You may be prompted to change your password
2. Enter your current password
3. Enter a new secure password
4. Confirm the new password
5. Click "Save Changes"

### 2.3 Password Recovery
If you forget your password:
1. Click the "Forgot Password?" link on the login screen
2. Enter your registered email address
3. Check your email for reset instructions
4. Follow the link to reset your password

---

## 3. Administrator Guide

Administrators have access to all system functions including managing employees, shifts, availability, and generating reports.

Detailed administrator instructions are in [./user-guide/admin-guide.md](./user-guide/admin-guide.md)

### 3.1 Dashboard Overview
After logging in, administrators see the Admin Dashboard showing:
- System-wide metrics
- Schedule coverage statistics
- Employee utilization
- Recent activity feed

### 3.2 Key Administrator Functions
- **Employee Management**: Add, edit, deactivate employees
- **Shift Management**: Create, modify, assign shifts
- **Availability Management**: View, request, approve employee availability
- **Reports**: Generate schedule, utilization, and compliance reports
- **Settings**: Configure system parameters

---

## 4. User Guide

Regular employees/users can view their schedules, submit availability, request time off, and view pay information.

Detailed user instructions are in [./user-guide/user-guide.md](./user-guide/user-guide.md)

### 4.1 Dashboard Overview
After logging in, users see their Personal Dashboard showing:
- Welcome message with their name
- Upcoming shifts for the next week
- Shift statistics
- Availability status
- Quick action buttons

### 4.2 Key User Functions
- **Schedule Viewing**: View personal schedule in calendar/list format
- **Availability Submission**: Indicate when you're available to work
- **Time Off Requests**: Submit vacation, sick leave, or other time off requests
- **Pay Stub Viewing**: Access and download pay statements
- **Profile Management**: Update personal information and preferences

---

## 5. Screenshot Guide

Use the following guidelines to capture screenshots for documentation. Screenshots should be taken at the indicated points in each guide.

### 5.1 Administrator Screenshots

**Screenshot 1: Login Screen**
- Location: `http://localhost:3000` (initial page)
- Show: Username/password fields, login button, forgot password link
- Guide Reference: Administrator Guide, Section 2.1

**Screenshot 2: Administrator Dashboard**
- Location: After login, main dashboard view
- Show: All dashboard widgets (Schedule Coverage, Employee Utilization, etc.)
- Guide Reference: Administrator Guide, Section 2.2

**Screenshot 3: Employee List View**
- Location: Employees page in navigation
- Show: List of employees with search/filter controls
- Guide Reference: Administrator Guide, Section 3.1

**Screenshot 4: Add Employee Form**
- Location: Click "+ New Employee" on Employees page
- Show: Complete form with all fields visible
- Guide Reference: Administrator Guide, Section 3.2

**Screenshot 5: Shift Calendar View**
- Location: Shifts page in navigation
- Show: Calendar view of shifts with navigation controls
- Guide Reference: Administrator Guide, Section 4.1

**Screenshot 6: Create Shift Form**
- Location: Click "+ Create Shift" on Shifts page
- Show: Form for creating new shift with all fields
- Guide Reference: Administrator Guide, Section 4.2

**Screenshot 7: Employee Assignment Interface**
- Location: Open shift details, click "Assign Employees"
- Show: List of employees with checkboxes for assignment
- Guide Reference: Administrator Guide, Section 4.4

**Screenshot 8: Availability Calendar**
- Location: Availability page in navigation
- Show: Calendar displaying employee availability status
- Guide Reference: Administrator Guide, Section 5.1

**Screenshot 9: Report Generation Interface**
- Location: Reports page in navigation
- Show: Report type selector, date range, generate button
- Guide Reference: Administrator Guide, Section 6.2

### 5.2 User Screenshots

**Screenshot 10: User Login Screen**
- Location: `http://localhost:3000` (same as admin login)
- Show: Username/password fields (use employee credentials)
- Guide Reference: User Guide, Section 2.1

**Screenshot 11: User Dashboard**
- Location: After login, main dashboard view
- Show: Welcome message, upcoming shifts, quick actions
- Guide Reference: User Guide, Section 2.2

**Screenshot 12: My Schedule View**
- Location: Schedule page in navigation
- Show: Personal schedule in calendar view with color coding
- Guide Reference: User Guide, Section 3.1

**Screenshot 13: Shift Detail Panel**
- Location: Click any shift in schedule view
- Show: Popup panel with shift details and assignment info
- Guide Reference: User Guide, Section 3.3

**Screenshot 14: Availability Calendar (User View)**
- Location: Availability page in navigation
- Show: Calendar for submitting personal availability
- Guide Reference: User Guide, Section 4.1

**Screenshot 15: Time Off Request Form**
- Location: Time Off page, click "+ Request Time Off"
- Show: Form for submitting time off request
- Guide Reference: User Guide, Section 5.1

**Screenshot 16: Pay Stub View**
- Location: Pay Stub page in navigation
- Show: Detailed pay statement with earnings and deductions
- Guide Reference: User Guide, Section 6.1

**Screenshot 17: Profile Edit Form**
- Location: Profile page, click "Edit Profile"
- Show: Form for updating personal information
- Guide Reference: User Guide, Section 7.1

### 5.3 Screenshot Best Practices
1. **Resolution**: Use your screen's native resolution for clarity
2. **Highlighting**: Use built-in tools to highlight important areas if needed
3. **Annotations**: Add arrows, circles, or text boxes to draw attention to key elements
4. **Consistency**: Use the same screenshot tool for all images (Snipping Tool, Snagit, etc.)
5. **File Format**: Save as PNG for best quality, or JPEG if file size is a concern
6. **Naming**: Use descriptive names like `admin-dashboard.png`, `user-schedule.png`
7. **Storage**: Save screenshots in a dedicated folder for easy access

---

## 6. Troubleshooting

### 6.1 Common Login Issues
- **Invalid Credentials**: Double-check username/password, ensure Caps Lock is off
- **Page Not Loading**: Verify server is running (`http://localhost:3001` for API)
- **Connection Errors**: Check network connection, try refreshing the page

### 6.2 Common Usage Issues
- **Missing Buttons/Features**: Ensure you have appropriate permissions (admin vs user)
- **Data Not Saving**: Check internet connection, try again after refreshing
- **Calendar Display Issues**: Try different browser or clear browser cache

### 6.3 Getting Help
- **Administrator Issues**: Contact system administrator or IT support
- **User Issues**: Contact your supervisor or department manager
- **Technical Problems**: Email support@company.com with screenshots and detailed description
- **Documentation**: Refer to this guide and the specific administrator/user guides

---

## 7. Conclusion

This guide provides a complete overview of the Auto Shift Scheduler system for both administrators and users. By following the step-by-step procedures and capturing the indicated screenshots, you will be able to effectively use and document the system.

Remember to:
- Refer to the specific administrator or user guide for detailed instructions
- Take screenshots at the indicated points for documentation
- Contact appropriate support channels if you encounter issues
- Keep your credentials secure and change passwords regularly

*Document last updated: May 16, 2026*