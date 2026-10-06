import re
from datetime import date

from rest_framework import serializers

PHONE_RE = re.compile(r"^[0-9+()\-\s.]{7,20}$")
EMPLOYEE_CODE_RE = re.compile(r"^[A-Za-z0-9-]{2,20}$")


def validate_phone_number(value):
    value = (value or "").strip()
    if value and not PHONE_RE.match(value):
        raise serializers.ValidationError("Enter a valid phone number (digits, spaces and + ( ) - . only).")
    return value


def validate_employee_code(value):
    value = (value or "").strip()
    if not EMPLOYEE_CODE_RE.match(value):
        raise serializers.ValidationError("Use 2-20 letters, numbers or hyphens (for example EMP001).")
    return value.upper()


def validate_birth_date(value):
    if value is None:
        return value
    today = date.today()
    age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
    if value >= today:
        raise serializers.ValidationError("Date of birth must be in the past.")
    if age < 16:
        raise serializers.ValidationError("Employee must be at least 16 years old.")
    if age > 100:
        raise serializers.ValidationError("Please check the date of birth.")
    return value
