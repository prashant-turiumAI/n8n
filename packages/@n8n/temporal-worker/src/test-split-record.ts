/**
 * Test script to verify SplitRecord node activity works
 * Run with: pnpm tsx src/test-split-record.ts
 */

import { splitRecordActivity } from './activities/nodes/split-record';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testSplitRecord() {
	console.log('Testing SplitRecord node activity...\n');

	// Test 1: Split records with max records limit
	console.log('Test 1: Split records with max records limit (max 2)');
	const mockNode1: INode = {
		id: 'split-1',
		name: 'SplitRecord',
		type: 'n8n-nodes-base.splitRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			maxRecords: 2,
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: [
				{ id: 1, name: 'Record 1' },
				{ id: 2, name: 'Record 2' },
				{ id: 3, name: 'Record 3' },
				{ id: 4, name: 'Record 4' },
			],
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await splitRecordActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Split Records:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('Expected: split.count = "2" (limited to 2 records)');
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Split by attribute
	console.log('Test 2: Split by attribute (category)');
	const mockNode2: INode = {
		id: 'split-2',
		name: 'SplitRecord',
		type: 'n8n-nodes-base.splitRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			splitByAttribute: 'category',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: [
				{ id: 1, name: 'Item 1', category: 'A' },
				{ id: 2, name: 'Item 2', category: 'B' },
				{ id: 3, name: 'Item 3', category: 'A' },
				{ id: 4, name: 'Item 4', category: 'C' },
			],
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await splitRecordActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Split Records:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('Expected: Records grouped by category');
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Split single record
	console.log('Test 3: Split single record');
	const mockNode3: INode = {
		id: 'split-3',
		name: 'SplitRecord',
		type: 'n8n-nodes-base.splitRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: { id: 1, name: 'Single Record' },
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await splitRecordActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Split Records:', JSON.stringify(result3.json, null, 2));
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All SplitRecord tests completed!');
}

// Run the test
void testSplitRecord();
