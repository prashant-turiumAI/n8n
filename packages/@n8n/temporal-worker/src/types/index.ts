// Re-export n8n types for convenience (for use outside workflows)
export type {
	INode,
	IConnections,
	IRunExecutionData,
	IRunData,
	IPinData,
	IExecuteData,
	IWorkflowExecuteAdditionalData,
} from 'n8n-workflow';

// Import the types we re-exported for use in interfaces
import type { INode } from 'n8n-workflow';

// Temporal worker specific types (for use in activities and client code)
export interface ExecutionContext {
	node: INode;
	inputs: Record<string, unknown>;
	workflowId: string;
}
