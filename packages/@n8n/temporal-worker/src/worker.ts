import { NativeConnection, Worker } from '@temporalio/worker';
import type { TemporalConfig } from '@n8n/config';
import { readFile } from 'fs/promises';
import { executeNodeActivity, resolveCredentialActivity } from './activities';

/**
 * Creates a Temporal worker instance
 * @param config - Temporal configuration
 * @returns Configured Temporal worker
 */
export async function createWorker(config: TemporalConfig): Promise<Worker> {
	const connectionOptions: Parameters<typeof NativeConnection.connect>[0] = {
		address: config.host,
	};

	// Add TLS configuration if enabled
	if (config.tlsEnabled) {
		if (!config.tlsCertPath || !config.tlsKeyPath) {
			throw new Error(
				'TLS is enabled but TLS certificate or key path is not provided. Set TEMPORAL_TLS_CERT_PATH and TEMPORAL_TLS_KEY_PATH.',
			);
		}

		try {
			const [cert, key] = await Promise.all([
				readFile(config.tlsCertPath),
				readFile(config.tlsKeyPath),
			]);

			connectionOptions.tls = {
				clientCertPair: {
					crt: cert,
					key: key,
				},
			};
		} catch (error) {
			throw new Error(
				`Failed to read TLS certificate files: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	const connection = await NativeConnection.connect(connectionOptions);

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
