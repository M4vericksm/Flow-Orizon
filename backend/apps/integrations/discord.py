import logging
import os

import requests

logger = logging.getLogger(__name__)
TIMEOUT_SECONDS = 5


def notify_task_shared(task_title, shared_by, shared_with, permission):
    """Envia uma notificação ao Discord avisando sobre o compartilhamento.

    A integração é opcional: sem DISCORD_WEBHOOK_URL configurada, nada é feito.
    Qualquer falha no envio é apenas registrada em log — notificar é
    best-effort e nunca deve quebrar a operação de compartilhar a tarefa.
    """
    webhook_url = os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        return

    content = (
        f"**{shared_by}** compartilhou a tarefa **{task_title}** "
        f"com **{shared_with}** (permissão: {permission})."
    )
    try:
        requests.post(webhook_url, json={"content": content}, timeout=TIMEOUT_SECONDS)
    except requests.RequestException:
        logger.warning("Falha ao enviar notificação ao Discord", exc_info=True)
