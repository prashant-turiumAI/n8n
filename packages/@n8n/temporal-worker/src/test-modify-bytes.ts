/**
 * Test script to verify ModifyBytes node activity works
 * Run with: pnpm tsx src/test-modify-bytes.ts
 */

import { modifyBytesActivity } from './activities/nodes/modify-bytes';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testModifyBytes() {
	console.log('Testing ModifyBytes node activity...\n');

	// Test 1: Replace bytes
	console.log('Test 1: Replace bytes at offset');
	const mockNode1: INode = {
		id: 'modify-1',
		name: 'ModifyBytes',
		type: 'n8n-nodes-base.modifyBytes',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			operation: 'replace',
			offset: 0,
			length: 4,
			replacementBytes: '48656C6C6F', // "Hello" in hex
			encoding: 'hex',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			binary: {
				data: Buffer.from('World!').toString('base64'),
				mimeType: 'text/plain',
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await modifyBytesActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Original Size:', result1.attributes?.['bytes.originalSize']);
		console.log('Modified Size:', result1.attributes?.['bytes.modifiedSize']);
		console.log('Operation:', result1.attributes?.['bytes.operation']);
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Insert bytes
	console.log('Test 2: Insert bytes at offset');
	const mockNode2: INode = {
		id: 'modify-2',
		name: 'ModifyBytes',
		type: 'n8n-nodes-base.modifyBytes',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			operation: 'insert',
			offset: 5,
			replacementBytes: '2C20', // ", " in hex
			encoding: 'hex',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			binary: {
				data: Buffer.from('Hello World').toString('base64'),
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await modifyBytesActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Modified Size:', result2.attributes?.['bytes.modifiedSize']);
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Delete bytes
	console.log('Test 3: Delete bytes');
	const mockNode3: INode = {
		id: 'modify-3',
		name: 'ModifyBytes',
		type: 'n8n-nodes-base.modifyBytes',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			operation: 'delete',
			offset: 5,
			length: 6, // Delete " World"
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			binary: {
				data: Buffer.from('Hello World!').toString('base64'),
			},
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await modifyBytesActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Original Size:', result3.attributes?.['bytes.originalSize']);
		console.log('Modified Size:', result3.attributes?.['bytes.modifiedSize']);
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	// Test 4: Truncate bytes
	console.log('Test 4: Truncate bytes');
	const mockNode4: INode = {
		id: 'modify-4',
		name: 'ModifyBytes',
		type: 'n8n-nodes-base.modifyBytes',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			operation: 'truncate',
			truncateLength: 5,
		},
	} as INode;

	const context4: ExecutionContext = {
		node: mockNode4,
		inputs: {
			binary: {
				data: Buffer.from('Hello World!').toString('base64'),
			},
		},
		workflowId: 'test-workflow-4',
	};

	try {
		const result4 = await modifyBytesActivity(context4);
		console.log(' Test 4 passed!');
		console.log('Original Size:', result4.attributes?.['bytes.originalSize']);
		console.log('Modified Size:', result4.attributes?.['bytes.modifiedSize']);
		console.log('Expected: Modified size = 5');
		console.log('');
	} catch (error) {
		console.error(' Test 4 failed!', error);
	}

	console.log(' All ModifyBytes tests completed!');
}

// Run the test
void testModifyBytes();
