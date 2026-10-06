from rest_framework import serializers
from .models import LeaveRequest, LeaveType
from .services import leave_usage

NOT_LINKED = "Your account is not linked to an employee record. Ask HR to link it."


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "name", "code", "annual_days", "is_active"]


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_id", read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)
    total_days = serializers.ReadOnlyField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            "id", "employee", "employee_name", "employee_code", "leave_type", "leave_type_name",
            "start_date", "end_date", "total_days", "reason", "status", "reviewed_by",
            "reviewed_by_name", "reviewed_at", "reviewer_comment", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "employee", "status", "reviewed_by", "reviewed_at", "reviewer_comment",
            "created_at", "updated_at",
        ]

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return None
        return obj.reviewed_by.get_full_name() or obj.reviewed_by.username

    def validate(self, attrs):
        employee = getattr(self.context["request"].user, "employee_profile", None)
        if employee is None:
            raise serializers.ValidationError({"detail": NOT_LINKED})

        leave_type, start, end = attrs["leave_type"], attrs["start_date"], attrs["end_date"]
        if not leave_type.is_active:
            raise serializers.ValidationError({"leave_type": "This leave type is not available."})
        if end < start:
            raise serializers.ValidationError({"end_date": "End date cannot be before start date."})

        overlaps = LeaveRequest.objects.filter(
            employee=employee,
            status__in=[LeaveRequest.Status.PENDING, LeaveRequest.Status.APPROVED],
            start_date__lte=end,
            end_date__gte=start,
        ).exists()
        if overlaps:
            raise serializers.ValidationError({"start_date": "You already have a pending or approved leave in this period."})

        # annual_days == 0 means "no limit" (e.g. unpaid leave)
        if leave_type.annual_days > 0:
            used, pending = leave_usage(employee, leave_type, start.year)
            remaining = leave_type.annual_days - used - pending
            requested = (end - start).days + 1
            if requested > remaining:
                raise serializers.ValidationError({"leave_type": f"Not enough balance. {remaining:g} day(s) remaining."})

        attrs["employee"] = employee
        return attrs
