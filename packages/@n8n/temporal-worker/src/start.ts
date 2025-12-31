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
