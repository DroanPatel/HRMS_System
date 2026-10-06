# HRMS Backend Phase 1

Django 5.2 + Django REST Framework + PostgreSQL. Authentication uses Django sessions in an HttpOnly cookie; no JWT is stored in localStorage/sessionStorage.

## Setup
1. Create PostgreSQL database `hrms_db`.
2. Copy `.env.example` to `.env` and set your PostgreSQL password.
3. `python -m venv venv` then activate it.
4. `pip install -r requirements.txt`
5. `python manage.py makemigrations`
6. `python manage.py migrate`
7. `python manage.py createsuperuser`
8. `python manage.py runserver`

## Main endpoints
GET /api/auth/csrf/
POST /api/auth/login/
POST /api/auth/logout/
GET /api/auth/me/
CRUD /api/employees/
CRUD /api/employees/designations/
CRUD /api/departments/
CRUD /api/attendance/
POST /api/attendance/check_in/
POST /api/attendance/check_out/
CRUD /api/leaves/
CRUD /api/leaves/types/
POST /api/leaves/{id}/approve/
POST /api/leaves/{id}/reject/
GET /api/notifications/
POST /api/notifications/{id}/read/
