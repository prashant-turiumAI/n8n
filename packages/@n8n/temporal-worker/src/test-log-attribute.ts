/**
 * Test script to verify LogAttribute node activity works
 * Run with: pnpm tsx src/test-log-attribute.ts
 */

import { logAttributeActivity } from './activities/nodes/log-attribute';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testLogAttribute() {
	console.log('Testing LogAttribute node activity...\n');

	// Test 1: Log all attributes
	console.log('Test 1: Log all attributes');
	const mockNode1: INode = {
		id: 'log-1',
		name: 'LogAttribute',
		type: 'n8n-nodes-base.logAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			logLevel: 'info',
			logSize: true,
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: { data: 'test' },
			attributes: {
				filename: 'test.txt',
				path: '/tmp/test.txt',
				size: '100',
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await logAttributeActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Check console output above for logged attributes');
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Log specific attributes
	console.log('Test 2: Log specific attributes');
	const mockNode2: INode = {
		id: 'log-2',
		name: 'LogAttribute',
		type: 'n8n-nodes-base.logAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			logLevel: 'debug',
			attributesToLog: ['filename', 'size'],
			logPrefix: 'TestPrefix',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: { data: 'test' },
			attributes: {
				filename: 'test.txt',
				path: '/tmp/test.txt',
				size: '100',
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await logAttributeActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Check console output above for logged attributes (filename and size only)');
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Log with content
	console.log('Test 3: Log with content');
	const mockNode3: INode = {
		id: 'log-3',
		name: 'LogAttribute',
		type: 'n8n-nodes-base.logAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			logLevel: 'info',
			logContent: true,
			maxContentLength: 50,
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: { message: 'This is a test message for logging' },
			attributes: {
				filename: 'test.json',
			},
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await logAttributeActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Check console output above for logged content');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All LogAttribute tests completed!');
	console.log('\n Note: Check the console output above to see the logged attributes.');
}

// Run the test
void testLogAttribute();
