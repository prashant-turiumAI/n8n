import { log } from '@temporalio/activity';
import type { NodeActivityInput, NodeActivityOutput } from '../base-activity';

/**
 * Activity for executing HTTP Request nodes.
 * HTTP Request nodes make HTTP requests to external APIs.
 *
 * NOTE: This is a placeholder implementation. Full HTTP Request execution requires:
 * - Credential resolution (authentication headers, API keys, etc.)
 * - HTTP client (axios or similar)
 * - Request/response handling
 * - Error handling and retries
 * - Binary data handling
 *
 * This will be enhanced when proper node execution infrastructure is available.
 */
export async function executeHttpRequestActivity(
	input: NodeActivityInput,
): Promise<NodeActivityOutput> {
	const { node, inputData, executionId } = input;

	log.info('Executing HTTP Request node', {
		nodeName: node.name,
		executionId,
	});

	try {
		// TODO: Implement full HTTP Request logic:
		// 1. Resolve credentials (if needed)
		// 2. Get node parameters (method, url, headers, body, etc.)
		// 3. Make HTTP request
		// 4. Process response
		// 5. Return response data

		log.warn('HTTP Request node execution not yet fully implemented', {
			nodeName: node.name,
			executionId,
		});

		// For now, return input data (placeholder)
		// In full implementation, this would make the actual HTTP request
		return {
			data: inputData || [[{ json: { error: 'HTTP Request not yet implemented' } }]],
		};
	} catch (error) {
		log.error('HTTP Request node execution failed', {
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
