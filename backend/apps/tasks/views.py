from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD de tarefas, restrito às tarefas do usuário autenticado.

    O compartilhamento entre usuários é adicionado em iteração seguinte.
    """

    serializer_class = TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=True, methods=["post"])
    def toggle(self, request, pk=None):
        """Alterna o estado de conclusão da tarefa."""
        task = self.get_object()
        task.is_completed = not task.is_completed
        task.save(update_fields=["is_completed", "updated_at"])
        return Response(self.get_serializer(task).data)
