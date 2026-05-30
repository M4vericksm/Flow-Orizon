from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "default_color", "created_at")
        # owner é definido pela view a partir do usuário autenticado,
        # nunca enviado pelo cliente.
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        # owner não está no payload (é o usuário autenticado), então a
        # checagem de nome duplicado é feita aqui para devolver um 400 claro,
        # em vez de deixar estourar a constraint do banco como erro 500.
        request = self.context.get("request")
        if request is None:
            return value
        duplicates = Category.objects.filter(owner=request.user, name=value)
        if self.instance is not None:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError(
                "Você já possui uma categoria com este nome."
            )
        return value
