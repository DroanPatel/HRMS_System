from django.conf import settings
from django.db import models
class Attendance(models.Model):
    class Status(models.TextChoices):
        PRESENT="PRESENT","Present"; ABSENT="ABSENT","Absent"; HALF_DAY="HALF_DAY","Half Day"; ON_LEAVE="ON_LEAVE","On Leave"
    employee=models.ForeignKey("employees.Employee",on_delete=models.CASCADE,related_name="attendance_records")
    date=models.DateField(); check_in=models.DateTimeField(null=True,blank=True); check_out=models.DateTimeField(null=True,blank=True)
    status=models.CharField(max_length=20,choices=Status.choices,default=Status.PRESENT); notes=models.TextField(blank=True)
    created_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name="created_attendance")
    class Meta:
        ordering=["-date"]
        constraints=[
            models.UniqueConstraint(fields=["employee","date"],name="unique_employee_attendance_date"),
            models.CheckConstraint(condition=models.Q(check_out__isnull=True)|models.Q(check_in__isnull=True)|models.Q(check_out__gte=models.F("check_in")),name="attendance_checkout_after_checkin"),
        ]
        indexes=[models.Index(fields=["date"])]
