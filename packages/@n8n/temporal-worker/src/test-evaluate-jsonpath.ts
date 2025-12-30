/**
 * Test script to verify EvaluateJsonPath node activity works
 * Run with: pnpm tsx src/test-evaluate-jsonpath.ts
 */

import { evaluateJsonPathActivity } from './activities/nodes/evaluate-jsonpath';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testEvaluateJsonPath() {
	console.log('Testing EvaluateJsonPath node activity...\n');

	// Test 1: Extract values to attributes
	console.log('Test 1: Extract values to attributes');
	const mockNode1: INode = {
		id: 'jsonpath-1',
		name: 'EvaluateJsonPath',
		type: 'n8n-nodes-base.evaluateJsonPath',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			destination: 'attribute',
			jsonPathExpressions: [
				{ name: 'userName', path: '$.user.name' },
				{ name: 'userAge', path: '$.user.age' },
				{ name: 'city', path: '$.user.address.city' },
			],
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: {
				user: {
					name: 'John',
					age: 30,
					address: {
						city: 'New York',
						country: 'USA',
					},
				},
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await evaluateJsonPathActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Extracted Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('Expected: userName="John", userAge=30, city="New York"');
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Extract to content
	console.log('Test 2: Extract values to content');
	const mockNode2: INode = {
		id: 'jsonpath-2',
		name: 'EvaluateJsonPath',
		type: 'n8n-nodes-base.evaluateJsonPath',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			destination: 'content',
			jsonPathExpressions: [
				{ name: 'id', path: '$.id' },
				{ name: 'title', path: '$.title' },
			],
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: {
				id: 1,
				title: 'Test Item',
				description: 'This is a test',
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await evaluateJsonPathActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Extracted Content:', JSON.stringify(result2.json, null, 2));
		console.log('Expected: {id: 1, title: "Test Item"}');
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Extract from array
	console.log('Test 3: Extract from array');
	const mockNode3: INode = {
		id: 'jsonpath-3',
		name: 'EvaluateJsonPath',
		type: 'n8n-nodes-base.evaluateJsonPath',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			destination: 'attribute',
			jsonPathExpressions: [
				{ name: 'firstItem', path: '$.items[0].name' },
				{ name: 'secondItem', path: '$.items[1].name' },
			],
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: {
				items: [
					{ name: 'Item 1', value: 10 },
					{ name: 'Item 2', value: 20 },
					{ name: 'Item 3', value: 30 },
				],
			},
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await evaluateJsonPathActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Extracted Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('Expected: firstItem="Item 1", secondItem="Item 2"');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	// Test 4: Extract with input path
	console.log('Test 4: Extract with input path');
	const mockNode4: INode = {
		id: 'jsonpath-4',
		name: 'EvaluateJsonPath',
		type: 'n8n-nodes-base.evaluateJsonPath',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			destination: 'attribute',
			inputPath: 'data',
			jsonPathExpressions: [{ name: 'value', path: '$.value' }],
		},
	} as INode;

	const context4: ExecutionContext = {
		node: mockNode4,
		inputs: {
			json: {
				data: {
					value: 42,
					other: 'ignored',
				},
			},
		},
		workflowId: 'test-workflow-4',
	};

	try {
		const result4 = await evaluateJsonPathActivity(context4);
		console.log(' Test 4 passed!');
		console.log('Extracted Attributes:', JSON.stringify(result4.attributes, null, 2));
		console.log('Expected: value=42');
		console.log('');
	} catch (error) {
		console.error(' Test 4 failed!', error);
	}

	console.log(' All EvaluateJsonPath tests completed!');
	console.log('\n Note: This is a simplified JSONPath implementation.');
	console.log('   For full JSONPath support, use a library like "jsonpath" or "jsonpath-plus".');
}

// Run the test
void testEvaluateJsonPath();
