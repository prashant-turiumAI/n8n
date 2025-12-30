import { Connection, Client } from '@temporalio/client';

import { getTemporalConfig } from './config';
import type { WorkflowExecutionInput } from './workflows/workflow-execution';

/**
 * Creates a Temporal client for starting workflows
 */
export async function createTemporalClient(): Promise<Client> {
	const config = getTemporalConfig();

	const connection = await Connection.connect({
		address: config.host,
	});

	const client = new Client({
		connection,
		namespace: config.namespace,
	});

	return client;
}

/**
 * Start a workflow execution
 */
export async function startWorkflowExecution(
	input: WorkflowExecutionInput,
	workflowId?: string,
): Promise<string> {
	const client = await createTemporalClient();
	const config = getTemporalConfig();

	const handle = await client.workflow.start('WorkflowExecution', {
		taskQueue: config.taskQueue,
		workflowId: workflowId || `n8n-workflow-${Date.now()}`,
		args: [input],
	});

	return handle.workflowId;
}
