from django.contrib.auth import get_user_model
from django.contrib.auth.validators import UnicodeUsernameValidator
from rest_framework import serializers

from accounts.scope import is_hr
from .models import Designation, Employee
from .validators import validate_birth_date, validate_employee_code, validate_phone_number

User = get_user_model()


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ["id", "name", "description", "is_active"]


class EmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    department_name = serializers.CharField(source="department.name", read_only=True)
    designation_name = serializers.CharField(source="designation.name", read_only=True)
    manager_name = serializers.CharField(source="manager.full_name", read_only=True, default=None)
    has_account = serializers.SerializerMethodField()
    account_username = serializers.SerializerMethodField()
    account_role = serializers.SerializerMethodField()
    account_active = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id", "employee_id", "first_name", "last_name", "full_name", "email", "phone",
            "date_of_birth", "date_of_joining", "department", "department_name",
            "designation", "designation_name", "manager", "manager_name", "employment_status",
            "address", "emergency_contact_name", "emergency_contact_phone",
            "has_account", "account_username", "account_role", "account_active",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    # --- login-account info is only shown to HR ---
    def _account(self, obj, field):
        request = self.context.get("request")
        if not obj.user_id or not (request and is_hr(request.user)):
            return None
        return field(obj.user)

    def get_has_account(self, obj):
        return bool(obj.user_id)

    def get_account_username(self, obj):
        return self._account(obj, lambda u: u.username)

    def get_account_role(self, obj):
        return self._account(obj, lambda u: u.role)

    def get_account_active(self, obj):
        return self._account(obj, lambda u: u.is_active)

    # --- field validation ---
    def validate_employee_id(self, value):
        value = validate_employee_code(value)
        queryset = Employee.objects.filter(employee_id__iexact=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()

    def validate_phone(self, value):
        return validate_phone_number(value)

    def validate_emergency_contact_phone(self, value):
        return validate_phone_number(value)

    def validate_date_of_birth(self, value):
        return validate_birth_date(value)

    def validate_manager(self, value):
        if value and self.instance and value.pk == self.instance.pk:
            raise serializers.ValidationError("An employee cannot be their own manager.")
        return value


class CreateAccountSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False, validators=[UnicodeUsernameValidator()])
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.Roles.choices, required=False, default=User.Roles.EMPLOYEE)


class UpdateAccountSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Roles.choices, required=False)
    is_active = serializers.BooleanField(required=False)
    password = serializers.CharField(write_only=True, required=False)
