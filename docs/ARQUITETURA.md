# Arquitetura — Flow Orizon

Documento de arquitetura e decisões de design do projeto.
O diagrama editável está em [`arquitetura.drawio`](arquitetura.drawio) (abre no
[draw.io](https://app.diagrams.net)) e contém duas páginas: **Arquitetura** e
**Modelo de dados**.

## Visão geral

Aplicação web de gerenciamento de tarefas no formato de um mural de post-its
(estilo Trello). É composta por três serviços orquestrados via Docker Compose:

```
Navegador ──carrega o app──▶ Frontend (React + Vite, servido por nginx)
    │
    └──REST /api (JWT)──▶ Backend (Django REST Framework) ──ORM──▶ PostgreSQL
                                  │
                                  ├──GET──▶ BrasilAPI (feriados)
                                  └──POST─▶ Discord (webhook, opcional)
```

- **Frontend** — SPA em React. Em desenvolvimento roda no dev server do Vite;
  no container é compilado para arquivos estáticos servidos pelo nginx.
- **Backend** — API REST com Django REST Framework, autenticação via JWT.
- **PostgreSQL** — banco relacional.
- **Integrações externas** — consumo da BrasilAPI (feriados) e envio de webhook
  ao Discord quando uma tarefa é compartilhada.

## Estrutura do repositório

```
flow-orizon/
├── backend/            # Django + DRF
│   ├── apps/
│   │   ├── users/        # registro, login (JWT), perfil
│   │   ├── categories/   # CRUD de categorias
│   │   ├── tasks/        # Task, TaskShare, permissões
│   │   └── integrations/ # BrasilAPI + Discord
│   ├── config/           # settings, urls, wsgi/asgi
│   └── tests/            # testes pytest
├── frontend/           # React + Vite
│   └── src/
│       ├── api/           # cliente axios + módulos por recurso
│       ├── components/    # Board, Column, PostIt, Modal, Header, Auth
│       ├── store.js       # estado global (pub/sub) + ações
│       └── data.js        # paleta de cores e helpers
├── e2e/                # testes Selenium (end-to-end)
├── docs/               # este documento + diagrama
├── docker-compose.yml
└── .github/workflows/  # CI (pytest + selenium)
```

## Modelo de dados

| Entidade | Campos principais | Observações |
| --- | --- | --- |
| **User** (Django) | id, username, email, password (hash) | usa o modelo padrão do Django |
| **Category** | id, name, default_color, owner→User, created_at | `unique(owner, name)` |
| **Task** | id, title, description, is_completed, is_highlighted, color, priority, due_date, display_order, category→Category, owner→User | `category` com `SET_NULL`; `owner` com `CASCADE` |
| **TaskShare** | id, task→Task, shared_with→User, shared_by→User, permission, shared_at | `unique(task, shared_with)` |

Relacionamentos: um usuário tem várias categorias e tarefas; uma categoria
agrupa várias tarefas; uma tarefa pode ter vários compartilhamentos.

## Decisões de design

### Por que JWT (e não sessão)?
Frontend e backend são desacoplados e podem rodar em origens diferentes. JWT é
*stateless* (o servidor não guarda sessão), escala melhor e é o padrão em APIs
REST modernas.

### Categorias pertencem a um usuário
Se fossem globais, um usuário veria as categorias dos outros. Cada usuário
gerencia as suas — privacidade por padrão.

### Compartilhamento como tabela própria (`TaskShare`)
Um ManyToMany simples não carregaria os metadados necessários (nível de
permissão, quem compartilhou, quando). A tabela intermediária resolve isso e
ainda permite a constraint `unique(task, shared_with)`.

### Níveis de permissão
Apenas dois valores (`read` / `read_write`) resolvidos por um `CharField` com
choices — sem tabela de permissões extra (KISS). A matriz de acesso fica isolada
numa classe de permissão do DRF (`TaskAccessPermission`):

| Ação | Dono | `read_write` | `read` | Não relacionado |
| --- | :---: | :---: | :---: | :---: |
| Ver | ✅ | ✅ | ✅ | ❌ |
| Editar | ✅ | ✅ | ❌ | ❌ |
| Marcar concluída | ✅ | ✅ | ❌ | ❌ |
| Deletar | ✅ | ❌ | ❌ | ❌ |
| Gerenciar compartilhamento | ✅ | ❌ | ❌ | ❌ |

### SOLID, DRY, KISS na prática
- **SRP** — `views` cuidam do fluxo HTTP; `serializers` da validação/representação;
  `permissions` das regras de acesso; integrações isoladas em módulos próprios.
- **DRY** — `ModelViewSet` + `DefaultRouter` do DRF eliminam boilerplate de CRUD;
  `update_or_create` no compartilhamento evita duplicar lógica de criar/atualizar.
- **KISS** — `User` padrão do Django, sem modelos ou camadas desnecessárias.

### Segurança por padrão
Toda a API exige autenticação por padrão (`IsAuthenticated`); endpoints públicos
(registro, login) liberam o acesso explicitamente. Senhas são armazenadas com
hash e passam pelos validadores do Django. O `queryset` de cada recurso é
filtrado pelo usuário autenticado, e o serializer de tarefas só aceita associar
categorias do próprio usuário.

### Performance
A listagem de tarefas usa `select_related("owner")` e
`prefetch_related` nos compartilhamentos para evitar consultas N+1.

## Endpoints principais

```
POST   /api/auth/register/         registro
POST   /api/auth/login/            login (JWT access + refresh)
POST   /api/auth/refresh/          renova o access token
GET    /api/auth/me/               usuário autenticado

GET    /api/categories/            lista (apenas as do usuário)
POST   /api/categories/            cria
PATCH  /api/categories/{id}/       edita
DELETE /api/categories/{id}/       remove

GET    /api/tasks/                 lista (próprias + compartilhadas)
                                   filtros: ?is_completed= &priority= &category=
                                   busca: ?search= · ordenação: ?ordering=
POST   /api/tasks/                 cria
PATCH  /api/tasks/{id}/            edita
DELETE /api/tasks/{id}/            remove (só dono)
POST   /api/tasks/{id}/toggle/     alterna concluída

GET    /api/tasks/{id}/shares/     lista compartilhamentos (só dono)
POST   /api/tasks/{id}/shares/     compartilha (body: username, permission)
DELETE /api/tasks/{id}/shares/{share_id}/   revoga (só dono)

GET    /api/integrations/holidays/?year=YYYY   feriados (BrasilAPI)

GET    /api/docs/                  Swagger UI
GET    /api/schema/                OpenAPI schema
```
