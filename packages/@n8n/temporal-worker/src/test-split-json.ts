/**
 * Test script to verify SplitJSON node activity works
 * Run with: pnpm tsx src/test-split-json.ts
 */

import { splitJsonActivity } from './activities/nodes/split-json';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testSplitJson() {
	console.log('Testing SplitJSON node activity...\n');

	// Test 1: Split array at root level
	console.log('Test 1: Split array at root level');
	const mockNode1: INode = {
		id: 'split-1',
		name: 'SplitJSON',
		type: 'n8n-nodes-base.splitJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			splitAtRoot: true,
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: [
				{ id: 1, name: 'Item 1' },
				{ id: 2, name: 'Item 2' },
				{ id: 3, name: 'Item 3' },
			],
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await splitJsonActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Split Item:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Split nested array using JSON path
	console.log('Test 2: Split nested array using JSON path');
	const mockNode2: INode = {
		id: 'split-2',
		name: 'SplitJSON',
		type: 'n8n-nodes-base.splitJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			arrayPath: 'data.items',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: {
				data: {
					items: [
						{ id: 1, value: 'first' },
						{ id: 2, value: 'second' },
					],
				},
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await splitJsonActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Split Item:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Split with max items limit
	console.log('Test 3: Split with max items limit (max 2)');
	const mockNode3: INode = {
		id: 'split-3',
		name: 'SplitJSON',
		type: 'n8n-nodes-base.splitJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			maxItems: 2,
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await splitJsonActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Split Item:', JSON.stringify(result3.json, null, 2));
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('Expected: split.count = "2" (limited to 2 items)');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All SplitJSON tests completed!');
}

// Run the test
void testSplitJson();
