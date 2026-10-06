from django.conf import settings


def client_ip(request):
    """Best-effort client IP for log lines (only trusts X-Forwarded-For behind a configured proxy)."""
    if getattr(settings, "BEHIND_PROXY", False):
        forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")
