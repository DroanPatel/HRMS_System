from rest_framework import serializers
from .models import Department
class DepartmentSerializer(serializers.ModelSerializer):
    employee_count=serializers.IntegerField(read_only=True)
    class Meta:
        model=Department; fields=["id","name","code","description","is_active","employee_count","created_at"]
