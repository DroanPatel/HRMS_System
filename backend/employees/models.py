from django.conf import settings
from django.db import models
from departments.models import Department

class Designation(models.Model):
    name=models.CharField(max_length=100,unique=True)
    description=models.TextField(blank=True)
    is_active=models.BooleanField(default=True)
    class Meta: ordering=["name"]
    def __str__(self): return self.name

class Employee(models.Model):
    class EmploymentStatus(models.TextChoices):
        ACTIVE="ACTIVE","Active"; INACTIVE="INACTIVE","Inactive"; ON_LEAVE="ON_LEAVE","On Leave"
    user=models.OneToOneField(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name="employee_profile")
    employee_id=models.CharField(max_length=30,unique=True)
    first_name=models.CharField(max_length=100); last_name=models.CharField(max_length=100)
    email=models.EmailField(unique=True); phone=models.CharField(max_length=30,blank=True)
    date_of_birth=models.DateField(null=True,blank=True); date_of_joining=models.DateField()
    department=models.ForeignKey(Department,on_delete=models.PROTECT,related_name="employees")
    designation=models.ForeignKey(Designation,on_delete=models.PROTECT,related_name="employees")
    manager=models.ForeignKey("self",on_delete=models.SET_NULL,null=True,blank=True,related_name="direct_reports")
    employment_status=models.CharField(max_length=20,choices=EmploymentStatus.choices,default=EmploymentStatus.ACTIVE)
    address=models.TextField(blank=True); emergency_contact_name=models.CharField(max_length=150,blank=True); emergency_contact_phone=models.CharField(max_length=30,blank=True)
    created_at=models.DateTimeField(auto_now_add=True); updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=["first_name","last_name"]
        constraints=[models.CheckConstraint(condition=~models.Q(pk=models.F("manager")),name="employee_not_own_manager")]
        indexes=[models.Index(fields=["employment_status"]),models.Index(fields=["date_of_joining"])]
    @property
    def full_name(self): return f"{self.first_name} {self.last_name}".strip()
    def __str__(self): return f"{self.employee_id} - {self.full_name}"
