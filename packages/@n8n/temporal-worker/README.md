# @n8n/temporal-worker

Temporal worker for executing n8n workflows using Temporal's distributed workflow engine.

## Overview

This package provides a Temporal worker that executes n8n workflows. It handles:
- Workflow orchestration
- Node execution via activities
- Credential resolution
- Error handling and retries

## Prerequisites

- Temporal server running (see `docker/temporal/docker-compose.yml`)
- Node.js 20+
- n8n backend configured with Temporal support

## Configuration

Set the following environment variables:

```bash
# Enable Temporal
TEMPORAL_ENABLED=true

# Temporal server connection
TEMPORAL_HOST=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=n8n-workflows

# Worker credential secret (must match n8n backend)
TEMPORAL_WORKER_CREDENTIAL_SECRET=your-secret-key

# Optional: TLS configuration
TEMPORAL_TLS_ENABLED=false
TEMPORAL_TLS_CERT_PATH=/path/to/cert.pem
TEMPORAL_TLS_KEY_PATH=/path/to/key.pem
```

## Running the Worker

### Development

```bash
# Build the package
pnpm build

# Start the worker
TEMPORAL_ENABLED=true \
TEMPORAL_WORKER_CREDENTIAL_SECRET=your-secret \
pnpm start
```

### Production

```bash
# Build the package
pnpm build

# Start the worker with environment variables
TEMPORAL_ENABLED=true \
TEMPORAL_HOST=temporal-server:7233 \
TEMPORAL_NAMESPACE=production \
TEMPORAL_TASK_QUEUE=n8n-workflows \
TEMPORAL_WORKER_CREDENTIAL_SECRET=your-secret \
node dist/start.js
```

## Architecture

### Worker (`worker.ts`)

The `createWorker()` function creates a Temporal worker instance that:
- Connects to the Temporal server
- Registers workflows and activities
- Processes workflow tasks from the task queue

### Entry Point (`start.ts`)

The `start.ts` file is the main entry point that:
- Loads configuration from environment variables
- Creates and starts the worker
- Handles graceful shutdown on SIGTERM/SIGINT

### Activities

- **`executeNode`**: Executes individual n8n nodes
- **`resolveCredential`**: Resolves credentials from n8n API

### Workflows

- **`n8nWorkflowExecution`**: Main workflow that orchestrates n8n workflow execution

## Signal Handling

The worker handles SIGTERM and SIGINT signals for graceful shutdown:
- Waits up to 10 seconds for in-flight tasks to complete
- Shuts down the worker cleanly
- Exits the process

## TLS Support

To enable TLS connections:

1. Set `TEMPORAL_TLS_ENABLED=true`
2. Provide certificate and key paths:
   - `TEMPORAL_TLS_CERT_PATH=/path/to/cert.pem`
   - `TEMPORAL_TLS_KEY_PATH=/path/to/key.pem`

The worker will automatically load and use these certificates for secure connections.

## Troubleshooting

### Worker fails to start

- Check that `TEMPORAL_ENABLED=true` is set
- Verify Temporal server is running and accessible
- Check network connectivity to Temporal server
- Verify `TEMPORAL_WORKER_CREDENTIAL_SECRET` matches n8n backend

### Worker can't connect to Temporal

- Verify `TEMPORAL_HOST` is correct
- Check firewall rules
- Verify Temporal server is running: `tctl cluster health`

### TLS connection errors

- Verify certificate and key files exist and are readable
- Check certificate validity
- Ensure `TEMPORAL_TLS_ENABLED=true` is set

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Linting

```bash
pnpm lint
```

## Related Documentation

- [Temporal Implementation Plan](../../TEMPORAL_IMPLEMENTATION_PLAN.md)
- [Credential Resolution Flow](../../CREDENTIAL_RESOLUTION_FLOW.md)
- [Docker Compose Setup](../../docker/temporal/README.md)

