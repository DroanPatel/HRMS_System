import logging

from django.db import transaction
from django.utils import timezone
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsHROrAdmin, IsManagerOrHR
from accounts.scope import is_hr, visible_employees
from notifications.services import hr_users, notify
from .models import LeaveRequest, LeaveType
from .serializers import LeaveRequestSerializer, LeaveTypeSerializer, NOT_LINKED
from .services import leave_usage

audit = logging.getLogger("hrms.audit")


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all().order_by("name")
    serializer_class = LeaveTypeSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsAuthenticated()]  # everyone needs the list to apply for leave
        return [IsHROrAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset if is_hr(self.request.user) else queryset.filter(is_active=True)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related("employee", "leave_type", "reviewed_by").all()
    serializer_class = LeaveRequestSerializer
    http_method_names = ["get", "post", "head", "options"]  # lifecycle goes through approve/reject/cancel
    filter_backends = [filters.SearchFilter]
    search_fields = ["employee__first_name", "employee__last_name", "employee__employee_id"]

    def get_permissions(self):
        if self.action in {"list", "approve", "reject"}:
            return [IsManagerOrHR()]
        return [IsAuthenticated()]  # create / retrieve / my / balance / cancel (scoped below)

    def get_queryset(self):
        queryset = super().get_queryset().filter(employee__in=visible_employees(self.request.user))
        params = self.request.query_params
        if params.get("status"):
            queryset = queryset.filter(status=params["status"])
        if params.get("employee"):
            queryset = queryset.filter(employee_id=params["employee"])
        return queryset

    def perform_create(self, serializer):
        leave = serializer.save()
        employee = leave.employee
        manager_user = employee.manager.user if employee.manager_id else None
        recipients = [manager_user] if manager_user else list(hr_users())
        recipients = [user for user in recipients if user.pk != self.request.user.pk]
        notify(
            recipients,
            "New leave request",
            f"{employee.full_name} requested {leave.leave_type.name} from {leave.start_date} to {leave.end_date}.",
        )

    @action(detail=False, methods=["get"])
    def my(self, request):
        employee = getattr(request.user, "employee_profile", None)
        if employee is None:
            raise ValidationError({"detail": NOT_LINKED})
        queryset = self.queryset.filter(employee=employee)
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=False, methods=["get"])
    def balance(self, request):
        employee = getattr(request.user, "employee_profile", None)
        if employee is None:
            raise ValidationError({"detail": NOT_LINKED})
        year = timezone.localdate().year
        data = []
        for leave_type in LeaveType.objects.filter(is_active=True):
            used, pending = leave_usage(employee, leave_type, year)
            total = float(leave_type.annual_days)
            data.append({
                "leave_type": leave_type.id,
                "leave_type_name": leave_type.name,
                "code": leave_type.code,
                "total": total,
                "used": used,
                "pending": pending,
                "remaining": None if total == 0 else total - used - pending,  # None = unlimited
            })
        return Response(data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        leave = self.get_object()
        if leave.employee.user_id != request.user.id:
            raise PermissionDenied("You can only cancel your own leave requests.")
        with transaction.atomic():
            leave = LeaveRequest.objects.select_for_update().get(pk=leave.pk)
            if leave.status != LeaveRequest.Status.PENDING:
                raise ValidationError({"detail": "Only pending requests can be cancelled."})
            leave.status = LeaveRequest.Status.CANCELLED
            leave.save()
        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._review(request, LeaveRequest.Status.APPROVED)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._review(request, LeaveRequest.Status.REJECTED)

    def _review(self, request, new_status):
        leave = self.get_object()  # already limited to requests this user may see
        comment = str(request.data.get("comment", "")).strip()
        if new_status == LeaveRequest.Status.REJECTED and not comment:
            raise ValidationError({"comment": "Please give a reason for rejecting this request."})
        if leave.employee.user_id == request.user.id and not request.user.is_superuser:
            raise PermissionDenied("You cannot review your own leave request.")

        with transaction.atomic():
            leave = LeaveRequest.objects.select_for_update().get(pk=leave.pk)
            if leave.status != LeaveRequest.Status.PENDING:
                raise ValidationError({"detail": f"This request is already {leave.get_status_display().lower()}."})
            leave.status = new_status
            leave.reviewed_by = request.user
            leave.reviewed_at = timezone.now()
            leave.reviewer_comment = comment
            leave.save()

        verdict = "approved" if new_status == LeaveRequest.Status.APPROVED else "rejected"
        audit.info("leave_%s id=%s employee=%s by=%s", verdict, leave.pk, leave.employee.employee_id, request.user.get_username())
        message = f"Your {leave.leave_type.name} request ({leave.start_date} to {leave.end_date}) was {verdict}."
        if comment:
            message += f" Comment: {comment}"
        notify([leave.employee.user], f"Leave {verdict}", message)
        return Response(self.get_serializer(leave).data)
