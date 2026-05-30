import pytest

from apps.categories.models import Category

pytestmark = pytest.mark.django_db


def test_create_category_sets_owner(auth_client, user):
    resp = auth_client.post(
        "/api/categories/",
        {"name": "Trabalho", "default_color": "#FFF9B0"},
        format="json",
    )
    assert resp.status_code == 201
    category = Category.objects.get(id=resp.data["id"])
    assert category.owner == user
    assert category.default_color == "#FFF9B0"


def test_list_only_own_categories(auth_client, user, other_user):
    Category.objects.create(name="Minha", owner=user)
    Category.objects.create(name="Dele", owner=other_user)
    resp = auth_client.get("/api/categories/")
    assert resp.status_code == 200
    names = [c["name"] for c in resp.data["results"]]
    assert names == ["Minha"]


def test_duplicate_name_returns_400(auth_client, user):
    Category.objects.create(name="Trabalho", owner=user)
    resp = auth_client.post(
        "/api/categories/", {"name": "Trabalho"}, format="json"
    )
    assert resp.status_code == 400


def test_cannot_retrieve_other_users_category(auth_client, other_user):
    category = Category.objects.create(name="Dele", owner=other_user)
    resp = auth_client.get(f"/api/categories/{category.id}/")
    assert resp.status_code == 404


def test_requires_authentication(api_client):
    assert api_client.get("/api/categories/").status_code == 401
