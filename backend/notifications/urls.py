from django.urls import path
from .views import NotificationListView, mark_all_read, mark_read, unread_count

urlpatterns = [
    path("", NotificationListView.as_view()),
    path("unread-count/", unread_count),
    path("read-all/", mark_all_read),
    path("<int:pk>/read/", mark_read),
]
