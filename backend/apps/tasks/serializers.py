from rest_framework import serializers

from apps.categories.models import Category

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "is_completed",
            "due_date",
            "priority",
            "category",
            "owner",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Garante que o usuário só consiga associar categorias que são dele.
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(
                owner=request.user
            )
