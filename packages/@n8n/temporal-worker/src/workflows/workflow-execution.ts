import { proxyActivities, log, sleep } from '@temporalio/workflow';
import type {
	IWorkflowBase,
	INode,
	INodeExecutionData,
	IWorkflowExecutionDataProcess,
	IConnections,
} from 'n8n-workflow';

// This will be populated when activities are implemented
// For now, we'll create a stub interface
interface Activities {
	executeNode: (input: {
		workflowData: IWorkflowBase;
		node: INode;
		inputData: INodeExecutionData[][];
		executionId: string;
		userId: string;
	}) => Promise<{
		data: INodeExecutionData[][];
		error?: {
			message: string;
			nodeName: string;
		};
	}>;
}

const { executeNode } = proxyActivities<Activities>({
	startToCloseTimeout: '10 minutes',
	retry: {
		initialInterval: '1s',
		backoffCoefficient: 2,
		maximumInterval: '100s',
		maximumAttempts: 3,
	},
});

export interface WorkflowExecutionInput {
	executionData: IWorkflowExecutionDataProcess;
	executionId: string;
	startNode?: INode;
	destinationNode?: string;
}

export interface WorkflowExecutionOutput {
	executionId: string;
	status: 'success' | 'error' | 'cancelled';
	runData: Record<string, any>;
	error?: string;
}

/**
 * Main Temporal workflow for executing n8n workflows.
 * Orchestrates node execution in the correct order based on workflow connections.
 */
export async function n8nWorkflowExecution(
	input: WorkflowExecutionInput,
): Promise<WorkflowExecutionOutput> {
	const { executionData, executionId, startNode, destinationNode } = input;
	const { workflowData, userId } = executionData;

	log.info('Starting n8n workflow execution', {
		workflowId: workflowData.id || 'unknown',
		workflowName: workflowData.name || 'unknown',
		executionId,
	});

	try {
		// Find start node
		const start = startNode || findStartNode(workflowData);
		if (!start) {
			throw new Error('No start node found');
		}

		// Build execution graph
		const executionGraph = buildExecutionGraph(workflowData, start, destinationNode || undefined);

		// Execute nodes in topological order
		const runData = await executeWorkflowGraph(
			workflowData,
			executionGraph,
			userId || 'system',
			executionId,
		);

		return {
			executionId,
			status: 'success',
			runData,
		};
	} catch (error) {
		log.error('Workflow execution failed', { error, executionId });
		return {
			executionId,
			status: 'error',
			runData: {},
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Finds the start/trigger node in the workflow.
 */
function findStartNode(workflowData: IWorkflowBase): INode | undefined {
	return workflowData.nodes.find(
		(node) =>
			node.type.toLowerCase().includes('trigger') || node.type === 'n8n-nodes-base.manualTrigger',
	);
}

/**
 * Builds the execution graph starting from the start node.
 * Uses BFS to traverse connected nodes until destination is reached (if specified).
 */
function buildExecutionGraph(
	workflowData: IWorkflowBase,
	startNode: INode,
	destinationNode?: string,
): INode[] {
	const executionOrder: INode[] = [];
	const visited = new Set<string>();
	const nodeMap = new Map<string, INode>();

	// Create a map for quick node lookup
	for (const node of workflowData.nodes) {
		nodeMap.set(node.name, node);
	}

	// BFS traversal starting from start node
	const queue: INode[] = [startNode];
	visited.add(startNode.name);

	while (queue.length > 0) {
		const currentNode = queue.shift()!;
		executionOrder.push(currentNode);

		// Stop if we've reached the destination node
		if (destinationNode && currentNode.name === destinationNode) {
			break;
		}

		// Get child nodes from connections
		const childNodeNames = getChildNodes(workflowData.connections, currentNode.name);

		for (const childNodeName of childNodeNames) {
			if (!visited.has(childNodeName)) {
				const childNode = nodeMap.get(childNodeName);
				if (childNode) {
					visited.add(childNodeName);
					queue.push(childNode);
				}
			}
		}
	}

	return executionOrder;
}

/**
 * Gets child nodes from connections structure.
 * Simplified version that handles main connections.
 */
function getChildNodes(connections: IConnections, nodeName: string): string[] {
	const childNodes: string[] = [];
	const nodeConnections = connections[nodeName];

	if (!nodeConnections) {
		return childNodes;
	}

	// Iterate through connection types (main, ai_tool, etc.)
	for (const connectionType in nodeConnections) {
		const connectionsOfType = nodeConnections[connectionType];
		if (Array.isArray(connectionsOfType)) {
			for (const connectionArray of connectionsOfType) {
				if (Array.isArray(connectionArray)) {
					for (const connection of connectionArray) {
						if (connection && connection.node) {
							childNodes.push(connection.node);
						}
					}
				}
			}
		}
	}

	return childNodes;
}

/**
 * Executes all nodes in the execution graph.
 * Handles control flow nodes (IF, Switch) by executing branches in parallel.
 */
async function executeWorkflowGraph(
	workflowData: IWorkflowBase,
	executionGraph: INode[],
	userId: string,
	executionId: string,
): Promise<Record<string, any>> {
	const nodeResults = new Map<string, INodeExecutionData[][]>();
	const executedNodes = new Set<string>();

	// Process nodes in order, handling control flow specially
	for (const node of executionGraph) {
		if (executedNodes.has(node.name)) {
			continue; // Skip if already executed in a branch
		}

		// Get input data from parent nodes
		const inputData = getInputDataForNode(workflowData, node, nodeResults);

		// Handle control flow nodes
		if (node.type === 'n8n-nodes-base.if') {
			await handleIfNode(workflowData, node, nodeResults, executedNodes, userId, executionId);
			// Continue with next node - branches are handled recursively
			continue;
		}

		if (node.type === 'n8n-nodes-base.switch') {
			await handleSwitchNode(workflowData, node, nodeResults, executedNodes, userId, executionId);
			// Continue with next node - branches are handled recursively
			continue;
		}

		// Regular node execution
		const result = await executeNode({
			workflowData,
			node,
			inputData,
			executionId,
			userId,
		});

		if (result.error) {
			throw new Error(`Node ${node.name} failed: ${result.error.message}`);
		}

		nodeResults.set(node.name, result.data);
		executedNodes.add(node.name);

		// Allow Temporal to persist state
		await sleep('100ms');
	}

	// Convert to IRunData format
	return convertToRunData(nodeResults);
}

/**
 * Gets input data for a node by combining outputs from parent nodes.
 */
function getInputDataForNode(
	workflowData: IWorkflowBase,
	node: INode,
	nodeResults: Map<string, INodeExecutionData[][]>,
): INodeExecutionData[][] {
	const parentNodeNames = getParentNodes(workflowData.connections, node.name);

	if (parentNodeNames.length === 0) {
		// No parents, return empty data array
		return [[{ json: {} }]];
	}

	// Combine data from all parent nodes
	const combinedData: INodeExecutionData[][] = [];

	for (const parentNodeName of parentNodeNames) {
		const parentData = nodeResults.get(parentNodeName);
		if (parentData) {
			// Flatten parent data and add to combined data
			for (const dataArray of parentData) {
				combinedData.push(dataArray);
			}
		}
	}

	// If no data from parents, return empty
	if (combinedData.length === 0) {
		return [[{ json: {} }]];
	}

	return combinedData;
}

/**
 * Gets parent nodes from connections structure.
 */
function getParentNodes(connections: IConnections, nodeName: string): string[] {
	const parentNodes: string[] = [];

	// Iterate through all nodes in connections to find parents
	for (const sourceNodeName in connections) {
		const nodeConnections = connections[sourceNodeName];
		if (!nodeConnections) continue;

		// Check all connection types
		for (const connectionType in nodeConnections) {
			const connectionsOfType = nodeConnections[connectionType];
			if (Array.isArray(connectionsOfType)) {
				for (const connectionArray of connectionsOfType) {
					if (Array.isArray(connectionArray)) {
						for (const connection of connectionArray) {
							if (connection && connection.node === nodeName) {
								parentNodes.push(sourceNodeName);
							}
						}
					}
				}
			}
		}
	}

	return parentNodes;
}

/**
 * Handles IF node execution and branching.
 * IF nodes have two outputs: [trueItems, falseItems]
 */
async function handleIfNode(
	workflowData: IWorkflowBase,
	node: INode,
	nodeResults: Map<string, INodeExecutionData[][]>,
	executedNodes: Set<string>,
	userId: string,
	executionId: string,
): Promise<void> {
	log.info('Handling IF node', {
		nodeName: node.name,
		executionId,
	});

	// Get input data
	const inputData = getInputDataForNode(workflowData, node, nodeResults);

	// Execute IF node to evaluate conditions
	const result = await executeNode({
		workflowData,
		node,
		inputData,
		executionId,
		userId,
	});

	if (result.error) {
		throw new Error(`IF node ${node.name} failed: ${result.error.message}`);
	}

	// IF nodes return [trueItems, falseItems]
	// result.data is INodeExecutionData[][], which for IF node is [trueItems[], falseItems[]]
	const ifOutputs = result.data;
	nodeResults.set(node.name, ifOutputs);
	executedNodes.add(node.name);

	// Determine which branches have data
	const activeBranches: number[] = [];
	if (ifOutputs.length > 0 && ifOutputs[0] && ifOutputs[0].length > 0) {
		activeBranches.push(0); // True branch has data
	}
	if (ifOutputs.length > 1 && ifOutputs[1] && ifOutputs[1].length > 0) {
		activeBranches.push(1); // False branch has data
	}

	// Execute branches in parallel
	if (activeBranches.length > 0) {
		await Promise.all(
			activeBranches.map(async (outputIndex) => {
				await executeBranch(
					workflowData,
					node,
					outputIndex,
					ifOutputs[outputIndex],
					nodeResults,
					executedNodes,
					userId,
					executionId,
				);
			}),
		);
	}
}

/**
 * Handles Switch node execution and branching.
 * Switch nodes can have multiple outputs based on rules or expression.
 */
async function handleSwitchNode(
	workflowData: IWorkflowBase,
	node: INode,
	nodeResults: Map<string, INodeExecutionData[][]>,
	executedNodes: Set<string>,
	userId: string,
	executionId: string,
): Promise<void> {
	log.info('Handling Switch node', {
		nodeName: node.name,
		executionId,
	});

	// Get input data
	const inputData = getInputDataForNode(workflowData, node, nodeResults);

	// Execute Switch node to route data
	const result = await executeNode({
		workflowData,
		node,
		inputData,
		executionId,
		userId,
	});

	if (result.error) {
		throw new Error(`Switch node ${node.name} failed: ${result.error.message}`);
	}

	// Switch nodes return multiple output arrays: [output0[], output1[], output2[], ...]
	const switchOutputs = result.data;
	nodeResults.set(node.name, switchOutputs);
	executedNodes.add(node.name);

	// Determine which branches have data
	const activeBranches: number[] = [];
	for (let i = 0; i < switchOutputs.length; i++) {
		if (switchOutputs[i] && switchOutputs[i].length > 0) {
			activeBranches.push(i);
		}
	}

	// Execute branches in parallel
	if (activeBranches.length > 0) {
		await Promise.all(
			activeBranches.map(async (outputIndex) => {
				await executeBranch(
					workflowData,
					node,
					outputIndex,
					switchOutputs[outputIndex],
					nodeResults,
					executedNodes,
					userId,
					executionId,
				);
			}),
		);
	}
}

/**
 * Executes a branch from a control flow node.
 * Continues execution from child nodes connected to the specified output.
 */
async function executeBranch(
	workflowData: IWorkflowBase,
	controlFlowNode: INode,
	outputIndex: number,
	branchData: INodeExecutionData[],
	nodeResults: Map<string, INodeExecutionData[][]>,
	executedNodes: Set<string>,
	userId: string,
	executionId: string,
): Promise<void> {
	log.info('Executing branch', {
		controlFlowNodeName: controlFlowNode.name,
		outputIndex,
		executionId,
	});

	// Store branch data in results (for nodes that need to read from this branch)
	nodeResults.set(`${controlFlowNode.name}_output_${outputIndex}`, [branchData]);

	// Get child nodes connected to this output
	const childNodes = getChildNodesFromOutput(
		workflowData.connections,
		controlFlowNode.name,
		outputIndex,
	);

	// Execute child nodes in this branch
	for (const childNodeName of childNodes) {
		if (executedNodes.has(childNodeName)) {
			continue; // Skip if already executed
		}

		const childNode = workflowData.nodes.find((n) => n.name === childNodeName);
		if (!childNode) {
			log.warn('Child node not found', { childNodeName, executionId });
			continue;
		}

		// Get input data - use branch data from control flow node
		const inputData: INodeExecutionData[][] = [branchData];

		// Execute child node
		const result = await executeNode({
			workflowData,
			node: childNode,
			inputData,
			executionId,
			userId,
		});

		if (result.error) {
			log.error('Child node execution failed in branch', {
				childNodeName,
				controlFlowNodeName: controlFlowNode.name,
				outputIndex,
				error: result.error.message,
				executionId,
			});
			// Continue with other branches even if one fails
			continue;
		}

		nodeResults.set(childNodeName, result.data);
		executedNodes.add(childNodeName);

		// Recursively handle control flow in child nodes
		if (childNode.type === 'n8n-nodes-base.if') {
			await handleIfNode(workflowData, childNode, nodeResults, executedNodes, userId, executionId);
		} else if (childNode.type === 'n8n-nodes-base.switch') {
			await handleSwitchNode(
				workflowData,
				childNode,
				nodeResults,
				executedNodes,
				userId,
				executionId,
			);
		} else {
			// Continue with downstream nodes
			const downstreamNodes = getChildNodes(workflowData.connections, childNodeName);
			for (const downstreamNodeName of downstreamNodes) {
				if (!executedNodes.has(downstreamNodeName)) {
					const downstreamNode = workflowData.nodes.find((n) => n.name === downstreamNodeName);
					if (downstreamNode) {
						await executeBranchNode(
							workflowData,
							downstreamNode,
							nodeResults,
							executedNodes,
							userId,
							executionId,
						);
					}
				}
			}
		}

		await sleep('100ms');
	}
}

/**
 * Executes a regular node in a branch.
 */
async function executeBranchNode(
	workflowData: IWorkflowBase,
	node: INode,
	nodeResults: Map<string, INodeExecutionData[][]>,
	executedNodes: Set<string>,
	userId: string,
	executionId: string,
): Promise<void> {
	if (executedNodes.has(node.name)) {
		return;
	}

	const inputData = getInputDataForNode(workflowData, node, nodeResults);

	const result = await executeNode({
		workflowData,
		node,
		inputData,
		executionId,
		userId,
	});

	if (result.error) {
		throw new Error(`Node ${node.name} failed: ${result.error.message}`);
	}

	nodeResults.set(node.name, result.data);
	executedNodes.add(node.name);

	// Continue with downstream nodes
	const downstreamNodes = getChildNodes(workflowData.connections, node.name);
	for (const downstreamNodeName of downstreamNodes) {
		if (!executedNodes.has(downstreamNodeName)) {
			const downstreamNode = workflowData.nodes.find((n) => n.name === downstreamNodeName);
			if (downstreamNode) {
				await executeBranchNode(
					workflowData,
					downstreamNode,
					nodeResults,
					executedNodes,
					userId,
					executionId,
				);
			}
		}
	}
}

/**
 * Gets child nodes connected to a specific output of a node.
 * For control flow nodes, we need to get children from a specific output index.
 */
function getChildNodesFromOutput(
	connections: IConnections,
	nodeName: string,
	outputIndex: number,
): string[] {
	const childNodes: string[] = [];
	const nodeConnections = connections[nodeName];

	if (!nodeConnections) {
		return childNodes;
	}

	// Check main connections (control flow nodes use main connections for outputs)
	const mainConnections = nodeConnections.main;
	if (mainConnections && Array.isArray(mainConnections)) {
		// mainConnections is an array of output arrays: [[output0_connections], [output1_connections], ...]
		if (mainConnections[outputIndex] && Array.isArray(mainConnections[outputIndex])) {
			for (const connection of mainConnections[outputIndex]) {
				if (connection && connection.node) {
					childNodes.push(connection.node);
				}
			}
		}
	}

	return childNodes;
}

/**
 * Converts node results map to n8n's IRunData format.
 */
function convertToRunData(nodeResults: Map<string, INodeExecutionData[][]>): Record<string, any> {
	const runData: Record<string, any> = {};

	for (const [nodeName, data] of nodeResults.entries()) {
		// Skip temporary branch data keys
		if (nodeName.includes('_output_')) {
			continue;
		}

		runData[nodeName] = [
			{
				main: data,
			},
		];
	}

	return runData;
}
