# Docker Setup

This document describes how to run the Instructor App using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose v2.0+

## Quick Start

### Production Mode

Run both backend and frontend in production mode:

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000

### Development Mode

Run with hot reload enabled for both frontend and backend:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Or in detached mode
docker-compose -f docker-compose.dev.yml up -d
```

Development mode features:
- Frontend hot reload (changes reflected immediately)
- Backend volume mounts for code changes
- Faster iteration cycles

## Environment Variables

Create a `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key
```

Or set them when running:

```bash
OPENAI_API_KEY=your_key docker-compose up
```

## Service Details

### Backend Service

- **Port**: 8000
- **Image**: Built from root Dockerfile
- **Volumes**: 
  - `./src:/app/src` - Source code (hot reload)
  - `./main.py:/app/main.py` - Entry point

### Frontend Service

- **Port**: 3000
- **Image**: Built from frontend/Dockerfile (production) or node:20-alpine (dev)
- **Environment**:
  - `NEXT_PUBLIC_API_URL` - Backend API URL

## Common Commands

### View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Stop services

```bash
docker-compose down

# Remove volumes as well
docker-compose down -v
```

### Rebuild services

```bash
# Rebuild all
docker-compose build

# Rebuild specific service
docker-compose build frontend
```

### Access container shell

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh
```

## Troubleshooting

### Port already in use

If ports 3000 or 8000 are already in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Map to different host port
```

### Frontend can't connect to backend

Ensure the `NEXT_PUBLIC_API_URL` environment variable is set correctly:
- For production: Use the external URL where backend is accessible
- For development: Use `http://localhost:8000`

### Build failures

Clear Docker cache and rebuild:

```bash
docker-compose build --no-cache
```

## Production Deployment

For production deployment:

1. Set environment variables properly
2. Use production docker-compose:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```
3. Set up reverse proxy (nginx/traefik) for proper routing
4. Configure SSL certificates
5. Set up health checks and monitoring

## Storage

User preferences and data are stored in browser localStorage (frontend). No persistent volumes needed for application data.

## Health Checks

Backend health endpoint: `http://localhost:8000/health`

Check with:
```bash
curl http://localhost:8000/health
```
