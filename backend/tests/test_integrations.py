import pytest
import responses

pytestmark = pytest.mark.django_db

HOLIDAYS_URL = "https://brasilapi.com.br/api/feriados/v1/2026"


@responses.activate
def test_holidays_returns_data(auth_client):
    responses.add(
        responses.GET,
        HOLIDAYS_URL,
        json=[
            {
                "date": "2026-01-01",
                "name": "Confraternização mundial",
                "type": "national",
            }
        ],
        status=200,
    )
    resp = auth_client.get("/api/integrations/holidays/?year=2026")
    assert resp.status_code == 200
    assert resp.data[0]["name"] == "Confraternização mundial"


def test_holidays_invalid_year_returns_400(auth_client):
    resp = auth_client.get("/api/integrations/holidays/?year=abc")
    assert resp.status_code == 400


@responses.activate
def test_holidays_upstream_failure_returns_502(auth_client):
    responses.add(responses.GET, HOLIDAYS_URL, status=500)
    resp = auth_client.get("/api/integrations/holidays/?year=2026")
    assert resp.status_code == 502


def test_holidays_requires_authentication(api_client):
    assert api_client.get("/api/integrations/holidays/?year=2026").status_code == 401
