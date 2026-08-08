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

| Method | Path | Query params | Description |
|--------|------|--------------|-------------|
| `GET` | `/customers/:id/policies` | `status` (optional) | List policies for a customer, optionally filtered by status (`pending`, `active`, `expired`, `cancelled`) |

Example:

```
GET /customers/some-uuid/policies?status=active
```

## Agent workflow

This repo uses GitHub Copilot with a set of agent skills for structured development work (grilling, TDD, code review, etc.). See [AGENTS.md](AGENTS.md) for the entry point.

## Notes

- **Domain language** — terms like Customer, Policy, PolicyStatus are defined in [CONTEXT.md](CONTEXT.md).
- **Architecture decisions** — recorded in [docs/adr/](docs/adr/). The key one is [TPT inheritance for policies](docs/adr/0001-tpt-policy-inheritance.md).
- **Environment** — all env vars have defaults matching `.env.example`; `synchronize: true` is on in non-production so schema changes apply automatically.
