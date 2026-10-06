import logging

from django.conf import settings
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User
from .serializers import (
    ChangePasswordSerializer, ForgotPasswordSerializer, LoginSerializer, ProfileUpdateSerializer,
    ResetPasswordSerializer, UserSerializer,
)
from .throttles import LoginRateThrottle, PasswordResetRateThrottle
from .utils import client_ip

security_log = logging.getLogger("hrms.security")


def _password_errors(password, user):
    try:
        validate_password(password, user)
    except DjangoValidationError as exc:
        raise ValidationError({"password": list(exc.messages)})


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    return Response({"detail": "CSRF cookie set."})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    identifier = serializer.validated_data["username"]
    password = serializer.validated_data["password"]

    user = None
    if "@" in identifier:
        found = User.objects.filter(email__iexact=identifier).first()
        if found:
            user = authenticate(request, username=found.username, password=password)
    else:
        user = authenticate(request, username=identifier, password=password)

    if user is None:
        security_log.warning("login_failed identifier=%s ip=%s", identifier[:150], client_ip(request))
        return Response({"detail": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)
    login(request, user)
    return Response({"user": UserSerializer(user).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response({"detail": "Logged out successfully."})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == "PATCH":
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
    return Response({"user": UserSerializer(request.user).data})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user
    if not user.check_password(serializer.validated_data["current_password"]):
        raise ValidationError({"current_password": "Current password is incorrect."})
    try:
        validate_password(serializer.validated_data["new_password"], user)
    except DjangoValidationError as exc:
        raise ValidationError({"new_password": list(exc.messages)})
    user.set_password(serializer.validated_data["new_password"])
    user.save(update_fields=["password"])
    update_session_auth_hash(request, user)  # keep this session logged in; other sessions are signed out
    security_log.info("password_changed user=%s ip=%s", user.get_username(), client_ip(request))
    return Response({"detail": "Password changed successfully."})


GENERIC_RESET_MESSAGE = "If an account exists for that email, a reset link has been sent."


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    user = User.objects.filter(email__iexact=email, is_active=True).first()
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?uid={uid}&token={token}"
        try:
            send_mail(
                "Reset your HRMS password",
                f"Hello {user.get_full_name() or user.username},\n\n"
                f"Use this link to choose a new password (valid for 1 hour):\n{link}\n\n"
                "If you did not request this, you can ignore this email.",
                settings.DEFAULT_FROM_EMAIL, [user.email],
            )
            security_log.info("password_reset_requested user=%s ip=%s", user.get_username(), client_ip(request))
        except Exception:
            security_log.exception("password_reset_email_failed user=%s", user.get_username())
    # Same answer whether or not the account exists, so this can't be used to discover emails.
    return Response({"message": GENERIC_RESET_MESSAGE})


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([PasswordResetRateThrottle])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    invalid = ValidationError({"detail": "This reset link is invalid or has expired."})
    try:
        user = User.objects.get(pk=urlsafe_base64_decode(data["uid"]).decode(), is_active=True)
    except (User.DoesNotExist, ValueError, TypeError, OverflowError, UnicodeDecodeError):
        raise invalid
    if not default_token_generator.check_token(user, data["token"]):
        raise invalid
    _password_errors(data["password"], user)
    user.set_password(data["password"])
    user.save(update_fields=["password"])
    security_log.info("password_reset_completed user=%s ip=%s", user.get_username(), client_ip(request))
    return Response({"detail": "Password reset successfully."})
