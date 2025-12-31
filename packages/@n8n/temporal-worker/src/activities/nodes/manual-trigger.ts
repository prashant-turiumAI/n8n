import { log } from '@temporalio/activity';
import type { NodeActivityInput, NodeActivityOutput } from '../base-activity';

/**
 * Activity for executing Manual Trigger nodes.
 * Manual Trigger nodes simply emit an empty JSON object when triggered.
 */
export async function executeManualTriggerActivity(
	input: NodeActivityInput,
): Promise<NodeActivityOutput> {
	const { node, executionId } = input;

	log.info('Executing Manual Trigger node', {
		nodeName: node.name,
		executionId,
	});

	try {
		// Manual Trigger nodes emit a single empty object
		// This matches the behavior of ManualTrigger.node.ts
		const outputData: NodeActivityOutput['data'] = [[{ json: {} }]];

		return {
			data: outputData,
		};
	} catch (error) {
		log.error('Manual Trigger execution failed', {
			error,
			nodeName: node.name,
			executionId,
		});

		return {
			data: [],
			error: {
				message: error instanceof Error ? error.message : String(error),
				nodeName: node.name,
			},
		};
	}
}
