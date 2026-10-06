from rest_framework.throttling import AnonRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    """Limits login attempts per IP address (rate: REST_FRAMEWORK['DEFAULT_THROTTLE_RATES']['login'])."""
    scope = "login"


class PasswordResetRateThrottle(AnonRateThrottle):
    scope = "password_reset"
