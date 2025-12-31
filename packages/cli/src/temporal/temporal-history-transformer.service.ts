import { Service } from '@n8n/di';
import { Logger } from '@n8n/backend-common';
import type {
	IExecutionResponse,
	IRunData,
	IRunExecutionData,
	ITaskData,
	ITaskDataConnections,
	INodeExecutionData,
	ExecutionStatus,
	WorkflowExecuteMode,
} from 'n8n-workflow';
import type { WorkflowExecutionHistory } from '@temporalio/client';

/**
 * Service for transforming Temporal workflow execution history into n8n execution format.
 *
 * This service converts Temporal's event-based history into n8n's execution response format,
 * allowing the frontend to display Temporal executions in the same way as regular n8n executions.
 */
@Service()
export class TemporalHistoryTransformerService {
	constructor(private readonly logger: Logger) {}

	/**
	 * Transforms Temporal workflow execution history to n8n execution response format.
	 *
	 * @param executionId - The n8n execution ID
	 * @param workflowId - The Temporal workflow ID
	 * @param history - The Temporal workflow execution history
	 * @param workflowData - The workflow data (for metadata)
	 * @param workflowResult - The workflow result (contains runData from workflow)
	 * @returns n8n execution response
	 */
	transformHistoryToExecution(
		executionId: string,
		workflowId: string,
		history: WorkflowExecutionHistory,
		workflowData: { id?: string; name?: string },
		workflowResult?: { runData?: Record<string, any>; status?: string; error?: string },
	): IExecutionResponse {
		this.logger.debug('Transforming Temporal history to n8n execution format', {
			executionId,
			workflowId,
			eventCount: history.events.length,
		});

		// Extract execution metadata from history events
		const startedEvent = history.events.find((e) => e.type === 'WorkflowExecutionStarted');
		const completedEvent = history.events.find(
			(e) => e.type === 'WorkflowExecutionCompleted' || e.type === 'WorkflowExecutionFailed',
		);
		const cancelledEvent = history.events.find((e) => e.type === 'WorkflowExecutionCanceled');

		// Determine execution status
		let status: ExecutionStatus = 'success';
		let finished = true;
		if (completedEvent?.type === 'WorkflowExecutionFailed') {
			status = 'error';
		} else if (cancelledEvent) {
			status = 'cancelled';
			finished = true;
		} else if (completedEvent?.type === 'WorkflowExecutionCompleted') {
			status = 'success';
			finished = true;
		} else {
			// Still running
			status = 'running';
			finished = false;
		}

		// Extract timestamps
		const startedAt = startedEvent ? new Date(Number(startedEvent.eventTime)) : new Date();
		const stoppedAt =
			completedEvent || cancelledEvent
				? new Date(Number((completedEvent || cancelledEvent)!.eventTime))
				: undefined;

		// Transform runData from workflow result
		// The workflow returns runData as Record<string, any> where keys are node names
		// and values are arrays with structure: [{ main: INodeExecutionData[][] }]
		const runData: IRunData = {};

		if (workflowResult?.runData) {
			// Convert workflow runData to n8n IRunData format
			// IRunData is: { [nodeName: string]: ITaskData[] }
			let executionIndex = 0;

			for (const [nodeName, nodeData] of Object.entries(workflowResult.runData)) {
				if (Array.isArray(nodeData) && nodeData.length > 0) {
					const taskData: ITaskData[] = [];

					// The workflow stores data as: [{ main: INodeExecutionData[][] }]
					// We need to convert it to ITaskData[]
					for (let runIndex = 0; runIndex < nodeData.length; runIndex++) {
						const runDataItem = nodeData[runIndex] as { main?: INodeExecutionData[][] };

						if (runDataItem.main && Array.isArray(runDataItem.main)) {
							// Create ITaskDataConnections from execution data
							const taskDataConnections: ITaskDataConnections = {
								main: runDataItem.main,
							};

							// Create ITaskData
							const task: ITaskData = {
								startTime: startedAt.getTime(),
								executionIndex: executionIndex++,
								source: [], // Source data would need to be extracted from workflow connections
								executionTime: stoppedAt
									? stoppedAt.getTime() - startedAt.getTime()
									: Date.now() - startedAt.getTime(),
								executionStatus:
									status === 'error' ? 'error' : status === 'cancelled' ? 'cancelled' : 'success',
								data: taskDataConnections,
							};

							// Add error if present
							if (status === 'error' && workflowResult.error) {
								task.error = {
									name: 'ExecutionError',
									message: workflowResult.error,
								};
							}

							taskData.push(task);
						}
					}

					if (taskData.length > 0) {
						runData[nodeName] = taskData;
					}
				}
			}
		}

		// Extract error from workflow result or history
		let executionError: { name: string; message: string } | undefined;
		if (workflowResult?.error) {
			executionError = {
				name: 'ExecutionError',
				message: workflowResult.error,
			};
		} else if (completedEvent?.type === 'WorkflowExecutionFailed') {
			const failure = (completedEvent as any).failure;
			if (failure) {
				executionError = {
					name: failure.errorType || 'ExecutionError',
					message: failure.message || 'Workflow execution failed',
				};
			}
		}

		// Build execution response
		const executionResponse: IExecutionResponse = {
			id: executionId,
			mode: 'trigger' as WorkflowExecuteMode,
			createdAt: startedAt,
			startedAt,
			stoppedAt,
			workflowId: workflowData.id || '',
			finished,
			status,
			data: {
				version: 1,
				resultData: {
					runData,
					error: executionError,
					lastNodeExecuted: this.getLastNodeExecuted(runData),
				},
			} as IRunExecutionData,
			workflowData: workflowData as any,
			customData: {},
			annotation: {
				tags: [],
			},
		};

		this.logger.debug('Transformed Temporal history to n8n execution format', {
			executionId,
			status,
			nodeCount: Object.keys(runData).length,
		});

		return executionResponse;
	}

	/**
	 * Gets the last executed node name from runData.
	 */
	private getLastNodeExecuted(runData: IRunData): string | undefined {
		const nodeNames = Object.keys(runData);
		return nodeNames.length > 0 ? nodeNames[nodeNames.length - 1] : undefined;
	}
}
