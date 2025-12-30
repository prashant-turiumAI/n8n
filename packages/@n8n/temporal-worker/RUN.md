# How to Run the Temporal Worker

## Prerequisites

1. **Install dependencies** (from n8n root):
   ```bash
   cd n8n
   pnpm install
   ```

2. **Start Temporal Server** (required before running worker):
   ```bash
   # From n8n root
   docker-compose -f docker/temporal/docker-compose.yml up -d
   
   # Verify it's running
   docker-compose -f docker/temporal/docker-compose.yml ps
   ```

3. **Configure environment variables** (create/update `.env` in n8n root):
   ```env
   N8N_TEMPORAL_ENABLED=true
   N8N_TEMPORAL_HOST=localhost:7233
   N8N_TEMPORAL_NAMESPACE=default
   N8N_TEMPORAL_TASK_QUEUE=n8n-workflows
   ```

## Running the Worker

### Option 1: Development Mode (Build + Run)

```bash
cd packages/@n8n/temporal-worker
pnpm dev
```

This will:
1. Build the TypeScript code
2. Start the worker

### Option 2: Build Then Run Separately

```bash
cd packages/@n8n/temporal-worker

# Build
pnpm build

# Run
pnpm start
```

### Option 3: Watch Mode (Auto-rebuild on changes)

```bash
cd packages/@n8n/temporal-worker
pnpm watch
```

Then in another terminal:
```bash
cd packages/@n8n/temporal-worker
node dist/start.js
```

## Verify It's Working

1. **Check worker logs** - You should see:
   ```
   Temporal worker started on task queue: n8n-workflows
   ```

2. **Check Temporal UI** - Open http://localhost:8080
   - You should see the worker registered
   - Task queue: `n8n-workflows`

3. **Check Temporal server logs**:
   ```bash
   docker-compose -f docker/temporal/docker-compose.yml logs -f temporal
   ```

## Troubleshooting

### Worker won't start
- ✅ Ensure Temporal server is running: `docker ps | grep temporal`
- ✅ Check environment variables are set correctly
- ✅ Verify port 7233 is accessible: `telnet localhost 7233`

### "Cannot connect to Temporal"
- Check `N8N_TEMPORAL_HOST` matches the server address
- Verify Temporal server is up: `docker-compose -f docker/temporal/docker-compose.yml ps`

### Build errors
- Run `pnpm install` from n8n root first
- Build dependencies: `pnpm build --filter @n8n/config --filter @n8n/di`

## Stopping

- **Stop worker**: `Ctrl+C` in the terminal
- **Stop Temporal server**: `docker-compose -f docker/temporal/docker-compose.yml down`
