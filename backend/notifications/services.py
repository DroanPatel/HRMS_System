from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Notification


def notify(users, title, message):
    """Create one notification per distinct user (None entries are skipped)."""
    seen, items = set(), []
    for user in users:
        if user is None or user.pk in seen:
            continue
        seen.add(user.pk)
        items.append(Notification(user=user, title=title, message=message))
    Notification.objects.bulk_create(items)


def hr_users():
    User = get_user_model()
    return User.objects.filter(is_active=True).filter(Q(is_superuser=True) | Q(role__in=["SUPER_ADMIN", "HR_ADMIN"]))
