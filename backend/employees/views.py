import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from accounts.permissions import IsHROrAdmin, IsManagerOrHR
from accounts.scope import is_hr, visible_employees
from .models import Designation, Employee
from .serializers import (
    CreateAccountSerializer, DesignationSerializer, EmployeeSerializer, UpdateAccountSerializer,
)

User = get_user_model()
audit = logging.getLogger("hrms.audit")


def _is_super(user):
    return user.is_superuser or user.role == User.Roles.SUPER_ADMIN


def _assignable_roles(actor):
    """HR Admins may create Employee/Manager logins; only Super Admins may create HR/Super Admin logins."""
    if _is_super(actor):
        return {choice for choice, _ in User.Roles.choices}
    return {User.Roles.EMPLOYEE, User.Roles.MANAGER}


def _check_password(password, user, key="password"):
    try:
        validate_password(password, user)
    except DjangoValidationError as exc:
        raise ValidationError({key: list(exc.messages)})


def _prepare_user(actor, info, payload, prefix=""):
    """
    Validate a "create a login" request and return an UNSAVED user with the password already set.
    `info` holds the employee's employee_id, first_name, last_name, email and phone.
    `prefix` is added to error keys ("login_" when the login is part of the employee form).
    """
    serializer = CreateAccountSerializer(data=payload)
    if not serializer.is_valid():
        raise ValidationError({prefix + key: value for key, value in serializer.errors.items()})
    data = serializer.validated_data

    role = data["role"]
    if role not in _assignable_roles(actor):
        raise PermissionDenied("You are not allowed to assign this role.")
    username = data.get("username") or info["employee_id"].lower()
    if User.objects.filter(username__iexact=username).exists():
        raise ValidationError({prefix + "username": "This username is already taken."})
    if User.objects.filter(email__iexact=info["email"]).exists():
        message = "A login account already uses this email address."
        raise ValidationError({("email" if prefix else "detail"): message})

    user = User(
        username=username, email=info["email"], first_name=info["first_name"],
        last_name=info["last_name"], phone=info.get("phone", ""), role=role,
    )
    _check_password(data["password"], user, prefix + "password")
    user.set_password(data["password"])
    return user


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("department", "designation", "manager", "user").all()
    serializer_class = EmployeeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["employee_id", "first_name", "last_name", "email", "department__name", "designation__name"]
    ordering_fields = ["first_name", "last_name", "date_of_joining", "employee_id"]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsManagerOrHR()]   # managers can view their own team (read-only)
        return [IsHROrAdmin()]         # create / edit / delete / login accounts

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if not is_hr(user):
            queryset = queryset.filter(pk__in=visible_employees(user).values("pk"))
        params = self.request.query_params
        if params.get("department"):
            queryset = queryset.filter(department_id=params["department"])
        if params.get("employment_status"):
            queryset = queryset.filter(employment_status=params["employment_status"])
        return queryset

    def create(self, request, *args, **kwargs):
        """Create an employee. If the body has a "login" block ({password, role, username?}) the
        sign-in account is created in the same step: both are saved, or neither is."""
        login = request.data.get("login")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not login:
            self.perform_create(serializer)
            return Response(serializer.data, status=201)

        info = {key: serializer.validated_data.get(key, "") for key in ("employee_id", "first_name", "last_name", "email", "phone")}
        user = _prepare_user(request.user, info, login, prefix="login_")
        with transaction.atomic():
            employee = serializer.save()
            user.save()
            employee.user = user
            employee.save(update_fields=["user", "updated_at"])
        audit.info("employee_created id=%s code=%s by=%s", employee.pk, employee.employee_id, request.user.get_username())
        audit.info("account_created employee=%s user=%s role=%s by=%s", employee.employee_id, user.username, user.role, request.user.get_username())
        return Response(self.get_serializer(employee).data, status=201)

    def perform_create(self, serializer):
        employee = serializer.save()
        audit.info("employee_created id=%s code=%s by=%s", employee.pk, employee.employee_id, self.request.user.get_username())

    def perform_update(self, serializer):
        employee = serializer.save()
        audit.info("employee_updated id=%s code=%s by=%s", employee.pk, employee.employee_id, self.request.user.get_username())

    def perform_destroy(self, instance):
        audit.info("employee_deleted id=%s code=%s by=%s", instance.pk, instance.employee_id, self.request.user.get_username())
        instance.delete()

    # ---- login accounts -------------------------------------------------
    @action(detail=True, methods=["post"], url_path="create-account")
    def create_account(self, request, pk=None):
        employee = self.get_object()
        if employee.user_id:
            raise ValidationError({"detail": "This employee already has a login account."})
        info = {
            "employee_id": employee.employee_id, "first_name": employee.first_name, "last_name": employee.last_name,
            "email": employee.email, "phone": employee.phone,
        }
        user = _prepare_user(request.user, info, request.data)
        with transaction.atomic():
            user.save()
            employee.user = user
            employee.save(update_fields=["user", "updated_at"])
        audit.info("account_created employee=%s user=%s role=%s by=%s", employee.employee_id, user.username, user.role, request.user.get_username())
        return Response(self.get_serializer(employee).data, status=201)

    @action(detail=True, methods=["post"], url_path="update-account")
    def update_account(self, request, pk=None):
        employee = self.get_object()
        target = employee.user
        if target is None:
            raise ValidationError({"detail": "This employee has no login account yet."})
        if not _is_super(request.user) and (target.is_superuser or target.role not in _assignable_roles(request.user)):
            raise PermissionDenied("You are not allowed to change this account.")

        serializer = UpdateAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        own_account = target.pk == request.user.pk

        if "role" in data:
            if own_account:
                raise ValidationError({"role": "You cannot change your own role."})
            if data["role"] not in _assignable_roles(request.user):
                raise PermissionDenied("You are not allowed to assign this role.")
            target.role = data["role"]
        if "is_active" in data:
            if own_account and not data["is_active"]:
                raise ValidationError({"is_active": "You cannot deactivate your own account."})
            target.is_active = data["is_active"]
        if "password" in data:
            _check_password(data["password"], target)
            target.set_password(data["password"])
        target.save()
        audit.info("account_updated employee=%s user=%s fields=%s by=%s", employee.employee_id, target.get_username(), sorted(data.keys()), request.user.get_username())
        return Response(self.get_serializer(employee).data)


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsManagerOrHR()]
        return [IsHROrAdmin()]
