from rest_framework import viewsets

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD de categorias, restrito às categorias do usuário autenticado."""

    serializer_class = CategorySerializer

    def get_queryset(self):
        # Durante a geração do schema (drf-spectacular) não há usuário real.
        if getattr(self, "swagger_fake_view", False):
            return Category.objects.none()
        return Category.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
