/**
 * Test script to verify MergeContent node activity works
 * Run with: pnpm tsx src/test-merge-content.ts
 */

import { mergeContentActivity } from './activities/nodes/merge-content';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testMergeContent() {
	console.log('Testing MergeContent node activity...\n');

	// Test 1: Merge multiple items with default strategy
	console.log('Test 1: Merge multiple items with default strategy');
	const mockNode1: INode = {
		id: 'merge-1',
		name: 'MergeContent',
		type: 'n8n-nodes-base.mergeContent',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			mergeStrategy: 'defragment',
			delimiter: '\n',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			main: [
				[{ json: { item: 1, data: 'first' } }],
				[{ json: { item: 2, data: 'second' } }],
				[{ json: { item: 3, data: 'third' } }],
			],
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await mergeContentActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Merged Content:', result1.json);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Merge with header and footer
	console.log('Test 2: Merge with header and footer');
	const mockNode2: INode = {
		id: 'merge-2',
		name: 'MergeContent',
		type: 'n8n-nodes-base.mergeContent',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			header: '=== START ===',
			footer: '=== END ===',
			delimiter: '\n',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			main: [[{ json: 'Item 1' }], [{ json: 'Item 2' }]],
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await mergeContentActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Merged Content:', result2.json);
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Merge with max entries limit
	console.log('Test 3: Merge with max entries limit (max 2)');
	const mockNode3: INode = {
		id: 'merge-3',
		name: 'MergeContent',
		type: 'n8n-nodes-base.mergeContent',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			maxEntries: 2,
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			main: [
				[{ json: { id: 1 } }],
				[{ json: { id: 2 } }],
				[{ json: { id: 3 } }],
				[{ json: { id: 4 } }],
			],
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await mergeContentActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Merged Content (should have max 2 items):', result3.json);
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All MergeContent tests completed!');
}

// Run the test
void testMergeContent();
