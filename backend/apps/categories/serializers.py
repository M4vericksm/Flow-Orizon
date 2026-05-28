from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "color", "created_at")
        # owner é definido pela view a partir do usuário autenticado,
        # nunca enviado pelo cliente.
        read_only_fields = ("id", "created_at")
