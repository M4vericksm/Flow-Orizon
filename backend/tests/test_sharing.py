import pytest

from apps.tasks.models import Task, TaskShare

pytestmark = pytest.mark.django_db


def _as(api_client, target_user):
    api_client.force_authenticate(user=target_user)
    return api_client


def test_owner_can_share(auth_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    resp = auth_client.post(
        f"/api/tasks/{task.id}/shares/",
        {"username": "alex", "permission": "read"},
        format="json",
    )
    assert resp.status_code == 201
    assert TaskShare.objects.filter(task=task, shared_with=other_user).exists()


def test_cannot_share_with_self(auth_client, user):
    task = Task.objects.create(title="X", owner=user)
    resp = auth_client.post(
        f"/api/tasks/{task.id}/shares/",
        {"username": "maverick", "permission": "read"},
        format="json",
    )
    assert resp.status_code == 400


def test_share_with_unknown_user_returns_400(auth_client, user):
    task = Task.objects.create(title="X", owner=user)
    resp = auth_client.post(
        f"/api/tasks/{task.id}/shares/",
        {"username": "ghost", "permission": "read"},
        format="json",
    )
    assert resp.status_code == 400


def test_resharing_updates_permission(auth_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    auth_client.post(
        f"/api/tasks/{task.id}/shares/",
        {"username": "alex", "permission": "read"},
        format="json",
    )
    resp = auth_client.post(
        f"/api/tasks/{task.id}/shares/",
        {"username": "alex", "permission": "read_write"},
        format="json",
    )
    assert resp.status_code == 200
    share = TaskShare.objects.get(task=task, shared_with=other_user)
    assert share.permission == "read_write"


def test_non_owner_cannot_share(api_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    TaskShare.objects.create(
        task=task, shared_with=other_user, shared_by=user, permission="read_write"
    )
    client = _as(api_client, other_user)
    resp = client.post(
        f"/api/tasks/{task.id}/shares/",
        {"username": "maverick", "permission": "read"},
        format="json",
    )
    assert resp.status_code == 403


def test_read_permission_cannot_edit(api_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    TaskShare.objects.create(
        task=task, shared_with=other_user, shared_by=user, permission="read"
    )
    client = _as(api_client, other_user)
    resp = client.patch(
        f"/api/tasks/{task.id}/", {"title": "Editado"}, format="json"
    )
    assert resp.status_code == 403


def test_read_write_permission_can_edit(api_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    TaskShare.objects.create(
        task=task, shared_with=other_user, shared_by=user, permission="read_write"
    )
    client = _as(api_client, other_user)
    resp = client.patch(
        f"/api/tasks/{task.id}/", {"title": "Editado"}, format="json"
    )
    assert resp.status_code == 200
    task.refresh_from_db()
    assert task.title == "Editado"


def test_shared_user_cannot_delete(api_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    TaskShare.objects.create(
        task=task, shared_with=other_user, shared_by=user, permission="read_write"
    )
    client = _as(api_client, other_user)
    resp = client.delete(f"/api/tasks/{task.id}/")
    assert resp.status_code == 403


def test_owner_can_revoke_share(auth_client, user, other_user):
    task = Task.objects.create(title="X", owner=user)
    share = TaskShare.objects.create(
        task=task, shared_with=other_user, shared_by=user, permission="read"
    )
    resp = auth_client.delete(f"/api/tasks/{task.id}/shares/{share.id}/")
    assert resp.status_code == 204
    assert not TaskShare.objects.filter(id=share.id).exists()
