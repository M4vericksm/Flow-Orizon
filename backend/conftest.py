"""Fixtures compartilhadas entre os testes."""

import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    """Cliente HTTP da API, sem autenticação."""
    return APIClient()


@pytest.fixture
def user(db):
    """Usuário comum para os testes."""
    return User.objects.create_user(
        username="maverick",
        email="maverick@example.com",
        password="StrongPass123",
    )


@pytest.fixture
def other_user(db):
    """Segundo usuário, usado nos testes de compartilhamento e isolamento."""
    return User.objects.create_user(
        username="alex",
        email="alex@example.com",
        password="StrongPass123",
    )


@pytest.fixture
def auth_client(api_client, user):
    """Cliente já autenticado como `user`."""
    api_client.force_authenticate(user=user)
    return api_client
