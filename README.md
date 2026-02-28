# frontendclientbt

Frontend client for PROJECTBT.

## Prerequisites

- Node.js 20+
- npm
- Backend running on `http://localhost:4000` (default)

## Start Backend (from monorepo root)

```bash
cd backendbt/docker
docker compose up --build
```

## Frontend Setup

```bash
cd frontendclientbt
npm install
```

## Run Frontend (dev)

```bash
cd frontendclientbt
npm run dev
```

Vite runs on `http://localhost:5173` by default and proxies `/api` to the backend.

## Backend URL Configuration

The dev proxy target is configurable with `VITE_BACKEND_URL`.

1. Create `.env` from `.env.example`:
```bash
cd frontendclientbt
copy .env.example .env
```
PowerShell alternative:
```powershell
Copy-Item .env.example .env
```

2. Adjust if needed:
```dotenv
VITE_BACKEND_URL=http://localhost:4000
```

## Build

```bash
cd frontendclientbt
npm run build
```
