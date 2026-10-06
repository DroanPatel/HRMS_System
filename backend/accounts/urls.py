from django.urls import path
from .views import change_password, csrf, forgot_password, login_view, logout_view, me, reset_password

urlpatterns = [
    path("csrf/", csrf),
    path("login/", login_view),
    path("logout/", logout_view),
    path("me/", me),
    path("change-password/", change_password),
    path("forgot-password/", forgot_password),
    path("reset-password/", reset_password),
]
