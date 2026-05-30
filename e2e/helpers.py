"""Funções auxiliares para os testes Selenium."""

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

TIMEOUT = 15


def api_headers(token):
    return {"Authorization": f"Bearer {token}"}


def wait_css(driver, selector, timeout=TIMEOUT):
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, selector))
    )


def login(driver, front_url, user):
    """Faz login pela interface e espera o quadro carregar."""
    driver.get(f"{front_url}/login")
    inputs = WebDriverWait(driver, TIMEOUT).until(
        lambda d: d.find_elements(By.CSS_SELECTOR, "form input")
    )
    inputs[0].send_keys(user["username"])
    inputs[1].send_keys(user["password"])
    driver.find_element(By.CSS_SELECTOR, "form .btn-primary").click()
    WebDriverWait(driver, TIMEOUT).until(EC.url_contains("/board"))
    wait_css(driver, ".board-scroll")
