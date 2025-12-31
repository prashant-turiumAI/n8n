import { TemporalHistoryTransformerService } from '../temporal-history-transformer.service';
import type { WorkflowExecutionHistory } from '@temporalio/client';
import type { IExecutionResponse } from '@n8n/db';

describe('TemporalHistoryTransformerService', () => {
	let service: TemporalHistoryTransformerService;

	beforeEach(() => {
		service = new TemporalHistoryTransformerService({
			debug: jest.fn(),
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
		} as any);
	});

	describe('transformHistoryToExecution', () => {
		it('should transform successful workflow execution', () => {
			const executionId = 'test-execution-123';
			const workflowId = 'test-workflow-456';
			const workflowData = { id: 'workflow-123', name: 'Test Workflow' };

			// Mock Temporal history with successful completion
			const history: WorkflowExecutionHistory = {
				events: [
					{
						type: 'WorkflowExecutionStarted',
						eventId: '1',
						eventTime: BigInt(Date.now() - 5000), // 5 seconds ago
					} as any,
					{
						type: 'ActivityTaskScheduled',
						eventId: '2',
						eventTime: BigInt(Date.now() - 4000),
					} as any,
					{
						type: 'ActivityTaskCompleted',
						eventId: '3',
						eventTime: BigInt(Date.now() - 2000),
					} as any,
					{
						type: 'WorkflowExecutionCompleted',
						eventId: '4',
						eventTime: BigInt(Date.now()),
					} as any,
				],
			};

			// Mock workflow result with runData
			const workflowResult = {
				status: 'success',
				runData: {
					'Manual Trigger': [
						{
							main: [[{ json: { test: 'data' } }]],
						},
					],
					Set: [
						{
							main: [[{ json: { processed: true } }]],
						},
					],
				},
			};

			const result = service.transformHistoryToExecution(
				executionId,
				workflowId,
				history,
				workflowData,
				workflowResult,
			);

			expect(result).toBeDefined();
			expect(result.id).toBe(executionId);
			expect(result.status).toBe('success');
			expect(result.finished).toBe(true);
			expect(result.workflowId).toBe(workflowData.id);
			expect(result.data.resultData.runData).toBeDefined();
			expect(result.data.resultData.runData['Manual Trigger']).toBeDefined();
			expect(result.data.resultData.runData['Set']).toBeDefined();
		});

		it('should transform failed workflow execution', () => {
			const executionId = 'test-execution-123';
			const workflowId = 'test-workflow-456';
			const workflowData = { id: 'workflow-123', name: 'Test Workflow' };

			const history: WorkflowExecutionHistory = {
				events: [
					{
						type: 'WorkflowExecutionStarted',
						eventId: '1',
						eventTime: BigInt(Date.now() - 5000),
					} as any,
					{
						type: 'WorkflowExecutionFailed',
						eventId: '2',
						eventTime: BigInt(Date.now()),
						failure: {
							message: 'Workflow failed',
							errorType: 'ApplicationError',
						},
					} as any,
				],
			};

			const workflowResult = {
				status: 'error',
				error: 'Workflow execution failed',
				runData: {},
			};

			const result = service.transformHistoryToExecution(
				executionId,
				workflowId,
				history,
				workflowData,
				workflowResult,
			);

			expect(result.status).toBe('error');
			expect(result.finished).toBe(true);
			expect(result.data.resultData.error).toBeDefined();
		});

		it('should handle empty runData', () => {
			const executionId = 'test-execution-123';
			const workflowId = 'test-workflow-456';
			const workflowData = { id: 'workflow-123', name: 'Test Workflow' };

			const history: WorkflowExecutionHistory = {
				events: [
					{
						type: 'WorkflowExecutionStarted',
						eventId: '1',
						eventTime: BigInt(Date.now() - 5000),
					} as any,
					{
						type: 'WorkflowExecutionCompleted',
						eventId: '2',
						eventTime: BigInt(Date.now()),
					} as any,
				],
			};

			const workflowResult = {
				status: 'success',
				runData: {},
			};

			const result = service.transformHistoryToExecution(
				executionId,
				workflowId,
				history,
				workflowData,
				workflowResult,
			);

			expect(result).toBeDefined();
			expect(result.data.resultData.runData).toEqual({});
		});
	});
});
