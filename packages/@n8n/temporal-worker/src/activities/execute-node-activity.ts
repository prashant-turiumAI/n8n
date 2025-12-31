import { log } from '@temporalio/activity';
import type { NodeActivityInput, NodeActivityOutput } from './base-activity';
import {
	executeManualTriggerActivity,
	executeSetActivity,
	executeHttpRequestActivity,
} from './nodes';

/**
 * Activity that executes a single n8n node.
 * Routes to node-specific activities based on node type.
 */
export async function executeNodeActivity(input: NodeActivityInput): Promise<NodeActivityOutput> {
	const { node, executionId } = input;

	log.info('Executing node activity', {
		nodeName: node.name,
		nodeType: node.type,
		executionId,
	});

	try {
		// Route to node-specific activity based on node type
		switch (node.type) {
			case 'n8n-nodes-base.manualTrigger':
				return await executeManualTriggerActivity(input);

			case 'n8n-nodes-base.set':
				return await executeSetActivity(input);

			case 'n8n-nodes-base.httpRequest':
				return await executeHttpRequestActivity(input);

			default:
				// For unknown node types, log warning and pass through input data
				log.warn('Node type not yet implemented, passing through input data', {
					nodeName: node.name,
					nodeType: node.type,
					executionId,
				});

				return {
					data: input.inputData || [[{ json: {} }]],
				};
		}
	} catch (error) {
		log.error('Node execution failed', {
			error,
			nodeName: node.name,
			nodeType: node.type,
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
