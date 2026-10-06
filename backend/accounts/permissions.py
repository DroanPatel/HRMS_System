from rest_framework.permissions import BasePermission
class IsHROrAdmin(BasePermission):
    def has_permission(self,request,view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_superuser or request.user.role in {"SUPER_ADMIN","HR_ADMIN"}))
class IsManagerOrHR(BasePermission):
    def has_permission(self,request,view):
        return bool(request.user and request.user.is_authenticated and (request.user.is_superuser or request.user.role in {"SUPER_ADMIN","HR_ADMIN","MANAGER"}))
