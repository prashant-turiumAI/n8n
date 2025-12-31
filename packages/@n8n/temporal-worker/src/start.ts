// Load environment variables from .env file FIRST, before any other imports
// This must happen synchronously before config classes read process.env
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try to load .env from project root
// __dirname in compiled code will be packages/@n8n/temporal-worker/dist/
// Path structure: dist -> @n8n/temporal-worker -> packages -> project root
// So we need to go up 3 levels, but test shows we need 4
let envPath = resolve(__dirname, '../../../../.env');

// If that doesn't exist, try alternative paths
if (!existsSync(envPath)) {
	const alternatives = [
		resolve(__dirname, '../../../.env'), // 3 levels up (fallback)
		resolve(process.cwd(), '../../../.env'), // From current working directory
		resolve(process.cwd(), '.env'), // Current directory
	];

	for (const altPath of alternatives) {
		if (existsSync(altPath)) {
			envPath = altPath;
			break;
		}
	}
}

const result = config({ path: envPath, override: true });

if (result.error) {
	console.error('Failed to load .env file:', result.error.message);
	process.exit(1);
} else if (!existsSync(envPath)) {
	console.warn(`.env file not found at: ${envPath}`);
	console.warn('Trying alternative paths...');
	// Try alternative paths
	const altPaths = [resolve(process.cwd(), '.env'), resolve(__dirname, '../../../../.env')];
	for (const altPath of altPaths) {
		if (existsSync(altPath)) {
			const altResult = config({ path: altPath, override: true });
			if (!altResult.error) {
				console.log(`Loaded .env from: ${altPath}`);
				break;
			}
		}
	}
} else {
	const loadedCount = Object.keys(result.parsed || {}).length;
	if (loadedCount > 0) {
		console.log(`✓ Loaded ${loadedCount} environment variables from: ${envPath}`);
	} else {
		console.warn(`⚠ .env file found but contains no variables: ${envPath}`);
	}
}

// Verify critical variable is loaded
if (!process.env.TEMPORAL_ENABLED) {
	console.error('TEMPORAL_ENABLED is not set. Please check your .env file.');
	process.exit(1);
}

import { Container } from '@n8n/di';
import { ensureError } from 'n8n-workflow';
import { TemporalWorkerConfig } from './config';
import { createWorker } from './worker';

let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
let isShuttingDown = false;

function createSignalHandler(signal: string, timeoutInS = 10) {
	return async function onSignal() {
		if (isShuttingDown) {
			return;
		}

		console.log(`Received ${signal} signal, shutting down Temporal worker...`);

		setTimeout(() => {
			console.error('Shutdown timeout reached, forcing shutdown...');
			process.exit(1);
		}, timeoutInS * 1000).unref();

		isShuttingDown = true;
		try {
			if (worker) {
				await worker.shutdown();
				worker = undefined;
			}
		} catch (e) {
			const error = ensureError(e);
			console.error('Error stopping Temporal worker', { error });
		} finally {
			console.log('Temporal worker stopped');
			process.exit(0);
		}
	};
}

// Register signal handlers
process.on('SIGTERM', createSignalHandler('SIGTERM'));
process.on('SIGINT', createSignalHandler('SIGINT'));

void (async function start() {
	try {
		const config = Container.get(TemporalWorkerConfig);

		if (!config.temporal.enabled) {
			console.error('Temporal is not enabled. Set TEMPORAL_ENABLED=true');
			process.exit(1);
		}

		console.log('Starting Temporal worker...', {
			host: config.temporal.host,
			namespace: config.temporal.namespace,
			taskQueue: config.temporal.taskQueue,
			tlsEnabled: config.temporal.tlsEnabled,
		});

		worker = await createWorker(config.temporal);

		console.log('Temporal worker started successfully', {
			host: config.temporal.host,
			namespace: config.temporal.namespace,
			taskQueue: config.temporal.taskQueue,
		});

		await worker.run();
	} catch (error) {
		const err = ensureError(error);
		console.error('Failed to start Temporal worker', { error: err });
		process.exit(1);
	}
})();
