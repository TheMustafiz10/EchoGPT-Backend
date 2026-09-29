# EchoGPT Backend

Production-ready REST API backend for the **EchoGPT Chrome Extension**, built with **NestJS 12**, **PostgreSQL**, **Prisma ORM**, and **Swagger (OpenAPI)**.

---

## Table of Contents

- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start (Local)](#-quick-start-local)
- [Docker Setup](#-docker-setup)
- [Environment Variables](#-environment-variables)
- [Database Migrations](#-database-migrations)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Testing the API](#-testing-the-api)
- [Available Scripts](#-available-scripts)
- [Security Notes](#-security-notes)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Node.js 22 LTS |
| **Framework** | NestJS 12 |
| **Database** | PostgreSQL 16 (Supabase or local) |
| **ORM** | Prisma 6 |
| **Authentication** | JWT (access + refresh tokens) with Passport |
| **API Docs** | Swagger / OpenAPI 3.0 |
| **Validation** | class-validator + Zod (env) |
| **Encryption** | AES-256-GCM (for AI provider API keys) |
| **Containerization** | Docker + Docker Compose |

---

## ✨ Features

### 1. Authentication
- User registration with email + password
- Login with JWT access tokens
- Refresh token rotation (secure session management)
- Password hashing with bcrypt (cost factor 12)
- Secure logout (per-session invalidation)
- Optional email verification flow (Not Implemented curently)

### 2. User Management
- View and update profile
- Change password with current-password verification
- Delete account (cascades to related data)
- Role-based access control (`USER`, `ADMIN`)

### 3. Subscription Management
- Free & Premium plans
- Subscription status and remaining requests
- Upgrade / downgrade
- Usage limits enforced per AI request

### 4. AI Provider Management
- Support for **OpenAI**, **Anthropic Claude**, **Google Gemini**
- Add / edit / delete providers
- Enable / disable providers
- Encrypted API key storage (AES-256-GCM)
- Default provider selection
- Health check endpoint

### 5. Chat API
- Send prompts and receive AI responses
- Provider selection (per-request or default)
- Conversation history with pagination
- **Streaming responses** via Server-Sent Events (SSE)

### 6. Web Search API
- Search query endpoint
- Search history and recent searches
- Search suggestions
- 24-hour result caching

### 7. Admin Panel APIs
- Dashboard statistics
- User management (list, view, update role, delete)
- Subscription management (list, update plan, reset usage)
- AI provider management (inherits from `/providers`)
- API usage analytics
- Request logs
- System health

---

## Prerequisites

Before one begin, ensure one should have:

- **Node.js 20+** (22 LTS recommended) — [Download](https://nodejs.org/)
- **npm 10+** (bundled with Node)
- **PostgreSQL 16+** — either:
  - A [Supabase](https://supabase.com) account (free tier works), or
  - A local Postgres install, or
  - Docker (no manual Postgres install needed)
- **Git**

Verify your environment:

```bash
node -v      # v20.x.x or v22.x.x
npm -v       # 10.x.x
git --version
```

---

## Quick Start (Local)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/echogpt-backend.git
cd echogpt-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` and fill in the required values. See [Environment Variables](#-environment-variables) for details.

**Generate secrets** (run twice for two different values):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set up the database

If using **Supabase**:
- Create a project at [supabase.com](https://supabase.com)
- Copy the **Session Pooler** connection string
- Paste it into `DATABASE_URL` in your `.env`

If using **local Postgres**:
- Create a database: `createdb echogpt`
- Set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/echogpt?schema=public"`

### 5. Generate Prisma Client and run migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Start the development server

```bash
npm run start:dev
```

One should see:

```
[Nest] ... LOG [NestApplication] Nest application successfully started
[Nest] ... LOG [Bootstrap] Application is running on: http://localhost:3000
[Nest] ... LOG [Bootstrap] Swagger docs available at: http://localhost:3000/api
```

### 7. Open Swagger UI

Navigate to [http://localhost:3000/api](http://localhost:3000/api) in your browser.

---

## Docker Setup

Docker runs in the app + Postgres in isolated containers — no manual installation needed.

### Prerequisites

Install **Docker Desktop**:
- **Windows / macOS:** [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
- **Linux:** `sudo apt install docker.io docker-compose-plugin`

Verify:

```bash
docker --version
docker compose version
```

### Run with Docker Compose

From the project root:

```bash
docker compose up --build
```

**What happens:**
1. Builds the NestJS app image (installs deps, generates Prisma client, compiles TypeScript)
2. Starts a Postgres 16 container
3. Waits for Postgres healthcheck to pass
4. Runs `prisma migrate deploy` inside the API container
5. Boots NestJS on port 3000

**Access the API:**
- Swagger UI: [http://localhost:3000/api](http://localhost:3000/api)
- Postgres: `localhost:5432` (user: `postgres`, password: `postgres`, db: `echogpt`)

### Common Docker Commands

```bash
# Start in background
docker compose up -d

# View live logs
docker compose logs -f api

# Stop everything (keeps database)
docker compose down

# Stop and delete the database volume
docker compose down -v

# Rebuild after code changes
docker compose up --build

# Open a shell inside the API container
docker compose exec api sh

# Run Prisma Studio against the containerized DB
docker compose exec api npx prisma studio
```

### Docker Files

| File | Purpose |
| :--- | :--- |
| `Dockerfile` | Two-stage build: compiles TypeScript → ships slim runtime |
| `docker-compose.yml` | Orchestrates the API + Postgres containers |
| `.dockerignore` | Excludes `node_modules`, `.env`, `.git` from the build |

### Important Note

Docker Compose overrides `DATABASE_URL` to point at the **containerized Postgres** (see the `environment:` block in `docker-compose.yml`). Your `.env` Supabase URL is ignored inside the container.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Description | Example |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/echogpt?schema=public` |
| `JWT_ACCESS_SECRET` | ✅ | Random 64-char hex — signs access tokens | `<64-char hex>` |
| `JWT_REFRESH_SECRET` | ✅ | Random 64-char hex (different) — signs refresh tokens | `<64-char hex>` |
| `JWT_ACCESS_EXPIRATION` | ✅ | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRATION` | ✅ | Refresh token lifetime | `7d` |
| `ENCRYPTION_KEY` | ✅ | 64-char hex — encrypts AI provider API keys | `<64-char hex>` |
| `PORT` | ✅ | HTTP port | `3000` |
| `CORS_ORIGIN` | ✅ | Allowed Chrome extension origin | `chrome-extension://abc123` |
| `SERPAPI_API_KEY` | ⬜ | Optional — real web search | `abc123...` |
| `SMTP_HOST` | ⬜ | Optional — email verification | `smtp.gmail.com` |
| `SMTP_PORT` | ⬜ | Optional | `587` |
| `SMTP_USER` | ⬜ | Optional | `you@gmail.com` |
| `SMTP_PASS` | ⬜ | Optional — Gmail App Password | `abcd efgh ijkl mnop` |
| `APP_URL` | ⬜ | Optional — used in emails | `http://localhost:3000` |

**Generate secrets:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it **twice** to get two different values for the two JWT secrets, and a third time for `ENCRYPTION_KEY`.

⚠️ **Never commit `.env` to Git.** It's already in `.gitignore`.

---

## 🗄 Database Migrations

Migration files live in `prisma/migrations/`. They are the source of truth for the database schema.

### Apply existing migrations

```bash
npx prisma migrate dev
```

### Create a new migration after editing `schema.prisma`

```bash
npx prisma migrate dev --name add_your_change
```

### Apply migrations in production (Docker runs this automatically)

```bash
npx prisma migrate deploy
```

### Reset the database (⚠️ deletes all data)

```bash
npx prisma migrate reset
```

### Browse the database visually

```bash
npx prisma studio
```

Opens at [http://localhost:5555](http://localhost:5555).

---

## 📚 API Documentation

Swagger UI is auto-generated from your controllers and DTOs.

### While the server is running

- **Interactive Swagger UI:** [http://localhost:3000/api](http://localhost:3000/api)
- **Raw OpenAPI JSON:** [http://localhost:3000/api-json](http://localhost:3000/api-json)
- **Raw OpenAPI YAML:** [http://localhost:3000/api-yaml](http://localhost:3000/api-yaml)

### Export the OpenAPI spec (for submission)

```bash
mkdir -p docs
curl http://localhost:3000/api-json > docs/openapi.json
```

### API Tag Overview

| Tag | Purpose |
| :--- | :--- |
| `root` | Health check |
| `auth` | Register, login, refresh, logout |
| `users` | Profile, password, delete account |
| `subscription` | Status, remaining, upgrade, downgrade |
| `providers` | AI provider CRUD (admin-only) |
| `chat` | Prompt, history, streaming (SSE) |
| `search` | Query, history, recent, suggestions |
| `admin` | Dashboard, users, subscriptions, analytics, logs, health |

### Authentication in Swagger

1. Call `POST /auth/register` or `POST /auth/login`
2. Copy the `accessToken` from the response
3. Click **🔒 Authorize** at the top-right of Swagger
4. Paste the token → **Authorize** → **Close**
5. All 🔒 endpoints now include the token automatically

---

## 📁 Project Structure

```
echogpt-backend/
├── .dockerignore                    # Docker build exclusions
├── .env                             # Local secrets (gitignored)
├── .env.example                     # Env template (committed)
├── .gitignore
├── .prettierrc
├── Dockerfile                       # Multi-stage production build
├── docker-compose.yml               # API + Postgres orchestration
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── README.md
│
├── docs/
│   └── openapi.json                 # Exported OpenAPI spec (optional)
│
├── prisma/
│   ├── schema.prisma                # Data model
│   └── migrations/                  # SQL migration history
│       ├── 20260929120000_init/
│       │   └── migration.sql
│       └── migration_lock.toml
│
└── src/
    ├── main.ts                      # Bootstrap: helmet, CORS, pipes, Swagger
    ├── app.module.ts                # Root module
    ├── app.controller.ts            # Health check
    ├── app.service.ts
    │
    ├── common/                      # Cross-cutting concerns
    │   ├── decorators/
    │   │   ├── current-user.decorator.ts
    │   │   └── roles.decorator.ts
    │   ├── filters/
    │   │   └── all-exceptions.filter.ts
    │   ├── guards/
    │   │   └── roles.guard.ts
    │   ├── interceptors/
    │   │   └── transform.interceptor.ts
    │   ├── dto/
    │   │   ├── pagination.dto.ts
    │   │   └── api-response.dto.ts
    │   └── utils/
    │       └── encryption.util.ts   # AES-256-GCM encrypt/decrypt
    │
    ├── config/
    │   └── env.validation.ts        # Zod schema for env vars
    │
    ├── prisma/
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    │
    ├── auth/
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── mail.service.ts          # (if email verification enabled)
    │   ├── dto/
    │   │   ├── register.dto.ts
    │   │   ├── login.dto.ts
    │   │   └── refresh-token.dto.ts
    │   ├── guards/
    │   │   ├── jwt-auth.guard.ts
    │   │   └── jwt-refresh.guard.ts
    │   └── strategies/
    │       ├── jwt.strategy.ts
    │       └── jwt-refresh.strategy.ts
    │
    ├── users/
    │   ├── users.module.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── dto/
    │       ├── update-profile.dto.ts
    │       └── change-password.dto.ts
    │
    ├── subscription/
    │   ├── subscription.module.ts
    │   ├── subscription.controller.ts
    │   └── subscription.service.ts
    │
    ├── providers/
    │   ├── providers.module.ts
    │   ├── providers.controller.ts
    │   ├── providers.service.ts
    │   └── dto/
    │       └── create-provider.dto.ts
    │
    ├── chat/
    │   ├── chat.module.ts
    │   ├── chat.controller.ts
    │   ├── chat.service.ts
    │   └── dto/
    │       └── send-prompt.dto.ts
    │
    ├── search/
    │   ├── search.module.ts
    │   ├── search.controller.ts
    │   ├── search.service.ts
    │   └── dto/
    │       └── search-query.dto.ts
    │
    ├── admin/
    │   ├── admin.module.ts
    │   ├── admin.controller.ts
    │   ├── admin.service.ts
    │   └── dto/
    │       ├── update-user-role.dto.ts
    │       └── update-subscription.dto.ts
    │
    └── usage/
        ├── usage.module.ts
        ├── usage.service.ts
        └── usage.interceptor.ts     # Logs every API request
```

---

## 🧪 Testing the API

### Step 1 — Register a user

In Swagger, `POST /auth/register`:

```json
{
  "email": "you@example.com",
  "password": "SecurePass123!",
  "name": "Your Name"
}
```

Copy the `accessToken` from the response.

### Step 2 — Authorize Swagger

Click **🔒 Authorize** → paste the token → **Authorize**.

### Step 3 — Promote yourself to ADMIN

Open Prisma Studio:

```bash
npx prisma studio
```

Find your user in the `User` table → change `role` from `USER` to `ADMIN` → Save.

Then **log in again** (`POST /auth/login`) and re-authorize with the new token — the ADMIN role is baked into the JWT.

### Step 4 — Add an AI provider

`POST /providers` (admin only):

```json
{
  "name": "OpenAI GPT-4o Mini",
  "providerType": "openai",
  "apiKey": "sk-proj-your-real-key",
  "isDefault": true
}
```

Get a real key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

### Step 5 — Chat

`POST /chat/prompt`:

```json
{ "prompt": "What is the capital of France?" }
```

### Step 6 — Test streaming

```bash
curl -N "http://localhost:3000/chat/stream?prompt=Hello&token=YOUR_ACCESS_TOKEN"
```

### Step 7 — Test web search

`POST /search/query`:

```json
{ "query": "nestjs" }
```

Run it twice — the second response will have `"cached": true`.

### Step 8 — Admin panel

- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/analytics/usage`
- `GET /admin/logs`
- `GET /admin/health`

---

## 📜 Available Scripts

| Script | Purpose |
| :--- | :--- |
| `npm run start` | Start the server (one-shot) |
| `npm run start:dev` | Start with hot reload (development) |
| `npm run start:prod` | Run compiled `dist/` (production) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Create + apply a migration |
| `npm run prisma:studio` | Open Prisma Studio |

---

## 🔒 Security Notes

This project implements several security best practices:

| Area | Implementation |
| :--- | :--- |
| **Password storage** | bcrypt with cost factor 12 |
| **Token signing** | Separate secrets for access & refresh tokens |
| **Refresh token rotation** | Old token invalidated on each refresh |
| **Session revocation** | Refresh tokens stored in DB; logout deletes them |
| **API key encryption** | AES-256-GCM with `ENCRYPTION_KEY` |
| **Input validation** | Global `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` |
| **Rate limiting** | Global `ThrottlerGuard` (100 req / 60s) |
| **Security headers** | Helmet with CSP |
| **CORS** | Restricted to `CORS_ORIGIN` |
| **Env validation** | Zod schema — server refuses to boot with invalid config |
| **Non-root Docker user** | Container runs as `nestjs` (uid 1001) |

**For production:**
- Rotate `JWT_*_SECRET` and `ENCRYPTION_KEY` periodically
- Use a secrets manager (AWS Secrets Manager, Vault) instead of `.env` files
- Add HTTPS termination (via reverse proxy or your host's load balancer)
- Enable database backups on Supabase
- Set up log aggregation and monitoring

---

## 🐛 Troubleshooting

| Symptom | Cause | Fix |
| :--- | :--- | :--- |
| `@prisma/client did not initialize yet` | Prisma Client not generated | `npx prisma generate` |
| `P1000: Authentication failed` | Wrong DB password / unencoded chars | URL-encode special chars in `DATABASE_URL` |
| `P1001: Can't reach database server` | DB down / wrong host | Check Supabase status or start local Postgres |
| `P3005: The database schema is not empty` | Existing tables | `npx prisma migrate reset` (⚠️ deletes data) |
| `Joi.string is not a function` | Old Joi-based env validation | Switch to Zod schema in `config/env.validation.ts` |
| `No command registered for 'generate'` | `npx` pulled Prisma 8 RC | `npx prisma@6 generate` or install `prisma@^6` locally |
| `401 Unauthorized` on protected endpoints | Missing / expired token | Re-login, re-authorize in Swagger |
| `403 Forbidden` on `/admin/*` | Not an ADMIN | Promote via Prisma Studio, then re-login |
| `502 AI provider error` | Invalid provider API key | Verify key with `curl` before adding |
| `docker: command not found` | Docker Desktop not installed | [Install Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| `Cannot connect to the Docker daemon` | Docker Desktop not running | Launch Docker Desktop, wait for whale icon |
| `CORS error` in browser | Origin not allowed | Add your extension origin to `CORS_ORIGIN` |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Supabase](https://supabase.com/)
- [Swagger / OpenAPI](https://swagger.io/)

---

**Built for the EchoGPT Chrome Extension.**
