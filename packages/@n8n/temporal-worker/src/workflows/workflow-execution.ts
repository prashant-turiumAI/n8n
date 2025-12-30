import * as workflow from '@temporalio/workflow';
import { proxyActivities } from '@temporalio/workflow';
import type { ExecutionContext } from '../types';

// Workflow input/output types (must be serializable)
export interface WorkflowExecutionInput {
	nodes: Array<Record<string, unknown>>;
	connections: Record<string, unknown>;
	pinData?: Record<string, unknown>;
	executionData?: Record<string, unknown>;
}

export interface WorkflowExecutionOutput {
	resultData: {
		runData: Record<string, unknown>;
	};
}

// Type for n8n node
interface INode {
	id: string;
	name: string;
	type: string;
	typeVersion?: number;
	position?: [number, number];
	parameters?: Record<string, unknown>;
	disabled?: boolean;
	notes?: string;
}

// Type for n8n connections
interface IConnections {
	[nodeName: string]: {
		[outputIndex: string]: Array<Array<{ node: string; type: number; index: number }>>;
	};
}

// Proxy activities for use in workflow
// Map node types to their activity functions
const activitiesProxy = proxyActivities<{
	'n8n-nodes-base.httpRequest': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.generateFlowFile': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.updateAttribute': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.mergeContent': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.extractText': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.convertRecord': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.splitJson': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.replaceText': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.putEmail': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.executeSql': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.putSql': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.queryRecord': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.jslTransformJson': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.joltTransformJson': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.routeOnAttribute': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.mergeRecord': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.splitRecord': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.modifyBytes': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.logAttribute': (context: ExecutionContext) => Promise<unknown>;
	'n8n-nodes-base.evaluateJsonPath': (context: ExecutionContext) => Promise<unknown>;
}>({
	startToCloseTimeout: '5 minutes',
	retry: {
		maximumAttempts: 3,
	},
});

/**
 * Main workflow execution
 * This workflow orchestrates the execution of n8n workflows
 */
export async function WorkflowExecution(
	input: WorkflowExecutionInput,
): Promise<WorkflowExecutionOutput> {
	const info = workflow.workflowInfo();
	workflow.log.info('Starting workflow execution', {
		nodeCount: input.nodes?.length || 0,
		workflowId: info.workflowId,
	});

	// Parse nodes and connections
	const nodes = (input.nodes || []) as unknown as INode[];
	const connections = (input.connections || {}) as IConnections;
	const runData: Record<string, unknown> = {};

	// Find start nodes (nodes with no incoming connections)
	const startNodes = findStartNodes(nodes, connections);
	workflow.log.info('Found start nodes', { startNodeIds: startNodes.map((n) => n.id) });

	// Execute workflow starting from start nodes
	for (const startNode of startNodes) {
		await executeNodeRecursive(startNode, nodes, connections, runData, info.workflowId);
	}

	return {
		resultData: {
			runData,
		},
	};
}

/**
 * Find nodes that have no incoming connections (start nodes)
 */
function findStartNodes(nodes: INode[], connections: IConnections): INode[] {
	const nodesWithIncomingConnections = new Set<string>();

	// Find all nodes that have incoming connections
	for (const nodeConnections of Object.values(connections)) {
		for (const outputConnections of Object.values(nodeConnections)) {
			for (const connectionArray of outputConnections) {
				for (const connection of connectionArray) {
					nodesWithIncomingConnections.add(connection.node);
				}
			}
		}
	}

	// Return nodes that don't have incoming connections
	return nodes.filter((node) => !nodesWithIncomingConnections.has(node.name));
}

/**
 * Execute a node and recursively execute its connected nodes
 */
async function executeNodeRecursive(
	node: INode,
	allNodes: INode[],
	connections: IConnections,
	runData: Record<string, unknown>,
	workflowId: string,
): Promise<void> {
	// Skip if node is disabled
	if (node.disabled) {
		workflow.log.info('Skipping disabled node', { nodeId: node.id, nodeName: node.name });
		return;
	}

	workflow.log.info('Executing node', {
		nodeId: node.id,
		nodeName: node.name,
		nodeType: node.type,
	});

	// Get node's input data from previous nodes
	const inputData = getNodeInputData(node, allNodes, connections, runData);

	// Execute the node based on its type
	let outputData: unknown = null;

	// Check if this node type has a registered activity
	const nodeType = node.type;
	if (nodeType === 'n8n-nodes-base.httpRequest') {
		// Execute HTTP Request activity
		workflow.log.info('Executing HTTP Request activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		// Call the activity
		outputData = await activitiesProxy['n8n-nodes-base.httpRequest'](executionContext);

		workflow.log.info('HTTP Request activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.generateFlowFile') {
		// Execute GenerateFlowFile activity
		workflow.log.info('Executing GenerateFlowFile activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		// Call the activity
		outputData = await activitiesProxy['n8n-nodes-base.generateFlowFile'](executionContext);

		workflow.log.info('GenerateFlowFile activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.updateAttribute') {
		// Execute UpdateAttribute activity
		workflow.log.info('Executing UpdateAttribute activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		// Call the activity
		outputData = await activitiesProxy['n8n-nodes-base.updateAttribute'](executionContext);

		workflow.log.info('UpdateAttribute activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.mergeContent') {
		// Execute MergeContent activity
		workflow.log.info('Executing MergeContent activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.mergeContent'](executionContext);

		workflow.log.info('MergeContent activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.extractText') {
		// Execute ExtractText activity
		workflow.log.info('Executing ExtractText activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.extractText'](executionContext);

		workflow.log.info('ExtractText activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.convertRecord') {
		// Execute ConvertRecord activity
		workflow.log.info('Executing ConvertRecord activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.convertRecord'](executionContext);

		workflow.log.info('ConvertRecord activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.splitJson') {
		// Execute SplitJSON activity
		workflow.log.info('Executing SplitJSON activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.splitJson'](executionContext);

		workflow.log.info('SplitJSON activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.replaceText') {
		// Execute ReplaceText activity
		workflow.log.info('Executing ReplaceText activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.replaceText'](executionContext);

		workflow.log.info('ReplaceText activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.putEmail') {
		// Execute PutEmail activity
		workflow.log.info('Executing PutEmail activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.putEmail'](executionContext);

		workflow.log.info('PutEmail activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.executeSql') {
		// Execute ExecuteSQL activity
		workflow.log.info('Executing ExecuteSQL activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.executeSql'](executionContext);

		workflow.log.info('ExecuteSQL activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.putSql') {
		// Execute PutSQL activity
		workflow.log.info('Executing PutSQL activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.putSql'](executionContext);

		workflow.log.info('PutSQL activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.queryRecord') {
		// Execute QueryRecord activity
		workflow.log.info('Executing QueryRecord activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.queryRecord'](executionContext);

		workflow.log.info('QueryRecord activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.jslTransformJson') {
		// Execute JSLTransformJSON activity
		workflow.log.info('Executing JSLTransformJSON activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.jslTransformJson'](executionContext);

		workflow.log.info('JSLTransformJSON activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.joltTransformJson') {
		// Execute JoltTransformJSON activity
		workflow.log.info('Executing JoltTransformJSON activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.joltTransformJson'](executionContext);

		workflow.log.info('JoltTransformJSON activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.routeOnAttribute') {
		// Execute RouteOnAttribute activity
		workflow.log.info('Executing RouteOnAttribute activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.routeOnAttribute'](executionContext);

		workflow.log.info('RouteOnAttribute activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.mergeRecord') {
		// Execute MergeRecord activity
		workflow.log.info('Executing MergeRecord activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.mergeRecord'](executionContext);

		workflow.log.info('MergeRecord activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.splitRecord') {
		// Execute SplitRecord activity
		workflow.log.info('Executing SplitRecord activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.splitRecord'](executionContext);

		workflow.log.info('SplitRecord activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.modifyBytes') {
		// Execute ModifyBytes activity
		workflow.log.info('Executing ModifyBytes activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.modifyBytes'](executionContext);

		workflow.log.info('ModifyBytes activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.logAttribute') {
		// Execute LogAttribute activity
		workflow.log.info('Executing LogAttribute activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.logAttribute'](executionContext);

		workflow.log.info('LogAttribute activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.evaluateJsonPath') {
		// Execute EvaluateJsonPath activity
		workflow.log.info('Executing EvaluateJsonPath activity', { nodeId: node.id });

		const executionContext: ExecutionContext = {
			node: node as unknown as ExecutionContext['node'],
			inputs: inputData,
			workflowId,
		};

		outputData = await activitiesProxy['n8n-nodes-base.evaluateJsonPath'](executionContext);

		workflow.log.info('EvaluateJsonPath activity completed', {
			nodeId: node.id,
			outputData: outputData ? 'received' : 'null',
		});
	} else if (nodeType === 'n8n-nodes-base.manualTrigger' || nodeType === 'n8n-nodes-base.webhook') {
		// Start/trigger nodes - just pass through input data
		workflow.log.info('Processing trigger node', { nodeId: node.id, nodeType });
		outputData = inputData || [{ json: {} }];
	} else {
		// Unknown node type - log warning and pass through
		workflow.log.warn('Unknown node type, skipping execution', {
			nodeId: node.id,
			nodeType,
		});
		outputData = inputData;
	}

	// Store output data
	if (outputData !== null) {
		runData[node.id] = {
			main: Array.isArray(outputData) ? outputData : [[outputData]],
		};
	}

	// Find and execute connected nodes
	const nextNodes = getNextNodes(node, allNodes, connections);
	for (const nextNode of nextNodes) {
		await executeNodeRecursive(nextNode, allNodes, connections, runData, workflowId);
	}
}

/**
 * Get input data for a node from its previous nodes
 */
function getNodeInputData(
	node: INode,
	allNodes: INode[],
	connections: IConnections,
	runData: Record<string, unknown>,
): Record<string, unknown> {
	const inputData: Record<string, unknown> = {};

	// Find nodes that connect to this node
	for (const [sourceNodeName, nodeConnections] of Object.entries(connections)) {
		for (const [outputIndex, outputConnections] of Object.entries(nodeConnections)) {
			for (const connectionArray of outputConnections) {
				for (const connection of connectionArray) {
					if (connection.node === node.name) {
						// Found a connection to this node
						const sourceNode = allNodes.find((n) => n.name === sourceNodeName);
						if (sourceNode && runData[sourceNode.id]) {
							const sourceOutput = runData[sourceNode.id] as { main: unknown[][] };
							const outputIndexNum = parseInt(outputIndex, 10);
							if (sourceOutput.main && sourceOutput.main[outputIndexNum]) {
								inputData[connection.index.toString()] = sourceOutput.main[outputIndexNum];
							}
						}
					}
				}
			}
		}
	}

	return inputData;
}

/**
 * Get nodes that are connected after this node
 */
function getNextNodes(node: INode, allNodes: INode[], connections: IConnections): INode[] {
	const nextNodes: INode[] = [];
	const nodeConnections = connections[node.name];

	if (!nodeConnections) {
		return nextNodes;
	}

	// Find all nodes connected from this node
	for (const outputConnections of Object.values(nodeConnections)) {
		for (const connectionArray of outputConnections) {
			for (const connection of connectionArray) {
				const nextNode = allNodes.find((n) => n.name === connection.node);
				if (nextNode && !nextNodes.find((n) => n.id === nextNode.id)) {
					nextNodes.push(nextNode);
				}
			}
		}
	}

	return nextNodes;
}
