from django.contrib.auth.models import User
from django.db import models

from apps.categories.models import Category


class Task(models.Model):
    """Tarefa criada por um usuário. Pode ser compartilhada via TaskShare."""

    class Priority(models.TextChoices):
        LOW = "low", "Baixa"
        MEDIUM = "medium", "Média"
        HIGH = "high", "Alta"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    is_completed = models.BooleanField(default=False)
    due_date = models.DateTimeField(null=True, blank=True)
    priority = models.CharField(
        max_length=6,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    # Cor (hex) do post-it; vazia significa herdar a cor padrão da categoria.
    color = models.CharField(max_length=7, blank=True, default="")
    # "Observação": destaca visualmente o post-it (tachinha) no quadro.
    is_highlighted = models.BooleanField(default=False)
    # Ordem vertical do post-it dentro da coluna, definida ao arrastar.
    display_order = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="tasks",
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.title


class TaskShare(models.Model):
    """Compartilhamento de uma tarefa com outro usuário, com nível de permissão."""

    class Permission(models.TextChoices):
        READ = "read", "Somente leitura"
        READ_WRITE = "read_write", "Leitura e edição"

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="shares",
    )
    shared_with = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="shared_tasks",
    )
    shared_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="shares_created",
    )
    permission = models.CharField(
        max_length=10,
        choices=Permission.choices,
        default=Permission.READ,
    )
    shared_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["task", "shared_with"],
                name="unique_share_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.task} -> {self.shared_with} ({self.permission})"
