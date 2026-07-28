# ProjectBT Customer

React/Vite customer application for ProjectBT.

## Prerequisites

- Node.js 20+
- npm
- Backend running on `http://localhost:5000` (default)

## Start the API (from the ProjectBT root)

```bash
docker compose -f docker-compose.yml -f compose.local.yaml up -d db
cd services/api
npm run start:dev
```

## Frontend Setup

```bash
cd apps/customer
npm install
```

## Run Frontend (dev)

```bash
cd apps/customer
npm run dev
```

Vite runs on `http://localhost:5173` by default and proxies `/api` to the backend.

## Backend URL Configuration

The frontend API origin is configurable with `VITE_API_URL`.

1. Create `.env` from `.env.example`:
```bash
cd apps/customer
copy .env.example .env
```
PowerShell alternative:
```powershell
Copy-Item .env.example .env
```

2. Adjust if needed:
```dotenv
VITE_API_URL=http://localhost:5000
```

## Build

```bash
cd apps/customer
npm run build
```
