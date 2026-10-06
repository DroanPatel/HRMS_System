import logging

from django.db import transaction
from django.db.models import Count
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsHROrAdmin, IsManagerOrHR
from accounts.scope import visible_employees
from .models import Attendance
from .serializers import AttendanceSerializer

audit = logging.getLogger("hrms.audit")
NOT_LINKED = "Your account is not linked to an employee record. Ask HR to link it."


def _own_employee(user):
    employee = getattr(user, "employee_profile", None)
    if employee is None:
        raise ValidationError({"detail": NOT_LINKED})
    return employee


def _date_param(request, name):
    value = request.query_params.get(name)
    if not value:
        return None
    try:
        parsed = parse_date(value)
    except ValueError:
        parsed = None
    if parsed is None:
        raise ValidationError({name: "Invalid date. Use YYYY-MM-DD."})
    return parsed


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.select_related("employee", "employee__department").all()
    serializer_class = AttendanceSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["employee__first_name", "employee__last_name", "employee__employee_id"]

    def get_permissions(self):
        if self.action in {"check_in", "check_out", "my", "today"}:
            return [IsAuthenticated()]          # any logged-in user, for their own record
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsHROrAdmin()]              # manual corrections: HR only
        return [IsManagerOrHR()]                # list / retrieve / summary

    def get_queryset(self):
        queryset = super().get_queryset().filter(employee__in=visible_employees(self.request.user))
        params = self.request.query_params
        if (day := _date_param(self.request, "date")):
            queryset = queryset.filter(date=day)
        if (start := _date_param(self.request, "date_from")):
            queryset = queryset.filter(date__gte=start)
        if (end := _date_param(self.request, "date_to")):
            queryset = queryset.filter(date__lte=end)
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("employee"):
            queryset = queryset.filter(employee_id=params["employee"])
        return queryset

    def perform_create(self, serializer):
        record = serializer.save(created_by=self.request.user)
        audit.info("attendance_created id=%s employee=%s by=%s", record.pk, record.employee.employee_id, self.request.user.get_username())

    def perform_update(self, serializer):
        record = serializer.save()
        audit.info("attendance_updated id=%s employee=%s by=%s", record.pk, record.employee.employee_id, self.request.user.get_username())

    def perform_destroy(self, instance):
        audit.info("attendance_deleted id=%s employee=%s by=%s", instance.pk, instance.employee.employee_id, self.request.user.get_username())
        instance.delete()

    @action(detail=False, methods=["get"])
    def my(self, request):
        employee = _own_employee(request.user)
        queryset = Attendance.objects.filter(employee=employee).select_related("employee", "employee__department")
        month = request.query_params.get("month")  # YYYY-MM
        if month:
            try:
                year, mon = (int(part) for part in month.split("-"))
                queryset = queryset.filter(date__year=year, date__month=mon)
            except ValueError:
                raise ValidationError({"month": "Invalid month. Use YYYY-MM."})
        else:
            queryset = queryset[:60]
        return Response(AttendanceSerializer(queryset, many=True).data)

    @action(detail=False, methods=["get"])
    def today(self, request):
        employee = _own_employee(request.user)
        record = Attendance.objects.filter(employee=employee, date=timezone.localdate()).first()
        return Response({"attendance": AttendanceSerializer(record).data if record else None})

    @action(detail=False, methods=["get"])
    def summary(self, request):
        day = _date_param(request, "date") or timezone.localdate()
        employees = visible_employees(request.user).exclude(employment_status="INACTIVE")
        records = Attendance.objects.filter(date=day, employee__in=employees)
        counts = {row["status"]: row["n"] for row in records.values("status").annotate(n=Count("id"))}
        total = employees.count()
        return Response({
            "date": day,
            "total": total,
            "present": counts.get("PRESENT", 0),
            "half_day": counts.get("HALF_DAY", 0),
            "on_leave": counts.get("ON_LEAVE", 0),
            "absent": counts.get("ABSENT", 0),
            "not_marked": total - records.count(),
        })

    @action(detail=False, methods=["post"], url_path="check-in")
    def check_in(self, request):
        employee = _own_employee(request.user)
        with transaction.atomic():
            attendance, _ = Attendance.objects.select_for_update().get_or_create(
                employee=employee, date=timezone.localdate(), defaults={"created_by": request.user}
            )
            if attendance.check_in:
                raise ValidationError({"detail": "Already checked in today."})
            attendance.check_in = timezone.now()
            attendance.status = Attendance.Status.PRESENT
            attendance.save()
        return Response(AttendanceSerializer(attendance).data)

    @action(detail=False, methods=["post"], url_path="check-out")
    def check_out(self, request):
        employee = _own_employee(request.user)
        with transaction.atomic():
            attendance = Attendance.objects.select_for_update().filter(employee=employee, date=timezone.localdate()).first()
            if attendance is None or not attendance.check_in:
                raise ValidationError({"detail": "Check in before checking out."})
            if attendance.check_out:
                raise ValidationError({"detail": "Already checked out today."})
            attendance.check_out = timezone.now()
            attendance.save()
        return Response(AttendanceSerializer(attendance).data)
