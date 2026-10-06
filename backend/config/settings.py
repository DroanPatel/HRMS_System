"""
HRMS Django settings.

Everything that changes between your laptop and a live server is read from
environment variables (backend/.env locally). See backend/.env.example.
"""
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_bool(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def env_list(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


# --------------------------------------------------------------------------
# Core
# --------------------------------------------------------------------------
DEBUG = env_bool("DJANGO_DEBUG", True)  # fine for local development. Set DJANGO_DEBUG=False on a real server.

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "")
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "dev-only-insecure-key-do-not-use-in-production"
    else:
        raise ImproperlyConfigured(
            "DJANGO_SECRET_KEY is not set. Set it in the environment, or set DJANGO_DEBUG=True for local development."
        )

ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "corsheaders", "rest_framework", "accounts", "employees", "departments",
    "attendance", "leave_management", "notifications", "dashboard",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

# --------------------------------------------------------------------------
# Database (PostgreSQL)
# --------------------------------------------------------------------------
DATABASES = {"default": {
    "ENGINE": "django.db.backends.postgresql",
    "NAME": os.getenv("POSTGRES_DB", "hrms_db"),
    "USER": os.getenv("POSTGRES_USER", "postgres"),
    "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
    "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
    "PORT": os.getenv("POSTGRES_PORT", "5432"),
    "CONN_MAX_AGE": int(os.getenv("POSTGRES_CONN_MAX_AGE", "60")),
    "OPTIONS": {"sslmode": os.getenv("POSTGRES_SSLMODE", "prefer")},
}}

# --------------------------------------------------------------------------
# Passwords, i18n, static files
# --------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 10}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
PASSWORD_RESET_TIMEOUT = 60 * 60  # password reset links expire after 1 hour

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "America/New_York")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
AUTH_USER_MODEL = "accounts.User"

# --------------------------------------------------------------------------
# Frontend origin, CORS and CSRF
# --------------------------------------------------------------------------
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")  # also used in password-reset emails
CORS_ALLOWED_ORIGINS = env_list("DJANGO_CORS_ORIGINS", FRONTEND_URL)
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list("DJANGO_CSRF_TRUSTED_ORIGINS", FRONTEND_URL)

# --------------------------------------------------------------------------
# Sessions, cookies and HTTPS
# --------------------------------------------------------------------------
USE_HTTPS = env_bool("DJANGO_USE_HTTPS", not DEBUG)
BEHIND_PROXY = env_bool("DJANGO_BEHIND_PROXY", False)  # True when nginx/a load balancer terminates HTTPS

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = USE_HTTPS
SESSION_COOKIE_SAMESITE = os.getenv("DJANGO_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_AGE = 60 * 60 * int(os.getenv("DJANGO_SESSION_HOURS", "8"))
SESSION_SAVE_EVERY_REQUEST = True  # sliding expiry: idle sessions expire, active ones stay alive
CSRF_COOKIE_HTTPONLY = False       # React must read this cookie to send X-CSRFToken
CSRF_COOKIE_SECURE = USE_HTTPS
CSRF_COOKIE_SAMESITE = os.getenv("DJANGO_COOKIE_SAMESITE", "Lax")
# Only needed when the site and API are on different subdomains (e.g. ".example.com")
SESSION_COOKIE_DOMAIN = os.getenv("DJANGO_COOKIE_DOMAIN") or None
CSRF_COOKIE_DOMAIN = os.getenv("DJANGO_COOKIE_DOMAIN") or None

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
if BEHIND_PROXY:
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
if USE_HTTPS and not DEBUG:
    SECURE_SSL_REDIRECT = env_bool("DJANGO_SSL_REDIRECT", True)
    SECURE_REDIRECT_EXEMPT = [r"^api/health/$"]  # load balancers probe this over plain HTTP
    SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "2592000"))  # 30 days; raise once confident
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("DJANGO_HSTS_INCLUDE_SUBDOMAINS", False)

# --------------------------------------------------------------------------
# Django REST Framework
# --------------------------------------------------------------------------
_renderers = ["rest_framework.renderers.JSONRenderer"]
if DEBUG:
    _renderers.append("rest_framework.renderers.BrowsableAPIRenderer")

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ["rest_framework.authentication.SessionAuthentication"],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_RENDERER_CLASSES": _renderers,
    "EXCEPTION_HANDLER": "config.exceptions.api_exception_handler",
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardPagination",
    # Only the sign-in and password-reset views are rate limited (see accounts/throttles.py)
    "DEFAULT_THROTTLE_RATES": {
        "login": "5/min",             # sign-in attempts per IP address
        "password_reset": "5/hour",   # forgot/reset password requests per IP address
    },
    "NUM_PROXIES": int(os.getenv("DJANGO_NUM_PROXIES", "0")),  # 1 when behind one reverse proxy
}

# --------------------------------------------------------------------------
# Email (password reset)
# --------------------------------------------------------------------------
EMAIL_BACKEND = os.getenv(
    "DJANGO_EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend" if DEBUG else "django.core.mail.backends.smtp.EmailBackend",
)
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "HRMS <no-reply@localhost>")

# --------------------------------------------------------------------------
# Logging: console always; rotating files when DJANGO_LOG_DIR is set
# --------------------------------------------------------------------------
LOG_DIR = os.getenv("DJANGO_LOG_DIR", "")
_handlers = {"console": {"class": "logging.StreamHandler", "formatter": "standard"}}
_active = ["console"]
if LOG_DIR:
    Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
    _handlers["app_file"] = {
        "class": "logging.handlers.RotatingFileHandler", "formatter": "standard",
        "filename": str(Path(LOG_DIR) / "hrms.log"), "maxBytes": 5 * 1024 * 1024, "backupCount": 10,
    }
    _handlers["security_file"] = {
        "class": "logging.handlers.RotatingFileHandler", "formatter": "standard",
        "filename": str(Path(LOG_DIR) / "security.log"), "maxBytes": 5 * 1024 * 1024, "backupCount": 20,
    }
_app = _active + (["app_file"] if LOG_DIR else [])
_sec = _active + (["security_file"] if LOG_DIR else [])

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"standard": {"format": "%(asctime)s %(levelname)s %(name)s %(message)s"}},
    "handlers": _handlers,
    "loggers": {
        "django": {"handlers": _app, "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"), "propagate": False},
        "django.security": {"handlers": _sec, "level": "WARNING", "propagate": False},
        "hrms.security": {"handlers": _sec, "level": "INFO", "propagate": False},  # logins, failures, password changes
        "hrms.audit": {"handlers": _sec, "level": "INFO", "propagate": False},     # who changed what
    },
}
