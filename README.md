# Flow Orizon

Aplicação web de gerenciamento de tarefas no formato de um **mural de post-its**
(estilo Trello): cada categoria vira uma coluna e cada tarefa é um post-it que
pode ser arrastado, colorido, destacado e compartilhado com outros usuários.

## Stack

- **Backend:** Python · Django 5 · Django REST Framework · PostgreSQL · JWT
- **Frontend:** React · Vite · nginx
- **Infra:** Docker · Docker Compose
- **Testes:** pytest (back-end) · Selenium (end-to-end)
- **CI:** GitHub Actions

## Funcionalidades

- Cadastro e login de usuários (autenticação JWT)
- CRUD de tarefas e de categorias
- Compartilhamento de tarefas com níveis de permissão (`read` / `read_write`)
- Marcar tarefas como concluídas
- Filtragem (status, prioridade, categoria, busca textual) e paginação
- Quadro estilo Trello com drag-and-drop, 16 cores, destaque e 4 temas visuais
- Integrações externas: consulta de feriados (BrasilAPI) e webhook do Discord
- Documentação da API via Swagger/OpenAPI

## Como rodar

### Pré-requisitos
- Docker 24+ e Docker Compose v2+

### Passos
```bash
git clone https://github.com/M4vericksm/Flow-Orizon.git
cd Flow-Orizon
cp backend/.env.example backend/.env
docker compose up --build
```

Sobe três serviços:

| Serviço | URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:8000/api |
| Swagger (docs da API) | http://localhost:8000/api/docs/ |

Abra http://localhost:5173, crie uma conta e comece a usar.

### Verificar que está no ar
```bash
curl http://localhost:8000/api/health/
# {"status": "ok", "service": "flow-orizon-api"}
```

## Testes

### Back-end (pytest)
Com a stack no ar:
```bash
docker compose run --rm backend pytest --cov=apps
```

### End-to-end (Selenium)
Exercitam a aplicação real no navegador (Chrome headless). Requer a stack no ar
e o Google Chrome instalado:
```bash
cd e2e
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # Linux/Mac: .venv/bin/pip
.venv/Scripts/python -m pytest -v
```
Detalhes em [`e2e/README.md`](e2e/README.md).

Os dois conjuntos de testes também rodam automaticamente no CI a cada push
(ver [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Documentação da API

Com a aplicação rodando, a interface Swagger fica em
http://localhost:8000/api/docs/ e o schema OpenAPI em
http://localhost:8000/api/schema/.

## Arquitetura e decisões de design

A arquitetura, o modelo de dados e as decisões de design (incluindo SOLID, DRY e
KISS) estão documentados em [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md). O
diagrama editável está em [`docs/arquitetura.drawio`](docs/arquitetura.drawio)
(abre no [draw.io](https://app.diagrams.net)).

## Estrutura do projeto

```
flow-orizon/
├── backend/        # Django + DRF (apps: users, categories, tasks, integrations)
├── frontend/       # React + Vite
├── e2e/            # testes Selenium
├── docs/           # arquitetura + diagrama
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Licença

MIT — ver [LICENSE](LICENSE).
