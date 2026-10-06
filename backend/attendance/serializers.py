from rest_framework import serializers
from .models import Attendance


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source="employee.full_name", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_id", read_only=True)
    department_name = serializers.CharField(source="employee.department.name", read_only=True)
    worked_seconds = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = [
            "id", "employee", "employee_name", "employee_code", "department_name", "date",
            "check_in", "check_out", "worked_seconds", "status", "notes", "created_by",
        ]
        read_only_fields = ["id", "created_by"]

    def get_worked_seconds(self, obj):
        if obj.check_in and obj.check_out:
            return max(0, int((obj.check_out - obj.check_in).total_seconds()))
        return None

    def validate(self, attrs):
        check_in = attrs.get("check_in", getattr(self.instance, "check_in", None))
        check_out = attrs.get("check_out", getattr(self.instance, "check_out", None))
        if check_in and check_out and check_out < check_in:
            raise serializers.ValidationError({"check_out": "Check-out cannot be before check-in."})
        return attrs
