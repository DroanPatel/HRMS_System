"""Ten HRMS API tests: five positive and five negative scenarios.

Run from backend/: python manage.py test tests.test_hrms --verbosity 2
Django uses an isolated test database; production data is not modified.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from attendance.models import Attendance
from departments.models import Department
from employees.models import Designation, Employee
from leave_management.models import LeaveRequest, LeaveType


User = get_user_model()


class HRMSCoreTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.password = "TestPassword!2026"
        cls.admin = User.objects.create_superuser(
            username="testadmin", email="testadmin@example.com", password=cls.password
        )
        cls.manager = User.objects.create_user(
            username="testmanager", email="testmanager@example.com",
            password=cls.password, role=User.Roles.MANAGER,
        )
        cls.other_manager = User.objects.create_user(
            username="othermanager", email="othermanager@example.com",
            password=cls.password, role=User.Roles.MANAGER,
        )
        cls.employee_user = User.objects.create_user(
            username="testemployee", email="testemployee@example.com",
            password=cls.password, role=User.Roles.EMPLOYEE,
        )
        cls.department = Department.objects.create(name="Engineering", code="ENG")
        cls.designation = Designation.objects.create(name="Developer")
        join_date = timezone.localdate() - timedelta(days=60)

        def employee(code, user, manager=None):
            return Employee.objects.create(
                user=user, employee_id=code,
                first_name=user.username, last_name="Tester",
                email=user.email, date_of_joining=join_date,
                department=cls.department, designation=cls.designation,
                manager=manager,
            )

        cls.manager_profile = employee("T-MGR", cls.manager)
        cls.other_manager_profile = employee("T-OTHER", cls.other_manager)
        cls.employee_profile = employee(
            "T-EMP", cls.employee_user, manager=cls.manager_profile
        )
        cls.leave_type = LeaveType.objects.create(
            name="Annual Leave", code="ANNUAL", annual_days=30
        )

    def setUp(self):
        self.client = APIClient()

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    def leave_payload(self, start=None, end=None):
        start = start or (timezone.localdate() + timedelta(days=10))
        end = end or (start + timedelta(days=1))
        return {
            "leave_type": self.leave_type.pk,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "reason": "Planned personal leave",
        }

    def test_01_valid_login_succeeds(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.employee_user.username, "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["id"], self.employee_user.pk)

    def test_02_invalid_password_is_rejected(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": self.employee_user.username, "password": "WrongPassword!"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_03_superuser_creates_employee_and_login(self):
        self.authenticate(self.admin)
        response = self.client.post(
            "/api/employees/",
            {
                "employee_id": "T-NEW",
                "first_name": "New",
                "last_name": "Employee",
                "email": "newemployee@example.com",
                "date_of_joining": timezone.localdate().isoformat(),
                "department": self.department.pk,
                "designation": self.designation.pk,
                "login": {
                    "username": "newemployee",
                    "password": "StrongNewPassword!2026",
                    "role": User.Roles.EMPLOYEE,
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        created = Employee.objects.get(employee_id="T-NEW")
        self.assertIsNotNone(created.user)
        self.assertTrue(created.user.check_password("StrongNewPassword!2026"))

    def test_04_employee_cannot_create_employee(self):
        self.authenticate(self.employee_user)
        response = self.client.post(
            "/api/employees/",
            {
                "employee_id": "T-BLOCKED",
                "first_name": "Blocked",
                "last_name": "User",
                "email": "blocked@example.com",
                "date_of_joining": timezone.localdate().isoformat(),
                "department": self.department.pk,
                "designation": self.designation.pk,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Employee.objects.filter(employee_id="T-BLOCKED").exists())

    def test_05_employee_submits_valid_leave(self):
        self.authenticate(self.employee_user)
        response = self.client.post(
            "/api/leaves/", self.leave_payload(), format="json"
        )
        self.assertEqual(response.status_code, 201, response.data)
        leave = LeaveRequest.objects.get(pk=response.data["id"])
        self.assertEqual(leave.employee_id, self.employee_profile.pk)
        self.assertEqual(leave.status, LeaveRequest.Status.PENDING)

    def test_06_overlapping_leave_is_rejected(self):
        start = timezone.localdate() + timedelta(days=10)
        LeaveRequest.objects.create(
            employee=self.employee_profile, leave_type=self.leave_type,
            start_date=start, end_date=start + timedelta(days=2),
            reason="Existing leave",
        )
        self.authenticate(self.employee_user)
        response = self.client.post(
            "/api/leaves/",
            self.leave_payload(start + timedelta(days=1), start + timedelta(days=3)),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            LeaveRequest.objects.filter(employee=self.employee_profile).count(), 1
        )

    def test_07_assigned_manager_approves_leave(self):
        leave = LeaveRequest.objects.create(
            employee=self.employee_profile, leave_type=self.leave_type,
            start_date=timezone.localdate() + timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=11),
            reason="Family event",
        )
        self.authenticate(self.manager)
        response = self.client.post(
            f"/api/leaves/{leave.pk}/approve/", {}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.data)
        leave.refresh_from_db()
        self.assertEqual(leave.status, LeaveRequest.Status.APPROVED)
        self.assertEqual(leave.reviewed_by_id, self.manager.pk)

    def test_08_other_manager_cannot_approve_leave(self):
        leave = LeaveRequest.objects.create(
            employee=self.employee_profile, leave_type=self.leave_type,
            start_date=timezone.localdate() + timedelta(days=10),
            end_date=timezone.localdate() + timedelta(days=11),
            reason="Family event",
        )
        self.authenticate(self.other_manager)
        response = self.client.post(
            f"/api/leaves/{leave.pk}/approve/", {}, format="json"
        )
        self.assertEqual(response.status_code, 404)
        leave.refresh_from_db()
        self.assertEqual(leave.status, LeaveRequest.Status.PENDING)

    def test_09_employee_checks_in(self):
        self.authenticate(self.employee_user)
        response = self.client.post(
            "/api/attendance/check-in/", {}, format="json"
        )
        self.assertEqual(response.status_code, 200, response.data)
        record = Attendance.objects.get(
            employee=self.employee_profile, date=timezone.localdate()
        )
        self.assertIsNotNone(record.check_in)

    def test_10_duplicate_check_in_is_rejected(self):
        self.authenticate(self.employee_user)
        first = self.client.post("/api/attendance/check-in/", {}, format="json")
        second = self.client.post("/api/attendance/check-in/", {}, format="json")
        self.assertEqual(first.status_code, 200, first.data)
        self.assertEqual(second.status_code, 400)
        self.assertEqual(
            Attendance.objects.filter(
                employee=self.employee_profile, date=timezone.localdate()
            ).count(), 1
        )
