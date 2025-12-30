# @n8n/temporal-worker

Temporal worker package for executing n8n workflows using Temporal's durable execution engine.

## Overview

This package provides a Temporal worker that executes n8n workflows reliably with automatic retries, state persistence, and real-time monitoring capabilities.

## Architecture

The package consists of:

- **Worker**: Connects to Temporal server and executes workflows
- **Workflows**: Temporal workflow definitions that orchestrate n8n workflow execution
- **Activities**: Node activity implementations (HTTP, Code, Set, etc.)
- **Client**: Temporal client for starting workflows from n8n backend

## Configuration

Configure via environment variables (in root `.env` file):

```env
N8N_TEMPORAL_ENABLED=true
N8N_TEMPORAL_HOST=localhost:7233
N8N_TEMPORAL_NAMESPACE=default
N8N_TEMPORAL_TASK_QUEUE=n8n-workflows
N8N_TEMPORAL_WORKER_CREDENTIAL_SECRET=your-secret-here
```

## Usage

### Starting the Worker

```bash
cd packages/@n8n/temporal-worker
pnpm start
```

Or from the worker package:

```bash
node dist/start.js
```

### Starting Workflows (from n8n backend)

```typescript
import { startWorkflowExecution } from '@n8n/temporal-worker';

const workflowId = await startWorkflowExecution({
  nodes: workflowNodes,
  connections: workflowConnections,
  pinData: initialData,
});
```

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm watch

# Type check
pnpm typecheck

# Test
pnpm test
```

## Status

⚠️ **Work in Progress**: This package is currently under development. Core structure is in place, but workflow execution logic and node activities are still being implemented.

## Related

- Temporal Server setup: `docker/temporal/`
- Configuration: `packages/@n8n/config/src/configs/temporal.config.ts`
