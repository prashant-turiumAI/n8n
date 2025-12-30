/**
 * Test script to verify HTTP Request node activity works
 * Run with: pnpm tsx src/test-http-node.ts
 */

import { httpRequestActivity } from './activities/nodes/http-request';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testHttpNode() {
	console.log('Testing HTTP Request node activity...\n');

	// Create a mock node
	const mockNode: INode = {
		id: 'http-1',
		name: 'HTTP Request',
		type: 'n8n-nodes-base.httpRequest',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			url: 'https://api.chucknorris.io/jokes/random',
			method: 'GET',
		},
	} as INode;

	// Create execution context
	const context: ExecutionContext = {
		node: mockNode,
		inputs: {
			url: 'https://api.chucknorris.io/jokes/random',
			method: 'GET',
		},
		workflowId: 'test-workflow-123',
	};

	try {
		console.log('Making HTTP request to https://api.chucknorris.io/jokes/random...');
		const result = await httpRequestActivity(context);

		console.log('\n HTTP Request successful!');
		console.log('Status Code:', result.statusCode);
		console.log('Response Headers:', JSON.stringify(result.headers, null, 2));
		console.log('Response Body:', JSON.stringify(result.body, null, 2));

		if (result.statusCode === 200) {
			console.log('\n Test passed! HTTP node is working correctly.');
		} else {
			console.log('\n  Test completed but got unexpected status code:', result.statusCode);
		}
	} catch (error) {
		console.error('\n Test failed!');
		console.error('Error:', error);
		process.exit(1);
	}
}

// Run the test
void testHttpNode();
