from django.db.models import Q
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.integrations.discord import notify_task_shared

from .models import Task, TaskShare
from .permissions import TaskAccessPermission
from .serializers import TaskSerializer, TaskShareSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD de tarefas do usuário e das tarefas compartilhadas com ele."""

    serializer_class = TaskSerializer
    permission_classes = (TaskAccessPermission,)
    # Filtros de igualdade exata (?is_completed=true&priority=high&category=2),
    # ordenação (?ordering=due_date ou ?ordering=-created_at) e busca textual
    # parcial em título/descrição (?search=relatorio).
    filterset_fields = ("is_completed", "priority", "category")
    ordering_fields = ("created_at", "due_date", "priority", "display_order")
    ordering = ("-created_at",)
    search_fields = ("title", "description")

    def get_queryset(self):
        # Durante a geração do schema (drf-spectacular) não há usuário real.
        if getattr(self, "swagger_fake_view", False):
            return Task.objects.none()
        # O usuário enxerga as tarefas que criou e também as que foram
        # compartilhadas com ele. distinct() evita duplicatas no join e
        # select_related("owner") evita o N+1 ao serializar owner.username.
        user = self.request.user
        return (
            Task.objects.filter(Q(owner=user) | Q(shares__shared_with=user))
            .select_related("owner")
            .prefetch_related("shares__shared_with", "shares__shared_by")
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        """Alterna o estado de conclusão da tarefa."""
        task = self.get_object()
        task.is_completed = not task.is_completed
        task.save(update_fields=["is_completed", "updated_at"])
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=["get", "post"])
    def shares(self, request, pk=None):
        """Lista (GET) ou cria (POST) compartilhamentos da tarefa.

        Apenas o dono da tarefa pode gerenciar os compartilhamentos.
        """
        task = self.get_object()
        if task.owner_id != request.user.id:
            return Response(
                {"detail": "Apenas o dono pode gerenciar compartilhamentos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.method == "GET":
            serializer = TaskShareSerializer(task.shares.all(), many=True)
            return Response(serializer.data)

        serializer = TaskShareSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        target = serializer.validated_data["username"]
        if target.id == request.user.id:
            return Response(
                {"detail": "Você não pode compartilhar uma tarefa com você mesmo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # update_or_create permite atualizar o nível de permissão de um
        # compartilhamento já existente sem violar a constraint (task, shared_with).
        share, created = TaskShare.objects.update_or_create(
            task=task,
            shared_with=target,
            defaults={
                "shared_by": request.user,
                "permission": serializer.validated_data["permission"],
            },
        )
        notify_task_shared(
            task_title=task.title,
            shared_by=request.user.username,
            shared_with=target.username,
            permission=share.permission,
        )

        out = TaskShareSerializer(share)
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(out.data, status=code)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="share_id",
                type=int,
                location=OpenApiParameter.PATH,
                description="ID do compartilhamento a ser revogado.",
            )
        ],
        responses={204: None},
    )
    @action(
        detail=True,
        methods=["delete"],
        url_path=r"shares/(?P<share_id>[^/.]+)",
    )
    def revoke_share(self, request, pk=None, share_id=None):
        """Revoga um compartilhamento específico. Restrito ao dono da tarefa."""
        task = self.get_object()
        if task.owner_id != request.user.id:
            return Response(
                {"detail": "Apenas o dono pode gerenciar compartilhamentos."},
                status=status.HTTP_403_FORBIDDEN,
            )
        share = get_object_or_404(TaskShare, pk=share_id, task=task)
        share.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
