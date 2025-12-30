# Temporal Server Setup

This directory contains the Docker Compose configuration for running a self-hosted Temporal server for n8n workflow execution.

## Prerequisites

- Docker and Docker Compose installed
- Ports available: 7233 (Temporal), 8080 (Temporal UI), 5432 (PostgreSQL, internal), 9200 (Elasticsearch, internal)

## Usage

### Start Temporal Server

```bash
cd docker/temporal
docker-compose up -d
```

Or from the n8n root:

```bash
docker-compose -f docker/temporal/docker-compose.yml up -d
```

### Stop Temporal Server

```bash
docker-compose -f docker/temporal/docker-compose.yml down
```

### View Logs

```bash
docker-compose -f docker/temporal/docker-compose.yml logs -f
```

## Services

- **temporal**: Temporal server (port 7233)
- **temporal-ui**: Temporal Web UI (port 8080)
- **postgresql**: PostgreSQL database for Temporal persistence
- **elasticsearch**: Elasticsearch for Temporal visibility
- **temporal-admin-tools**: Administrative tools container

## Configuration

Default configuration uses:
- PostgreSQL for persistence
- Elasticsearch for visibility/search
- Development configuration settings

For production, consider:
- Using external PostgreSQL and Elasticsearch instances
- Adjusting resource limits
- Setting up proper authentication
- Using Temporal Cloud instead of self-hosted

## Access

- Temporal Server: `localhost:7233`
- Temporal UI: `http://localhost:8080`

## Environment Variables

You can override image versions using environment variables:

```bash
export TEMPORAL_VERSION=1.24.0
export POSTGRESQL_VERSION=16
export ELASTICSEARCH_VERSION=8.11.0
export TEMPORAL_UI_VERSION=2.23.0
export TEMPORAL_ADMINTOOLS_VERSION=1.24.0
```

## n8n Configuration

After starting Temporal, configure n8n with:

```env
N8N_TEMPORAL_ENABLED=true
N8N_TEMPORAL_HOST=localhost:7233
N8N_TEMPORAL_NAMESPACE=default
N8N_TEMPORAL_TASK_QUEUE=n8n-workflows
```
