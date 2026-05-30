"""Fluxos de autenticação pela interface."""

import uuid

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from helpers import TIMEOUT, login, wait_css


def test_login_shows_board(driver, front_url, user):
    login(driver, front_url, user)
    assert "/board" in driver.current_url
    # O wordmark da marca aparece no cabeçalho do quadro.
    assert "Orizon" in wait_css(driver, ".fo-logo").text


def test_register_creates_account(driver, front_url):
    username = f"e2e_{uuid.uuid4().hex[:8]}"
    driver.get(f"{front_url}/register")
    inputs = WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "form input")
    )
    # username, email, senha, confirmar senha
    inputs[0].send_keys(username)
    inputs[1].send_keys(f"{username}@e2e.test")
    inputs[2].send_keys("E2ePass12345")
    inputs[3].send_keys("E2ePass12345")
    driver.find_element(By.CSS_SELECTOR, "form .btn-primary").click()
    WebDriverWait(driver, TIMEOUT).until(EC.url_contains("/board"))
    assert wait_css(driver, ".board-scroll") is not None
