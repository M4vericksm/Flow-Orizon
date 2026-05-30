"""Fixtures dos testes end-to-end com Selenium.

Os testes assumem a stack rodando (docker compose up): frontend em
E2E_FRONT_URL e API em E2E_API_URL. Cada teste cria um usuário próprio
via API, mantendo-os independentes.
"""

import os
import uuid

import pytest
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from helpers import api_headers

API_URL = os.getenv("E2E_API_URL", "http://localhost:8000/api")
FRONT_URL = os.getenv("E2E_FRONT_URL", "http://localhost:5173")


@pytest.fixture
def front_url():
    return FRONT_URL


@pytest.fixture
def api_url():
    return API_URL


@pytest.fixture
def user():
    """Cria um usuário único via API e devolve credenciais + token."""
    username = f"e2e_{uuid.uuid4().hex[:8]}"
    password = "E2ePass12345"
    requests.post(
        f"{API_URL}/auth/register/",
        json={"username": username, "email": f"{username}@e2e.test", "password": password},
        timeout=10,
    )
    resp = requests.post(
        f"{API_URL}/auth/login/",
        json={"username": username, "password": password},
        timeout=10,
    )
    token = resp.json()["access"]
    return {"username": username, "password": password, "token": token}


@pytest.fixture
def category(user):
    """Cria uma categoria (coluna) para o usuário do teste."""
    resp = requests.post(
        f"{API_URL}/categories/",
        json={"name": "Trabalho", "default_color": "#FFF9B0"},
        headers=api_headers(user["token"]),
        timeout=10,
    )
    return resp.json()


@pytest.fixture
def driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1400,900")
    drv = webdriver.Chrome(options=options)
    yield drv
    drv.quit()
