import { NativeConnection, Worker } from '@temporalio/worker';
import type { TemporalConfig } from '@n8n/config';
import { executeNodeActivity, resolveCredentialActivity } from './activities';

/**
 * Creates a Temporal worker instance
 * @param config - Temporal configuration
 * @returns Configured Temporal worker
 */
export async function createWorker(config: TemporalConfig): Promise<Worker> {
	const connection = await NativeConnection.connect({
		address: config.host,
		// TODO: Add TLS configuration if enabled
	});

	// Note: workflowsPath must point to compiled workflow files
	// For Temporal workflows, we need to use the compiled JS path
	const workflowsPath = require.resolve('./workflows/workflow-execution');

	return await Worker.create({
		connection,
		namespace: config.namespace,
		taskQueue: config.taskQueue,
		workflowsPath,
		activities: {
			executeNode: executeNodeActivity,
			resolveCredential: resolveCredentialActivity,
		},
	});
}
