from datetime import date, timedelta

from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.scope import is_hr, visible_employees
from attendance.models import Attendance
from leave_management.models import LeaveRequest, LeaveType
from leave_management.services import leave_usage
from notifications.models import Notification

PRESENT_STATES = {Attendance.Status.PRESENT, Attendance.Status.HALF_DAY}


def _next_birthday(born, today):
    for year in (today.year, today.year + 1):
        try:
            candidate = date(year, born.month, born.day)
        except ValueError:  # 29 February in a non-leap year
            candidate = date(year, 2, 28)
        if candidate >= today:
            return candidate
    return None


def _leave_employee_ids(scope, day):
    return set(
        LeaveRequest.objects.filter(
            employee__in=scope, status=LeaveRequest.Status.APPROVED, start_date__lte=day, end_date__gte=day
        ).values_list("employee_id", flat=True)
    )


def _team_dashboard(user, today):
    """HR sees the whole company; a manager sees themselves and their direct reports."""
    scope = visible_employees(user).exclude(employment_status="INACTIVE")
    scope_ids = set(scope.values_list("pk", flat=True))
    total = len(scope_ids)

    records = {
        row["employee_id"]: row["status"]
        for row in Attendance.objects.filter(date=today, employee__in=scope).values("employee_id", "status")
    }
    on_leave = _leave_employee_ids(scope, today) | {e for e, s in records.items() if s == Attendance.Status.ON_LEAVE}
    present = sum(1 for e, s in records.items() if s in PRESENT_STATES and e not in on_leave)
    absent = sum(1 for e, s in records.items() if s == Attendance.Status.ABSENT and e not in on_leave)
    not_marked = total - len((set(records) | on_leave) & scope_ids)

    pending = LeaveRequest.objects.filter(employee__in=scope, status=LeaveRequest.Status.PENDING)
    if not user.is_superuser:
        pending = pending.exclude(employee__user=user)  # you can't review your own requests

    days = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    counts = {}
    for row in Attendance.objects.filter(date__in=days, employee__in=scope).values("date", "status").annotate(n=Count("id")):
        counts[(row["date"], row["status"])] = row["n"]
    trend = []
    for day in days:
        trend.append({
            "day": day.strftime("%a"),
            "date": day.isoformat(),
            "present": counts.get((day, Attendance.Status.PRESENT), 0) + counts.get((day, Attendance.Status.HALF_DAY), 0),
            "absent": counts.get((day, Attendance.Status.ABSENT), 0),
            "leave": len(_leave_employee_ids(scope, day)),
        })

    birthdays = []
    for emp in scope.exclude(date_of_birth=None).values("first_name", "last_name", "date_of_birth"):
        upcoming = _next_birthday(emp["date_of_birth"], today)
        if upcoming and (upcoming - today).days <= 30:
            birthdays.append({
                "name": f"{emp['first_name']} {emp['last_name']}".strip(),
                "date": upcoming.isoformat(),
                "days_until": (upcoming - today).days,
            })
    birthdays.sort(key=lambda item: (item["days_until"], item["name"]))

    return {
        "view": "hr" if is_hr(user) else "manager",
        "cards": {
            "total_employees": total,
            "present_today": present,
            "on_leave_today": len(on_leave & scope_ids),
            "absent_today": absent,
            "not_marked_today": not_marked,
            "pending_requests": pending.count(),
            "new_joiners_this_month": scope.filter(date_of_joining__year=today.year, date_of_joining__month=today.month).count(),
            "departments": scope.values("department").distinct().count(),
        },
        "department_headcount": [
            {"name": row["department__name"], "employees": row["n"]}
            for row in scope.values("department__name").annotate(n=Count("id")).order_by("-n", "department__name")
        ],
        "attendance_trend": trend,
        "leave_distribution": [
            {"name": row["leave_type__name"], "value": row["n"]}
            for row in LeaveRequest.objects.filter(
                employee__in=scope, status__in=[LeaveRequest.Status.APPROVED, LeaveRequest.Status.PENDING],
                start_date__year=today.year,
            ).values("leave_type__name").annotate(n=Count("id")).order_by("-n")
        ],
        "pending_requests": [
            {
                "id": leave.pk, "employee_name": leave.employee.full_name, "leave_type_name": leave.leave_type.name,
                "total_days": leave.total_days, "start_date": leave.start_date.isoformat(),
            }
            for leave in pending.select_related("employee", "leave_type").order_by("created_at")[:5]
        ],
        "upcoming_birthdays": birthdays[:5],
    }


def _employee_dashboard(user, today):
    employee = getattr(user, "employee_profile", None)
    unread = Notification.objects.filter(user=user, is_read=False).count()
    if employee is None:
        return {"view": "employee", "linked": False, "cards": {"unread_notifications": unread}, "leave_balances": []}

    record = Attendance.objects.filter(employee=employee, date=today).first()
    if record is None or not record.check_in:
        state = "NOT_CHECKED_IN"
    elif record.check_out:
        state = "CHECKED_OUT"
    else:
        state = "CHECKED_IN"

    balances = []
    for leave_type in LeaveType.objects.filter(is_active=True):
        used, pending = leave_usage(employee, leave_type, today.year)
        total = float(leave_type.annual_days)
        balances.append({
            "leave_type_name": leave_type.name, "total": total, "used": used, "pending": pending,
            "remaining": None if total == 0 else total - used - pending,
        })

    next_leave = LeaveRequest.objects.filter(
        employee=employee, status=LeaveRequest.Status.APPROVED, end_date__gte=today
    ).select_related("leave_type").order_by("start_date").first()

    return {
        "view": "employee",
        "linked": True,
        "cards": {
            "attendance_state": state,
            "check_in": record.check_in.isoformat() if record and record.check_in else None,
            "check_out": record.check_out.isoformat() if record and record.check_out else None,
            "days_present_this_month": Attendance.objects.filter(
                employee=employee, date__year=today.year, date__month=today.month,
                status__in=list(PRESENT_STATES),
            ).count(),
            "pending_requests": LeaveRequest.objects.filter(employee=employee, status=LeaveRequest.Status.PENDING).count(),
            "unread_notifications": unread,
        },
        "leave_balances": balances,
        "next_leave": {
            "leave_type_name": next_leave.leave_type.name,
            "start_date": next_leave.start_date.isoformat(),
            "end_date": next_leave.end_date.isoformat(),
        } if next_leave else None,
    }


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    today = timezone.localdate()
    user = request.user
    if is_hr(user) or user.role == "MANAGER":
        payload = _team_dashboard(user, today)
    else:
        payload = _employee_dashboard(user, today)
    payload["date"] = today.isoformat()
    return Response(payload)
