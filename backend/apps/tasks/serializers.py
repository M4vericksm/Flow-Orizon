from django.contrib.auth.models import User
from rest_framework import serializers

from apps.categories.models import Category

from .models import Task, TaskShare


class TaskShareSerializer(serializers.ModelSerializer):
    # O cliente envia o username de quem vai receber o acesso; na resposta
    # devolvemos os nomes legíveis em vez dos ids dos usuários.
    username = serializers.CharField(write_only=True)
    shared_with = serializers.ReadOnlyField(source="shared_with.username")
    shared_by = serializers.ReadOnlyField(source="shared_by.username")

    class Meta:
        model = TaskShare
        fields = (
            "id",
            "username",
            "shared_with",
            "shared_by",
            "permission",
            "shared_at",
        )
        read_only_fields = ("id", "shared_with", "shared_by", "shared_at")

    def validate_username(self, value):
        try:
            return User.objects.get(username=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuário não encontrado.")


class TaskSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")
    # Lista de compartilhamentos da tarefa, usada pelo quadro para exibir
    # com quem ela foi compartilhada (somente leitura aqui; a criação acontece
    # no endpoint dedicado /tasks/{id}/shares/).
    shares = TaskShareSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "is_completed",
            "due_date",
            "priority",
            "color",
            "is_highlighted",
            "display_order",
            "category",
            "owner",
            "shares",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "owner", "shares", "created_at", "updated_at")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Garante que o usuário só consiga associar categorias que são dele.
        request = self.context.get("request")
        if request is not None and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(
                owner=request.user
            )
