from rest_framework.routers import DefaultRouter
from .views import DesignationViewSet
router=DefaultRouter(); router.register("",DesignationViewSet,basename="designation"); urlpatterns=router.urls
