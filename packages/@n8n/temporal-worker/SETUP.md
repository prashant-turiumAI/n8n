# Temporal Worker Setup

## Initial Setup

The red errors you're seeing are because dependencies haven't been installed yet. To fix:

### 1. Install Dependencies

From the n8n root directory, run:

```bash
pnpm install
```

This will install all dependencies including:
- `@temporalio/*` packages
- `@n8n/*` workspace packages
- `@types/node` for TypeScript

### 2. Build Dependencies

Some workspace packages need to be built first:

```bash
pnpm build --filter @n8n/config
pnpm build --filter @n8n/di
pnpm build --filter n8n-workflow
```

### 3. Build This Package

After dependencies are installed:

```bash
cd packages/@n8n/temporal-worker
pnpm build
```

## Current Status

✅ Package structure created
✅ TypeScript configuration set up
✅ Basic workflow skeleton implemented
✅ Worker initialization code ready
✅ Client code for starting workflows
✅ Docker Compose setup for Temporal server

## Next Steps

1. **Install dependencies** (see above)
2. **Start Temporal server**: `docker-compose -f docker/temporal/docker-compose.yml up -d`
3. **Configure environment variables** in root `.env`:
   ```
   N8N_TEMPORAL_ENABLED=true
   N8N_TEMPORAL_HOST=localhost:7233
   N8N_TEMPORAL_NAMESPACE=default
   N8N_TEMPORAL_TASK_QUEUE=n8n-workflows
   ```
4. **Implement workflow execution logic**
5. **Implement node activities**

## Notes

- Workflows use serializable types (not n8n types directly) for Temporal compatibility
- Activities can use full n8n types (they run outside the workflow context)
- Workflow bundling will need to be configured later for production builds
