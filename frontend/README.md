# HRMS Frontend — Phase 1

Phase 1 provides the React/Vite frontend foundation for an HRMS.

## Included

- Secure-authentication-ready architecture using HttpOnly cookies
- Login / forgot password / reset password screens
- Role-aware navigation
- Dashboard
- Employee management
- Departments
- Designations
- Attendance
- Leave management
- Employee self-service
- Notifications
- Settings
- Dark mode
- Mock data
- Axios service layer
- Responsive UI

## Demo login

Admin:
- Email: `admin@hrms.local`
- Password: `password`

Employee:
- Email: `employee@hrms.local`
- Password: `password`

The demo mode uses a short-lived session marker only to simulate authentication. It does not store JWTs. When the Django backend is connected, replace the mock authentication with the HttpOnly-cookie endpoints.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

Frontend:
`http://localhost:5173`

## Backend API

Set:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

The Axios client uses:

```js
withCredentials: true
```

The production authentication design is:

- JWT access/refresh credentials are set by Django as HttpOnly cookies.
- React does not read JWT values.
- Tokens are not stored in localStorage or sessionStorage.
- Django must enforce authentication and authorization.

## Phase 1 API groups

- `/api/auth/`
- `/api/employees/`
- `/api/departments/`
- `/api/designations/`
- `/api/attendance/`
- `/api/leave/`
- `/api/notifications/`

## Next

Connect the mock services to Django REST Framework one module at a time:
1. Authentication
2. Employees
3. Departments / Designations
4. Attendance
5. Leave
6. Notifications
