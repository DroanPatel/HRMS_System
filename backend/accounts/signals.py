import logging

from django.contrib.auth.signals import user_logged_in, user_logged_out
from django.dispatch import receiver

from .utils import client_ip

security_log = logging.getLogger("hrms.security")


@receiver(user_logged_in)
def log_login(sender, request, user, **kwargs):
    security_log.info("login_success user=%s ip=%s", user.get_username(), client_ip(request) if request else "-")


@receiver(user_logged_out)
def log_logout(sender, request, user, **kwargs):
    if user:
        security_log.info("logout user=%s ip=%s", user.get_username(), client_ip(request) if request else "-")
