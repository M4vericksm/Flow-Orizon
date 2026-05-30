# Testes E2E (Selenium)

Testes end-to-end que exercitam a aplicação real no navegador (Chrome headless),
contra o frontend e a API rodando.

## Pré-requisitos

- Stack no ar: `docker compose up` na raiz do projeto (frontend em `:5173`, API em `:8000`)
- Google Chrome instalado (o chromedriver é resolvido automaticamente pelo Selenium Manager)
- Python 3.11+

## Rodar

```bash
cd e2e
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # Linux/Mac: .venv/bin/pip
.venv/Scripts/python -m pytest -v
```

URLs podem ser sobrescritas por variáveis de ambiente:

- `E2E_FRONT_URL` (padrão `http://localhost:5173`)
- `E2E_API_URL` (padrão `http://localhost:8000/api`)

## Cobertura

| Teste | Fluxo |
| --- | --- |
| `test_login_shows_board` | Login pela interface carrega o quadro |
| `test_register_creates_account` | Cadastro de usuário pela interface |
| `test_create_postit_via_modal` | Criar post-it pelo modal |
| `test_toggle_complete` | Marcar post-it como concluído |

Cada teste cria um usuário próprio via API, mantendo-os independentes.
