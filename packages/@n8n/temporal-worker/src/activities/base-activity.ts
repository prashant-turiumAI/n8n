import { log } from '@temporalio/activity';
import type { INode, INodeExecutionData, IWorkflowBase } from 'n8n-workflow';

export interface NodeActivityInput {
	workflowData: IWorkflowBase;
	node: INode;
	inputData: INodeExecutionData[][];
	executionId: string;
	userId: string;
	n8nApiUrl?: string; // Base URL for n8n API (for credential resolution)
	workerSecret?: string; // Secret for authenticating with n8n's internal credential API
}

export interface NodeActivityOutput {
	data: INodeExecutionData[][];
	error?: {
		message: string;
		nodeName: string;
	};
}

/**
 * Base class for all node activities in Temporal.
 * Provides common error handling and logging infrastructure.
 */
export abstract class BaseNodeActivity {
	/**
	 * Execute the node logic. Must be implemented by subclasses.
	 * @param input - Node execution input data
	 * @returns Node execution output data
	 */
	protected abstract executeNode(input: NodeActivityInput): Promise<NodeActivityOutput>;

	/**
	 * Main entry point for Temporal activity execution.
	 * Handles logging, error catching, and error formatting.
	 * @param input - Node execution input data
	 * @returns Node execution output data
	 */
	async run(input: NodeActivityInput): Promise<NodeActivityOutput> {
		const { node, executionId } = input;

		log.info('Executing node', {
			nodeName: node.name,
			nodeType: node.type,
			executionId,
		});

		try {
			return await this.executeNode(input);
		} catch (error) {
			log.error('Node execution failed', {
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
}
