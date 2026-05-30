import pytest

from apps.tasks.models import Task, TaskShare

pytestmark = pytest.mark.django_db


def test_create_task_sets_owner(auth_client, user):
    resp = auth_client.post(
        "/api/tasks/", {"title": "Estudar Django"}, format="json"
    )
    assert resp.status_code == 201
    task = Task.objects.get(id=resp.data["id"])
    assert task.owner == user


def test_list_returns_own_and_shared(auth_client, user, other_user):
    Task.objects.create(title="Minha", owner=user)
    shared = Task.objects.create(title="Compartilhada", owner=other_user)
    TaskShare.objects.create(
        task=shared, shared_with=user, shared_by=other_user, permission="read"
    )
    # Tarefa de outro usuário, não compartilhada: não deve aparecer.
    Task.objects.create(title="Invisível", owner=other_user)

    resp = auth_client.get("/api/tasks/")
    titles = {t["title"] for t in resp.data["results"]}
    assert titles == {"Minha", "Compartilhada"}


def test_toggle_completion(auth_client, user):
    task = Task.objects.create(title="X", owner=user)
    resp = auth_client.post(f"/api/tasks/{task.id}/toggle/")
    assert resp.status_code == 200
    assert resp.data["is_completed"] is True
    task.refresh_from_db()
    assert task.is_completed is True


def test_filter_by_completed(auth_client, user):
    Task.objects.create(title="Feita", owner=user, is_completed=True)
    Task.objects.create(title="Pendente", owner=user, is_completed=False)
    resp = auth_client.get("/api/tasks/?is_completed=true")
    titles = [t["title"] for t in resp.data["results"]]
    assert titles == ["Feita"]


def test_search_by_title(auth_client, user):
    Task.objects.create(title="Relatório mensal", owner=user)
    Task.objects.create(title="Outra coisa", owner=user)
    resp = auth_client.get("/api/tasks/?search=relat")
    titles = [t["title"] for t in resp.data["results"]]
    assert titles == ["Relatório mensal"]


def test_owner_can_delete_task(auth_client, user):
    task = Task.objects.create(title="X", owner=user)
    resp = auth_client.delete(f"/api/tasks/{task.id}/")
    assert resp.status_code == 204
    assert not Task.objects.filter(id=task.id).exists()


def test_response_exposes_shares(auth_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    TaskShare.objects.create(
        task=task, shared_with=other_user, shared_by=user, permission="read"
    )
    resp = auth_client.get(f"/api/tasks/{task.id}/")
    assert resp.status_code == 200
    assert resp.data["shares"][0]["shared_with"] == other_user.username
