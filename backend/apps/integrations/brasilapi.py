import requests

BASE_URL = "https://brasilapi.com.br/api/feriados/v1"
TIMEOUT_SECONDS = 5


class BrasilAPIError(Exception):
    """Falha ao consultar a BrasilAPI (rede, timeout ou resposta de erro)."""


def get_holidays(year):
    """Retorna a lista de feriados nacionais do ano informado.

    Levanta BrasilAPIError em qualquer falha de comunicação, para a view
    traduzir num status HTTP adequado em vez de estourar um erro 500.
    """
    try:
        response = requests.get(f"{BASE_URL}/{year}", timeout=TIMEOUT_SECONDS)
        response.raise_for_status()
    except requests.RequestException as exc:
        raise BrasilAPIError(str(exc)) from exc
    return response.json()
