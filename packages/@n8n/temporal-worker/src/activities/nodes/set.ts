import { log } from '@temporalio/activity';
import type { NodeActivityInput, NodeActivityOutput } from '../base-activity';
import type { INodeExecutionData } from 'n8n-workflow';

/**
 * Activity for executing Set nodes.
 * Set nodes transform data by setting/updating fields on items.
 *
 * NOTE: This is a simplified implementation. Full Set node execution requires:
 * - Access to node parameters (values.boolean, values.number, values.string, etc.)
 * - Expression evaluation capabilities
 * - Proper data transformation logic
 *
 * This will be enhanced when proper node execution infrastructure is available.
 */
export async function executeSetActivity(input: NodeActivityInput): Promise<NodeActivityOutput> {
	const { node, inputData, executionId } = input;

	log.info('Executing Set node', {
		nodeName: node.name,
		executionId,
	});

	try {
		// For now, Set node passes through input data
		// TODO: Implement full Set node logic:
		// 1. Get node parameters (values.boolean, values.number, values.string, etc.)
		// 2. Process each input item
		// 3. Apply transformations based on parameters
		// 4. Handle keepOnlySet option
		// 5. Handle dotNotation option
		// 6. Return transformed data

		if (!inputData || inputData.length === 0) {
			// If no input, return empty item (matching Set node behavior)
			return {
				data: [[{ json: {}, pairedItem: { item: 0 } }]],
			};
		}

		// Flatten input data and process each item
		const processedItems: INodeExecutionData[] = [];

		for (let i = 0; i < inputData.length; i++) {
			const inputArray = inputData[i];
			for (let j = 0; j < inputArray.length; j++) {
				const item = inputArray[j];
				// For now, just pass through the data
				// In full implementation, this would transform based on node parameters
				processedItems.push({
					...item,
					pairedItem: { item: j },
				});
			}
		}

		if (processedItems.length === 0) {
			processedItems.push({ json: {}, pairedItem: { item: 0 } });
		}

		return {
			data: [processedItems],
		};
	} catch (error) {
		log.error('Set node execution failed', {
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
