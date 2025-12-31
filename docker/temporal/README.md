# Temporal Server Docker Compose Setup

This directory contains a Docker Compose configuration for running a self-hosted Temporal server for n8n workflow execution.

## Services

- **postgres**: PostgreSQL database for Temporal persistence
- **temporal**: Temporal server (gRPC on 7233, HTTP on 8088)
- **temporal-ui**: Temporal Web UI for monitoring and debugging (port 8080)

## Quick Start

1. Start the services:
```bash
cd docker/temporal
docker-compose up -d
```

2. Verify services are running:
```bash
docker-compose ps
```

3. Access Temporal UI:
- Open http://localhost:8080 in your browser

4. Stop the services:
```bash
docker-compose down
```

## Configuration

### Environment Variables

The Temporal server uses the following defaults:
- **Database**: PostgreSQL on port 5432
- **Temporal Server**: localhost:7233 (gRPC), localhost:8088 (HTTP)
- **Temporal UI**: localhost:8080
- **Namespace**: default

### n8n Configuration

To use this Temporal server with n8n, set these environment variables:

```bash
TEMPORAL_ENABLED=true
TEMPORAL_HOST=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=n8n-workflows
```

## Data Persistence

PostgreSQL data is persisted in a Docker volume `temporal-postgres-data`. To remove all data:

```bash
docker-compose down -v
```

## Verification Steps

### 1. Check Service Status
```bash
cd docker/temporal
docker-compose ps
```

**Expected**: All services should show `Up` status:
- `temporal-postgres`: Up (healthy)
- `temporal-server`: Up (health: starting) or Up (healthy)
- `temporal-ui`: Up

**Note**: Temporal server may take 30-60 seconds to fully start.

### 2. Check Service Logs
```bash
# Check Temporal server logs
docker-compose logs temporal | tail -20

# Check PostgreSQL logs
docker-compose logs postgres | tail -10

# Check all logs
docker-compose logs --tail=50
```

**Expected**: No errors; should show "Started Worker" and "Started physicalTaskQueueManager" messages.

### 3. Verify PostgreSQL Connection
```bash
docker-compose exec postgres pg_isready -U temporal
```

**Expected**: `postgres:5432 - accepting connections`

### 4. Access Temporal UI
Open in browser: **http://localhost:8080**

**Expected**: Temporal Web UI loads and shows the default namespace.

### 5. Verify Ports are Listening
```bash
# Check if ports are accessible
netstat -tuln | grep -E '(7233|8080|8088)' || ss -tuln | grep -E '(7233|8080|8088)'
```

**Expected**: Ports 7233, 8080, and 8088 should be listed as listening.

### 6. Test gRPC Connection (Optional)
```bash
# Wait for server to be fully ready (may take 1-2 minutes)
sleep 60
docker-compose exec temporal tctl cluster health
```

**Expected**: Should show cluster health status (may take time to become fully healthy).

## Troubleshooting

### If services don't start:
```bash
docker-compose down
docker-compose up -d
docker-compose logs
```

### If Temporal server keeps restarting:
1. Check logs: `docker-compose logs temporal`
2. Ensure PostgreSQL is healthy: `docker-compose ps`
3. Wait 1-2 minutes for full initialization
4. If issues persist, reset: `docker-compose down -v && docker-compose up -d`

### If ports are already in use:
Edit `docker-compose.yml` and change the port mappings:
```yaml
ports:
  - "7234:7233"  # Change Temporal gRPC port
  - "8089:8088"  # Change Temporal HTTP port
  - "8081:8080"  # Change Temporal UI port
```

### To reset everything:
```bash
docker-compose down -v  # Removes volumes too
docker-compose up -d
```

### Check specific service logs:
```bash
docker-compose logs temporal
docker-compose logs postgres
docker-compose logs temporal-ui
```

## Ports

- **5432**: PostgreSQL (internal only, not exposed to host by default)
- **7233**: Temporal gRPC API
- **8088**: Temporal HTTP API
- **8080**: Temporal Web UI

**Note**: PostgreSQL port is not exposed by default to avoid conflicts. If you need external access, uncomment the port mapping in `docker-compose.yml` and use port 5433 to avoid conflicts with existing PostgreSQL instances.

