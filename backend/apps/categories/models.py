from django.contrib.auth.models import User
from django.db import models


class Category(models.Model):
    """Categoria usada para organizar tarefas. Pertence a um único usuário."""

    name = models.CharField(max_length=50)
    # Cor padrão (hex) aplicada aos post-its criados nesta categoria/coluna.
    default_color = models.CharField(max_length=7, blank=True, default="")
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="categories",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)
        verbose_name_plural = "categories"
        constraints = [
            # O mesmo usuário não pode ter duas categorias com o mesmo nome.
            models.UniqueConstraint(
                fields=["owner", "name"],
                name="unique_category_name_per_owner",
            ),
        ]

    def __str__(self):
        return self.name
