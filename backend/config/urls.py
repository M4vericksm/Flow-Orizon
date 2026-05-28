"""URLs raiz do Flow Orizon."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(_request):
    """Endpoint de healthcheck para verificar se a API está no ar."""
    return JsonResponse({"status": "ok", "service": "flow-orizon-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("apps.users.urls")),
    path("api/categories/", include("apps.categories.urls")),
    path("api/tasks/", include("apps.tasks.urls")),
    path("api/integrations/", include("apps.integrations.urls")),
]
