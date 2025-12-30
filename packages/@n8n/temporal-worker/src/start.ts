import { runWorker } from './worker';

function ensureError(error: unknown): Error {
	if (error instanceof Error) {
		return error;
	}
	return new Error(String(error));
}

let isShuttingDown = false;

function createSignalHandler(signal: string) {
	return async function onSignal() {
		if (isShuttingDown) {
			return;
		}

		console.log(`Received ${signal} signal, shutting down...`);

		isShuttingDown = true;

		setTimeout(() => {
			console.error('Shutdown timeout reached, forcing shutdown...');
			process.exit(1);
		}, 10000).unref();

		try {
			// Worker cleanup will be handled by Temporal SDK
			console.log('Temporal worker stopped');
			process.exit(0);
		} catch (e) {
			const error = ensureError(e);
			console.error('Error stopping temporal worker', { error });
			process.exit(1);
		}
	};
}

void (async function start() {
	try {
		process.on('SIGINT', createSignalHandler('SIGINT'));
		process.on('SIGTERM', createSignalHandler('SIGTERM'));

		await runWorker();
	} catch (e) {
		const error = ensureError(e);
		console.error('Temporal worker failed to start', { error });
		process.exit(1);
	}
})();
