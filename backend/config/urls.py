from django.contrib import admin
from django.urls import include, path
from .health import health

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health),
    path("api/auth/", include("accounts.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/departments/", include("departments.urls")),
    path("api/designations/", include("employees.designation_urls")),
    path("api/attendance/", include("attendance.urls")),
    path("api/leaves/", include("leave_management.urls")),
    path("api/notifications/", include("notifications.urls")),
]
