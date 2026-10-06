from django.conf import settings
from django.db import models
class LeaveType(models.Model):
    name=models.CharField(max_length=80,unique=True); code=models.CharField(max_length=30,unique=True)
    annual_days=models.DecimalField(max_digits=5,decimal_places=1,default=0); is_active=models.BooleanField(default=True)
    def __str__(self): return self.name
class LeaveRequest(models.Model):
    class Status(models.TextChoices):
        PENDING="PENDING","Pending"; APPROVED="APPROVED","Approved"; REJECTED="REJECTED","Rejected"; CANCELLED="CANCELLED","Cancelled"
    employee=models.ForeignKey("employees.Employee",on_delete=models.CASCADE,related_name="leave_requests")
    leave_type=models.ForeignKey(LeaveType,on_delete=models.PROTECT,related_name="requests")
    start_date=models.DateField(); end_date=models.DateField(); reason=models.TextField()
    status=models.CharField(max_length=20,choices=Status.choices,default=Status.PENDING)
    reviewed_by=models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.SET_NULL,null=True,blank=True,related_name="reviewed_leave_requests")
    reviewed_at=models.DateTimeField(null=True,blank=True); reviewer_comment=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True); updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        ordering=["-created_at"]
        constraints=[models.CheckConstraint(condition=models.Q(end_date__gte=models.F("start_date")),name="leave_end_not_before_start")]
        indexes=[models.Index(fields=["status"]),models.Index(fields=["start_date","end_date"])]
    @property
    def total_days(self): return (self.end_date-self.start_date).days+1
