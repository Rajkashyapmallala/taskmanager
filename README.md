# TaskFlow — Task Management System

A full-stack task management app built with **Node.js + TypeScript** (backend) and **Next.js 14 + TypeScript** (frontend).

---

## Project Structure

```
task-management/
├── backend/          # Node.js + Express + Prisma API
└── frontend/         # Next.js 14 App Router UI
```

---

## Backend Setup

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL 14+

### 1. Create the PostgreSQL database

Before running Prisma, create the database manually:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE taskflow;

# If using a non-default user, grant privileges
GRANT ALL PRIVILEGES ON DATABASE taskflow TO youruser;

# Exit
\q
```

### 2. Install dependencies
```bash
cd backend
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taskflow?schema=public"
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### 4. Initialize the database
```bash
npx prisma generate     # Generate Prisma client
npx prisma db push      # Create all tables in PostgreSQL
```

> For a tracked migration history instead of db push:
> ```bash
> npx prisma migrate dev --name init
> ```

### 5. Start the dev server
```bash
npm run dev
# Runs on http://localhost:4000
```

### Available Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled output |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Sync schema to DB (no migration) |
| `npm run db:migrate` | Run migrations with history |

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
```

`.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Start the dev server
```bash
npm run dev
# Runs on http://localhost:3000
```

---

## Database Schema

### Entity Relationship Overview

```
User ─────────────< Task
  └───────────────< RefreshToken
```

A `User` can have many `Task` records and many `RefreshToken` records.
Both `Task` and `RefreshToken` are cascade-deleted when their parent `User` is deleted.

---

### Table: `User`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, default uuid() | Unique user identifier |
| `email` | `VARCHAR` | UNIQUE, NOT NULL | User's email address |
| `name` | `VARCHAR` | NOT NULL | Display name |
| `password` | `VARCHAR` | NOT NULL | bcrypt hashed password |
| `createdAt` | `TIMESTAMP` | NOT NULL, default now() | Account creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, auto-updated | Last update time |

---

### Table: `Task`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK, default uuid() | Unique task identifier |
| `title` | `VARCHAR` | NOT NULL | Task title |
| `description` | `TEXT` | NULLABLE | Optional task details |
| `status` | `TaskStatus` | NOT NULL, default PENDING | Current task status |
| `priority` | `Priority` | NOT NULL, default MEDIUM | Task priority level |
| `dueDate` | `TIMESTAMP` | NULLABLE | Optional due date |
| `createdAt` | `TIMESTAMP` | NOT NULL, default now() | Task creation time |
| `updatedAt` | `TIMESTAMP` | NOT NULL, auto-updated | Last update time |
| `userId` | `UUID` | FK → User.id, CASCADE | Owner of the task |

---

### Table: `RefreshToken`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PK | Token record identifier (also used as JWT `tokenId` claim) |
| `token` | `VARCHAR` | UNIQUE, NOT NULL | The raw refresh token string |
| `userId` | `UUID` | FK → User.id, CASCADE | Token owner |
| `expiresAt` | `TIMESTAMP` | NOT NULL | Token expiry datetime |
| `createdAt` | `TIMESTAMP` | NOT NULL, default now() | Token issuance time |

---

### Enums

**`TaskStatus`**
| Value | Description |
|-------|-------------|
| `PENDING` | Task not yet started (default) |
| `IN_PROGRESS` | Task actively being worked on |
| `COMPLETED` | Task finished |

**`Priority`**
| Value | Description |
|-------|-------------|
| `LOW` | Low urgency |
| `MEDIUM` | Default priority |
| `HIGH` | High urgency |

---

### Relationships & Constraints

- `Task.userId` → `User.id` — **CASCADE DELETE**: deleting a user removes all their tasks
- `RefreshToken.userId` → `User.id` — **CASCADE DELETE**: deleting a user revokes all their refresh tokens
- `User.email` — **UNIQUE**: no two accounts can share the same email
- `RefreshToken.token` — **UNIQUE**: prevents duplicate token records

---

### Recommended Indexes

These are not created by default but should be added in production for query performance:

```sql
-- Speeds up GET /tasks which filters by userId + status and sorts by createdAt
CREATE INDEX idx_tasks_user_status ON "Task" ("userId", "status", "createdAt" DESC);

-- Speeds up title search
CREATE INDEX idx_tasks_title ON "Task" USING gin(to_tsvector('english', "title"));

-- Speeds up refresh token lookup on every token refresh
CREATE INDEX idx_refresh_token_userId ON "RefreshToken" ("userId");
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Create account | ❌ |
| POST | `/auth/login` | Sign in | ❌ |
| POST | `/auth/refresh` | Rotate tokens | ❌ |
| POST | `/auth/logout` | Invalidate refresh token | ❌ |

**Register / Login body:**
```json
{ "name": "Jane", "email": "jane@example.com", "password": "secret123" }
```

**Refresh body:**
```json
{ "refreshToken": "<token>" }
```

### Tasks (all require `Authorization: Bearer <accessToken>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (paginated, filterable) |
| POST | `/tasks` | Create a task |
| GET | `/tasks/:id` | Get one task |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |
| POST | `/tasks/:id/toggle` | Cycle status: Pending → In Progress → Completed → Pending |

**GET /tasks query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 50) |
| `status` | string | Filter: `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `search` | string | Search by title |

---

## Architecture

### Backend
```
src/
├── index.ts                   # Express app entry point
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   └── jwt.ts                 # Token generation & verification
├── middleware/
│   ├── auth.middleware.ts     # JWT access token guard
│   ├── validate.middleware.ts # express-validator error handler
│   └── error.middleware.ts    # Global error handler
├── controllers/
│   ├── auth.controller.ts     # register, login, refresh, logout
│   └── task.controller.ts     # CRUD + toggle
└── routes/
    ├── auth.routes.ts
    └── task.routes.ts
prisma/
└── schema.prisma              # User, Task, RefreshToken models
```

### Frontend
```
src/
├── app/
│   ├── layout.tsx             # Root layout with AuthProvider + Toaster
│   ├── globals.css            # Tailwind base styles
│   ├── page.tsx               # Redirect to /dashboard
│   ├── login/page.tsx         # Login form
│   ├── register/page.tsx      # Registration form
│   └── dashboard/page.tsx     # Main task dashboard
├── components/
│   ├── TaskCard.tsx           # Individual task card
│   ├── TaskModal.tsx          # Create / edit modal
│   ├── ConfirmDialog.tsx      # Delete confirmation
│   └── PaginationBar.tsx      # Pagination controls
├── context/
│   └── AuthContext.tsx        # Auth state + login/logout
├── lib/
│   └── api.ts                 # Axios instance with interceptors
└── types/
    └── index.ts               # Shared TypeScript types
```

---

## Security Features

- **Password hashing** — bcrypt with cost factor 12
- **JWT Access Token** — short-lived (15 min), sent in `Authorization` header
- **JWT Refresh Token** — long-lived (7 days), stored in DB; rotated on every use
- **Token rotation** — old refresh token is deleted when a new one is issued
- **Per-user data isolation** — all task queries are scoped to the authenticated user
- **Input validation** — express-validator on all request bodies

---

## Key Frontend Features

- ✅ Login & Registration pages with client-side validation
- ✅ Automatic token refresh on 401 (transparent to user)
- ✅ Task dashboard with responsive grid layout
- ✅ Create / Edit task modal with required due date
- ✅ Delete confirmation dialog
- ✅ Status toggle (click the circle on any task card)
- ✅ Filter by status (tab bar)
- ✅ Debounced search by title
- ✅ Pagination
- ✅ Toast notifications for all operations
- ✅ Fully responsive (mobile + desktop)
- ✅ Loading states & empty states

---

## Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/taskflow?schema=public"
JWT_ACCESS_SECRET="change-me-in-production"
JWT_REFRESH_SECRET="change-me-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```