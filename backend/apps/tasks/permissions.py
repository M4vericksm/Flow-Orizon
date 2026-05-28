from rest_framework import permissions

from .models import TaskShare


class TaskAccessPermission(permissions.BasePermission):
    """Regras de acesso a uma tarefa, considerando dono e compartilhamentos.

    - Dono: acesso total (ler, editar, apagar, gerenciar compartilhamentos).
    - Compartilhada como "read_write": pode ler e editar, mas não apagar.
    - Compartilhada como "read": apenas leitura.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if obj.owner_id == user.id:
            return True

        # A partir daqui é alguém com quem a tarefa foi compartilhada.
        if request.method in permissions.SAFE_METHODS:
            return obj.shares.filter(shared_with=user).exists()

        # Apagar é exclusivo do dono.
        if request.method == "DELETE":
            return False

        # Demais métodos (PUT/PATCH/toggle) exigem permissão de edição.
        return obj.shares.filter(
            shared_with=user,
            permission=TaskShare.Permission.READ_WRITE,
        ).exists()
