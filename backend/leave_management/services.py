from datetime import date
from .models import LeaveRequest


def _days_in_year(leave, year):
    start = max(leave.start_date, date(year, 1, 1))
    end = min(leave.end_date, date(year, 12, 31))
    return max(0, (end - start).days + 1)


def leave_usage(employee, leave_type, year):
    """(approved_days, pending_days) for one leave type in one calendar year."""
    requests = LeaveRequest.objects.filter(
        employee=employee,
        leave_type=leave_type,
        status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED],
        start_date__lte=date(year, 12, 31),
        end_date__gte=date(year, 1, 1),
    )
    used = pending = 0
    for leave in requests:
        days = _days_in_year(leave, year)
        if leave.status == LeaveRequest.Status.APPROVED:
            used += days
        else:
            pending += days
    return used, pending
