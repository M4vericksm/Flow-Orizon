import pytest

pytestmark = pytest.mark.django_db


def test_register_creates_user(api_client):
    resp = api_client.post(
        "/api/auth/register/",
        {
            "username": "newbie",
            "email": "newbie@example.com",
            "password": "StrongPass123",
        },
        format="json",
    )
    assert resp.status_code == 201
    assert resp.data["username"] == "newbie"
    # A senha nunca é devolvida na resposta.
    assert "password" not in resp.data


def test_register_rejects_weak_password(api_client):
    resp = api_client.post(
        "/api/auth/register/",
        {"username": "weak", "password": "123"},
        format="json",
    )
    assert resp.status_code == 400


def test_login_returns_tokens(api_client, user):
    resp = api_client.post(
        "/api/auth/login/",
        {"username": "maverick", "password": "StrongPass123"},
        format="json",
    )
    assert resp.status_code == 200
    assert "access" in resp.data
    assert "refresh" in resp.data


def test_me_requires_authentication(api_client):
    assert api_client.get("/api/auth/me/").status_code == 401


def test_me_returns_current_user(auth_client, user):
    resp = auth_client.get("/api/auth/me/")
    assert resp.status_code == 200
    assert resp.data["username"] == user.username
