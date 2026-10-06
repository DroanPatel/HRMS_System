from rest_framework import serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    employee_id = serializers.SerializerMethodField()
    designation = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "full_name", "role", "phone",
            "is_active", "employee_id", "designation", "department",
        ]
        read_only_fields = fields

    def _employee(self, obj):
        return getattr(obj, "employee_profile", None)

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_employee_id(self, obj):
        employee = self._employee(obj)
        return employee.employee_id if employee else None

    def get_designation(self, obj):
        employee = self._employee(obj)
        return employee.designation.name if employee else None

    def get_department(self, obj):
        employee = self._employee(obj)
        return employee.department.name if employee else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_superuser:  # permissions treat superusers as Super Admin, so the UI must too
            data["role"] = "SUPER_ADMIN"
        return data


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """What a user may change about their own account."""

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone"]

    def validate_phone(self, value):
        from employees.validators import validate_phone_number
        return validate_phone_number(value)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True)
