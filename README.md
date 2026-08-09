# insurance-web

A pet project for exploring **NestJS** and **PostgreSQL Row-Level Security (RLS)**. The domain — commercial insurance customers and policies — is chosen as a realistic scaffold rather than for its own sake. RLS enforcement is the next feature to add; what exists today is the NestJS + TypeORM baseline it will be layered onto.

## Prerequisites

- Node.js 22+
- Docker (for Postgres)

## Quick start

```bash
cp .env.example .env
docker compose up -d
npm install
npm run start:dev
```

Populate the database with sample data (3 customers, 7 policies):

```bash
npm run seed
```

The API is available at `http://localhost:3000`.

## API

| Method | Path | Query params | Auth | Description |
|--------|------|--------------|------|-------------|
| `POST` | `/auth/token` | — | — | (Mock) Issue a JWT with `sub`, `customers`, and `policy_types` claims (enabled via `MOCK_AUTH_ENABLED=true`) |
| `GET` | `/policies` | `customer_id`, `type`, `status` (all optional) | Bearer JWT | List policies, optionally filtered by customer, type (`health`, `property`, `auto`), or status (`pending`, `active`, `expired`, `cancelled`) |

Example:

```
GET /policies?customer_id=some-uuid&status=active
Authorization: Bearer <token>
```

## Agent workflow

This repo uses GitHub Copilot with a set of agent skills for structured development work (grilling, TDD, code review, etc.). See [AGENTS.md](AGENTS.md) for the entry point.

## Notes

- **Domain language** — terms like Customer, Policy, PolicyStatus are defined in [CONTEXT.md](CONTEXT.md).
- **Architecture decisions** — recorded in [docs/adr/](docs/adr/). The key one is [TPT inheritance for policies](docs/adr/0001-tpt-policy-inheritance.md).
- **Environment** — all env vars have defaults matching `.env.example`; `synchronize: true` is on in non-production so schema changes apply automatically.
