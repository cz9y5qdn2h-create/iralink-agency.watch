from fastapi.testclient import TestClient

from apps.api.app.main import app

client = TestClient(app)


def test_get_watches() -> None:
    response = client.get('/watches')
    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    assert payload[0]['id'] == 'w_001'


def test_get_watch_by_id() -> None:
    response = client.get('/watches/w_001')
    assert response.status_code == 200
    assert response.json()['reference'] == '126610LN'


def test_get_opportunities() -> None:
    response = client.get('/opportunities')
    assert response.status_code == 200
    assert response.json()[0]['watch_id'] == 'w_001'


def test_post_alerts() -> None:
    response = client.post('/alerts', json={'email': 'ops@example.com', 'min_score': 0.8})
    assert response.status_code == 201
    assert response.json()['status'] == 'created'
