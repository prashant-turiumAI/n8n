import { NativeConnection, Worker } from '@temporalio/worker';

import { TemporalConfig } from '@n8n/config';

import { getTemporalConfig } from './config';
import * as activities from './activities';

/**
 * Creates and returns a Temporal worker instance
 */
export async function createWorker(): Promise<Worker> {
	const config = getTemporalConfig();

	const connection = await NativeConnection.connect({
		address: config.host,
	});

	// Get workflow path (compiled workflows)
	// In Temporal, workflows need to be bundled separately
	// For development, this will point to the compiled workflows bundle
	const workflowsPath = require.resolve('./workflows');

	const worker = await Worker.create({
		connection,
		taskQueue: config.taskQueue,
		workflowsPath,
		activities: activities.activities as Record<string, unknown>,
	});

	return worker;
}

/**
 * Runs the Temporal worker (blocking)
 */
export async function runWorker(): Promise<void> {
	const worker = await createWorker();
	const config = getTemporalConfig();

	console.log(`Temporal worker started on task queue: ${config.taskQueue}`);

	await worker.run();
}
