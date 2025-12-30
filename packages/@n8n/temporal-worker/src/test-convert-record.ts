/**
 * Test script to verify ConvertRecord node activity works
 * Run with: pnpm tsx src/test-convert-record.ts
 */

import { convertRecordActivity } from './activities/nodes/convert-record';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testConvertRecord() {
	console.log('Testing ConvertRecord node activity...\n');

	// Test 1: Convert JSON to CSV
	console.log('Test 1: Convert JSON array to CSV');
	const mockNode1: INode = {
		id: 'convert-1',
		name: 'ConvertRecord',
		type: 'n8n-nodes-base.convertRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			inputFormat: 'json',
			outputFormat: 'csv',
			csvHeader: true,
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: [
				{ name: 'John', age: 30, city: 'New York' },
				{ name: 'Jane', age: 25, city: 'London' },
			],
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await convertRecordActivity(context1);
		console.log(' Test 1 passed!');
		console.log('CSV Output:');
		console.log(result1.json);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Convert CSV to JSON
	console.log('Test 2: Convert CSV to JSON');
	const mockNode2: INode = {
		id: 'convert-2',
		name: 'ConvertRecord',
		type: 'n8n-nodes-base.convertRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			inputFormat: 'csv',
			outputFormat: 'json',
			csvHeader: true,
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: 'name,age,city\nJohn,30,New York\nJane,25,London',
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await convertRecordActivity(context2);
		console.log(' Test 2 passed!');
		console.log('JSON Output:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Convert JSON to XML
	console.log('Test 3: Convert JSON to XML');
	const mockNode3: INode = {
		id: 'convert-3',
		name: 'ConvertRecord',
		type: 'n8n-nodes-base.convertRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			inputFormat: 'json',
			outputFormat: 'xml',
			xmlRootElement: 'users',
			xmlRecordElement: 'user',
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: [
				{ name: 'John', age: 30 },
				{ name: 'Jane', age: 25 },
			],
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await convertRecordActivity(context3);
		console.log(' Test 3 passed!');
		console.log('XML Output:');
		console.log(result3.json);
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	// Test 4: Convert single JSON object to CSV
	console.log('Test 4: Convert single JSON object to CSV');
	const mockNode4: INode = {
		id: 'convert-4',
		name: 'ConvertRecord',
		type: 'n8n-nodes-base.convertRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			inputFormat: 'json',
			outputFormat: 'csv',
			csvHeader: true,
		},
	} as INode;

	const context4: ExecutionContext = {
		node: mockNode4,
		inputs: {
			json: { name: 'John', age: 30, city: 'New York' },
		},
		workflowId: 'test-workflow-4',
	};

	try {
		const result4 = await convertRecordActivity(context4);
		console.log(' Test 4 passed!');
		console.log('CSV Output:');
		console.log(result4.json);
		console.log('');
	} catch (error) {
		console.error(' Test 4 failed!', error);
	}

	console.log(' All ConvertRecord tests completed!');
}

// Run the test
void testConvertRecord();
