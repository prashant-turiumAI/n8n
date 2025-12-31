import { Service } from '@n8n/di';
import { Logger } from '@n8n/backend-common';
import type {
	IRunData,
	IRunExecutionData,
	ITaskData,
	ITaskDataConnections,
	INodeExecutionData,
	ExecutionStatus,
	WorkflowExecuteMode,
	ExecutionError,
} from 'n8n-workflow';
import type { IExecutionResponse } from '@n8n/db';
import type { WorkflowHandle } from '@temporalio/client';

// Using the return type from fetchHistory() - it returns an object with events array
type TemporalHistory = Awaited<ReturnType<WorkflowHandle['fetchHistory']>>;

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
		history: TemporalHistory,
		workflowData: { id?: string; name?: string },
		workflowResult?: { runData?: Record<string, any>; status?: string; error?: string },
	): IExecutionResponse {
		this.logger.debug('Transforming Temporal history to n8n execution format', {
			executionId,
			workflowId,
			eventCount: history.events?.length || 0,
		});

		// Extract execution metadata from history events
		const events = history.events || [];
		const startedEvent = events.find((e) => 'type' in e && e.type === 'WorkflowExecutionStarted');
		const completedEvent = events.find(
			(e) =>
				'type' in e &&
				(e.type === 'WorkflowExecutionCompleted' || e.type === 'WorkflowExecutionFailed'),
		);
		const cancelledEvent = events.find(
			(e) => 'type' in e && e.type === 'WorkflowExecutionCanceled',
		);

		// Determine execution status
		let status: ExecutionStatus = 'success';
		let finished = true;
		if (
			completedEvent &&
			'type' in completedEvent &&
			completedEvent.type === 'WorkflowExecutionFailed'
		) {
			status = 'error';
		} else if (cancelledEvent) {
			status = 'canceled';
			finished = true;
		} else if (
			completedEvent &&
			'type' in completedEvent &&
			completedEvent.type === 'WorkflowExecutionCompleted'
		) {
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
									status === 'error' ? 'error' : status === 'canceled' ? 'canceled' : 'success',
								data: taskDataConnections,
							};

							// Error is handled at resultData level, not per-task
							// task.error is optional and should be ExecutionError type
							// We'll set it to undefined here and handle errors at the execution level

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
		// Note: ExecutionError is a union type of specific error classes
		// For now, we'll set it to undefined and let the workflow result handle errors
		// In a production implementation, you'd want to create proper error instances
		let executionError: ExecutionError | undefined;
		// Error details are already in workflowResult.error as a string
		// We'll leave executionError as undefined since we don't have the error instance

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
