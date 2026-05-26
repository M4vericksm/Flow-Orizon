# Flow Orizon

Aplicação web de gerenciamento de tarefas em desenvolvimento.

> Projeto em fase inicial de setup. As funcionalidades estão sendo construídas iterativamente.

## Stack planejada

- **Backend:** Django 5 + Django REST Framework + PostgreSQL
- **Frontend:** React + Vite + TypeScript (será adicionado em iteração futura)
- **Infra:** Docker + Docker Compose

## Como rodar (estado atual)

### Pré-requisitos
- Docker 24+ e Docker Compose v2+
- Git

### Setup

```bash
git clone https://github.com/M4vericksm/Flow-Orizon.git
cd Flow-Orizon
cp backend/.env.example backend/.env
docker compose up --build
```

A API ficará disponível em http://localhost:8000.

### Verificar que está no ar

```bash
curl http://localhost:8000/api/health/
# {"status": "ok", "service": "flow-orizon-api"}
```

## Estrutura atual

```
Flow-Orizon/
├── backend/
│   ├── config/             # settings, urls, wsgi
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

## Roadmap

- [x] Setup inicial Django + Postgres em Docker
- [ ] Cadastro e autenticação de usuários
- [ ] CRUD de tarefas e categorias
- [ ] Compartilhamento de tarefas com níveis de permissão
- [ ] Filtros e paginação
- [ ] Integrações com APIs externas
- [ ] Frontend React
- [ ] Testes (pytest e Selenium)
- [ ] CI/CD

## Licença

MIT
