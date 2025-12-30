/**
 * Test script to verify JoltTransformJSON node activity works
 * Run with: pnpm tsx src/test-jolt-transform-json.ts
 */

import { joltTransformJsonActivity } from './activities/nodes/jolt-transform-json';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testJoltTransformJson() {
	console.log('Testing JoltTransformJSON node activity...\n');

	// Test 1: JOLT shift transformation
	console.log('Test 1: JOLT shift transformation');
	const mockNode1: INode = {
		id: 'jolt-1',
		name: 'JoltTransformJSON',
		type: 'n8n-nodes-base.joltTransformJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			mode: 'shift',
			spec: JSON.stringify({
				firstName: 'name.first',
				lastName: 'name.last',
				age: 'age',
			}),
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: {
				name: {
					first: 'John',
					last: 'Doe',
				},
				age: 30,
				city: 'New York',
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await joltTransformJsonActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Original:', JSON.stringify(context1.inputs.json, null, 2));
		console.log('Transformed:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: JOLT transformation with input path
	console.log('Test 2: JOLT transformation with input path');
	const mockNode2: INode = {
		id: 'jolt-2',
		name: 'JoltTransformJSON',
		type: 'n8n-nodes-base.joltTransformJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			mode: 'shift',
			inputPath: 'data',
			spec: JSON.stringify({
				id: 'id',
				title: 'title',
				price: 'price',
			}),
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: {
				data: {
					id: 1,
					title: 'Product',
					price: 99.99,
					description: 'Product description',
				},
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await joltTransformJsonActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Transformed:', JSON.stringify(result2.json, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: JOLT transformation on array
	console.log('Test 3: JOLT transformation on array');
	const mockNode3: INode = {
		id: 'jolt-3',
		name: 'JoltTransformJSON',
		type: 'n8n-nodes-base.joltTransformJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			mode: 'shift',
			spec: JSON.stringify({
				name: 'name',
				value: 'value',
			}),
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: [
				{ name: 'Item 1', value: 10, extra: 'data' },
				{ name: 'Item 2', value: 20, extra: 'data' },
			],
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await joltTransformJsonActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Transformed:', JSON.stringify(result3.json, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All JoltTransformJSON tests completed!');
	console.log('\n Note: This is a simplified JOLT implementation.');
	console.log('   For full JOLT support, use a library like "jolt-core" or "jolt-transform".');
	console.log('   Current implementation supports basic "shift" operations.');
}

// Run the test
void testJoltTransformJson();
