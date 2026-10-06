from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models

class UserManager(DjangoUserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Roles.SUPER_ADMIN)
        return super().create_superuser(username, email, password, **extra_fields)

class User(AbstractUser):
    class Roles(models.TextChoices):
        SUPER_ADMIN="SUPER_ADMIN","Super Admin"
        HR_ADMIN="HR_ADMIN","HR Admin"
        MANAGER="MANAGER","Manager"
        EMPLOYEE="EMPLOYEE","Employee"
    email=models.EmailField(unique=True)
    role=models.CharField(max_length=20,choices=Roles.choices,default=Roles.EMPLOYEE)
    phone=models.CharField(max_length=30,blank=True)
    objects=UserManager()
    def __str__(self): return self.get_full_name() or self.username
