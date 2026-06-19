# Metam Services Frontend

React/Vite frontend for the existing Metam Services backend.

The backend remains the source of truth. The frontend does not use mock data; screens call the FastAPI APIs directly.

## Stack

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- React Query
- Axios
- Recharts
- shadcn-style local UI components

## Environment

Copy `.env.example` to `.env` when running locally:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Run Locally

Start the backend first:

```bash
cd ..
uvicorn app.main:app --reload --port 8000
```

Then start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

## Build

```bash
npm run build
```

## Docker

Build:

```bash
docker build \
  -t vinodreddy1999/manufacturing-operations-platform-frontend:latest \
  -t vinodreddy1999/manufacturing-operations-platform-frontend:0.1.0 \
  .
```

Run:

```bash
docker run -p 8080:8080 vinodreddy1999/manufacturing-operations-platform-frontend:latest
```

Open:

```text
http://127.0.0.1:8080
```

By default, the Docker image points the browser app at:

```text
http://127.0.0.1:8000
```

Override it if your backend is hosted elsewhere:

```bash
docker build --build-arg VITE_API_BASE_URL=https://your-api-host -t vinodreddy1999/manufacturing-operations-platform-frontend:latest .
```

Push tags:

```bash
docker push vinodreddy1999/manufacturing-operations-platform-frontend:latest
docker push vinodreddy1999/manufacturing-operations-platform-frontend:0.1.0
```
