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

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — the defaults work for local SQLite development
```

### 3. Initialize the database
```bash
npx prisma generate     # Generate Prisma client
npx prisma db push      # Create SQLite database + tables
```

### 4. Start the dev server
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
| `npm run db:push` | Sync schema to DB |
| `npm run db:migrate` | Run migrations |

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
# NEXT_PUBLIC_API_URL=http://localhost:4000  (default)
```

### 3. Start the dev server
```bash
npm run dev
# Runs on http://localhost:3000
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
| POST | `/tasks/:id/toggle` | Cycle status (Pending → In Progress → Completed → Pending) |

**GET /tasks query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10, max: 50) |
| `status` | string | Filter: `PENDING`, `IN_PROGRESS`, `COMPLETED` |
| `search` | string | Search by title |

**Create / Update task body:**
```json
{
  "title": "Write unit tests",
  "description": "Cover auth and task routes",
  "priority": "HIGH",
  "dueDate": "2024-12-31"
}
```

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
- ✅ Task dashboard with grid layout
- ✅ Create / Edit task modal
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
```
DATABASE_URL="file:./dev.db"
JWT_ACCESS_SECRET="change-me-in-production"
JWT_REFRESH_SECRET="change-me-in-production"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4000
CORS_ORIGIN="http://localhost:3000"
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```
