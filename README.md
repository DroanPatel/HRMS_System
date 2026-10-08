# HRMS - Human Resource Management System

A full-stack Human Resource Management System (HRMS) built with **Django REST Framework, PostgreSQL, React.js, and modern web technologies**.

The system provides employee management, role-based access control, attendance tracking, leave management, notifications, dashboards, authentication, and administrative functionality.

---

## 📌 Project Overview

The HRMS is designed to simplify and centralize common Human Resources operations within an organization.

The application supports multiple user roles with different levels of access:

- **Super Admin**
- **HR Admin**
- **Manager**
- **Employee**

The system uses a **Django REST Framework backend** with **PostgreSQL** and a **React.js frontend**.

Authentication is implemented using **Django Session Authentication with HttpOnly cookies**, rather than storing authentication tokens in browser Local Storage or Session Storage.

---

# 🏗️ Technology Stack

## Frontend

- React.js
- Vite
- JavaScript / JSX
- HTML5
- CSS3
- React Router
- Axios
- Lucide React Icons

## Backend

- Python
- Django
- Django REST Framework
- Django Session Authentication
- django-cors-headers
- python-dotenv

## Database

- PostgreSQL

## Development Tools

- Visual Studio Code
- Git / GitHub
- Postman
- Chrome Developer Tools

---

# ✨ Features

## 🔐 Authentication & Authorization

- User login and logout
- Session-based authentication
- HttpOnly session cookie
- CSRF protection
- Role-based access control
- Protected routes
- Current-user authentication
- Password change
- Forgot password / reset password functionality
- Login throttling
- Password reset throttling
- Security/audit logging

---

# 👥 User Roles

The system supports four primary roles.

| Role | Description |
|------|-------------|
| Super Admin | Full system access |
| HR Admin | HR and employee management |
| Manager | Manages assigned employees and their workflows |
| Employee | Accesses personal information, attendance and leave |

---

# 👨‍💼 Employee Management

Administrators can manage employee information including:

- Employee ID
- First Name
- Last Name
- Email
- Phone
- Department
- Designation
- Manager
- Joining Date
- Employment Status
- Emergency Contact
- Employee Account
- Username
- Password
- Role

Administrators can:

- Create employees
- Update employees
- View employees
- Activate/deactivate employees
- Manage employee login accounts
- Assign managers
- Assign departments
- Assign designations

---

# 🏢 Department Management

The system provides department management functionality.

Administrators can:

- Create departments
- View departments
- Edit departments
- Activate/deactivate departments
- Assign employees to departments

Each department can have:

- Department Name
- Department Code
- Description
- Active/Inactive status

---

# 💼 Designation Management

Administrators can manage employee designations.

Examples:

- Software Engineer
- Senior Software Engineer
- HR Manager
- Data Analyst
- Project Manager

Features include:

- Create designation
- Edit designation
- View designation
- Assign designation to employees

---

# 🕒 Attendance Management

Employees can manage their daily attendance.

Features include:

- Check In
- Check Out
- Today's attendance
- Attendance history
- Attendance summary
- Working time calculation
- Attendance status
- Employee attendance tracking

The backend also uses database-level constraints to prevent invalid attendance records.

For example:

- Duplicate attendance for the same employee/date is prevented.
- Check-out cannot occur before check-in.

---

# 🏖️ Leave Management

The HRMS provides a complete leave management workflow.

Employees can:

- View leave types
- Apply for leave
- View their leave history
- View leave balance
- Cancel pending leave

Managers/HR can:

- View leave requests
- Approve leave
- Reject leave
- Add rejection/review comments

Supported leave statuses:

```text
PENDING
APPROVED
REJECTED
CANCELLED