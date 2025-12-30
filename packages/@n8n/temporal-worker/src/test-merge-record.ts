/**
 * Test script to verify MergeRecord node activity works
 * Run with: pnpm tsx src/test-merge-record.ts
 */

import { mergeRecordActivity } from './activities/nodes/merge-record';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testMergeRecord() {
	console.log('Testing MergeRecord node activity...\n');

	// Test 1: Merge records with default strategy
	console.log('Test 1: Merge records with default strategy');
	const mockNode1: INode = {
		id: 'merge-1',
		name: 'MergeRecord',
		type: 'n8n-nodes-base.mergeRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			mergeStrategy: 'defragment',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: [
				{ id: 1, name: 'Record 1' },
				{ id: 2, name: 'Record 2' },
				{ id: 3, name: 'Record 3' },
			],
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await mergeRecordActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Merged Records Count:', Array.isArray(result1.json) ? result1.json.length : 0);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Merge with correlation attribute
	console.log('Test 2: Merge with correlation attribute');
	const mockNode2: INode = {
		id: 'merge-2',
		name: 'MergeRecord',
		type: 'n8n-nodes-base.mergeRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			correlationAttribute: 'category',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: [
				{ id: 1, name: 'Item 1', category: 'A' },
				{ id: 2, name: 'Item 2', category: 'B' },
				{ id: 3, name: 'Item 3', category: 'A' },
			],
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await mergeRecordActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Merged Records:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	console.log(' All MergeRecord tests completed!');
}

// Run the test
void testMergeRecord();
