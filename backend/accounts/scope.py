from django.db.models import Q


def is_hr(user):
    return bool(user and user.is_authenticated and (user.is_superuser or user.role in {"SUPER_ADMIN", "HR_ADMIN"}))


def visible_employees(user):
    """HR sees everyone, a manager sees themselves + direct reports, everyone else sees themselves."""
    from employees.models import Employee 

    if is_hr(user):
        return Employee.objects.all()
    profile = getattr(user, "employee_profile", None)
    if profile is None:
        return Employee.objects.none()
    if user.role == "MANAGER":
        return Employee.objects.filter(Q(pk=profile.pk) | Q(manager=profile))
    return Employee.objects.filter(pk=profile.pk)
