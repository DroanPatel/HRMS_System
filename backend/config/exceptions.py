from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def api_exception_handler(exc, context):
    # Deleting a Department/Designation that employees still use raises ProtectedError.
    # DRF does not handle it by default (it would be a 500), so return a clear 409.
    if isinstance(exc, ProtectedError):
        return Response(
            {
                "detail": "This record is still in use by other records and cannot be deleted. "
                "Reassign those records first, or mark it inactive instead."
            },
            status=status.HTTP_409_CONFLICT,
        )
    return drf_exception_handler(exc, context)
