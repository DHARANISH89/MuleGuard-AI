# Docker Setup & Full Stack Connection

The frontend and backend applications are now fully containerized and connected smoothly via Docker Compose!

## Changes Made
- Confirmed that the React app already points to `process.env.REACT_APP_API_URL` which defaults correctly to `http://localhost:8000`.
- Confirmed that the FastAPI app defines CORS correctly for `http://localhost:3000`.
- Added [backend/Dockerfile](file:///d:/code/PW-RIFT/MG/backend/Dockerfile) to build the FastAPI environment (`python:3.10-slim`).
- Added [backend/.dockerignore](file:///d:/code/PW-RIFT/MG/backend/.dockerignore) to prevent huge context copy overheads.
- Added [frontend/Dockerfile](file:///d:/code/PW-RIFT/MG/frontend/Dockerfile) to build the React environment (`node:18-alpine`).
- Added [frontend/.dockerignore](file:///d:/code/PW-RIFT/MG/frontend/.dockerignore) to prevent copying local `node_modules`.
- Added [docker-compose.yml](file:///d:/code/PW-RIFT/MG/docker-compose.yml) in the root to orchestrate them both simultaneously.

## Testing & Validation
I successfully ran:
```sh
docker compose build
docker compose up -d
```
Both containers spun up correctly.
- **Backend**: `http://localhost:8000/` running Uvicorn with module `app.main:app`.
- **Frontend**: `http://localhost:3000/` running React development server.

All backend missing `app` module pathing errors were resolved so the environment completely initializes.

## How to Run it Yourself

Open a terminal in `d:\code\PW-RIFT\MG` and execute:
```sh
docker compose up -d
```
Then navigate to `http://localhost:3000` to see the Mule Guard AI application! Wait approximately 5 seconds if you don't immediately see the UI, since the React development server may still be bundling in the background.
