"""Fluxos do quadro: criar post-it e marcar como concluído."""

import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from helpers import TIMEOUT, api_headers, login, wait_css


def test_create_postit_via_modal(driver, front_url, user, category):
    login(driver, front_url, user)
    # Abre o modal de novo post-it pelo "+ Adicionar" da coluna.
    wait_css(driver, ".col-add").click()
    modal = wait_css(driver, ".modal")
    modal.find_element(By.CSS_SELECTOR, ".input").send_keys("Tarefa via Selenium")
    modal.find_element(By.CSS_SELECTOR, ".modal-foot .btn-primary").click()
    # O post-it criado aparece no quadro.
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: any(
            "Tarefa via Selenium" in e.text
            for e in d.find_elements(By.CSS_SELECTOR, ".pi-title")
        )
    )


def test_toggle_complete(driver, front_url, user, category, api_url):
    # Cria a tarefa direto pela API e valida o toggle pela interface.
    requests.post(
        f"{api_url}/tasks/",
        json={"title": "Concluir pelo board", "category": category["id"]},
        headers=api_headers(user["token"]),
        timeout=10,
    )
    login(driver, front_url, user)
    postit = wait_css(driver, ".postit")
    postit.find_element(By.CSS_SELECTOR, ".pi-check").click()
    WebDriverWait(driver, TIMEOUT).until(
        lambda d: "completed"
        in d.find_element(By.CSS_SELECTOR, ".postit").get_attribute("class")
    )
