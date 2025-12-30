/**
 * Test script to verify JSLTransformJSON node activity works
 * Run with: pnpm tsx src/test-jsl-transform-json.ts
 */

import { jslTransformJsonActivity } from './activities/nodes/jsl-transform-json';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testJslTransformJson() {
	console.log('Testing JSLTransformJSON node activity...\n');

	// Test 1: Simple transformation with JSL script
	console.log('Test 1: Simple transformation with JSL script');
	const mockNode1: INode = {
		id: 'jsl-1',
		name: 'JSLTransformJSON',
		type: 'n8n-nodes-base.jslTransformJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			script: JSON.stringify({
				$name: 'name',
				$age: 'age',
				status: 'active',
			}),
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: {
				name: 'John',
				age: 30,
				city: 'New York',
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await jslTransformJsonActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Original:', JSON.stringify(context1.inputs.json, null, 2));
		console.log('Transformed:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Transformation with input path
	console.log('Test 2: Transformation with input path');
	const mockNode2: INode = {
		id: 'jsl-2',
		name: 'JSLTransformJSON',
		type: 'n8n-nodes-base.jslTransformJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			inputPath: 'data.user',
			script: JSON.stringify({
				$firstName: 'name',
				$years: 'age',
			}),
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: {
				data: {
					user: {
						name: 'Jane',
						age: 25,
					},
				},
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await jslTransformJsonActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Transformed:', JSON.stringify(result2.json, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Transformation with output path
	console.log('Test 3: Transformation with output path');
	const mockNode3: INode = {
		id: 'jsl-3',
		name: 'JSLTransformJSON',
		type: 'n8n-nodes-base.jslTransformJson',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			script: JSON.stringify({
				$id: 'id',
				$title: 'title',
			}),
			outputPath: 'result.item',
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: {
				id: 1,
				title: 'Test Item',
				description: 'This is a test',
			},
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await jslTransformJsonActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Transformed:', JSON.stringify(result3.json, null, 2));
		console.log('Expected: Result nested under result.item');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All JSLTransformJSON tests completed!');
	console.log('\n Note: This is a simplified JSL implementation.');
	console.log('   For full JSL support, a proper JSL parser library would be needed.');
}

// Run the test
void testJslTransformJson();
