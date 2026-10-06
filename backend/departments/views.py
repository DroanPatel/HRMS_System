from django.db.models import Count
from rest_framework import viewsets
from accounts.permissions import IsHROrAdmin, IsManagerOrHR
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.annotate(employee_count=Count("employees")).order_by("name")
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [IsManagerOrHR()]  # managers need the list for filters; only HR can change it
        return [IsHROrAdmin()]
