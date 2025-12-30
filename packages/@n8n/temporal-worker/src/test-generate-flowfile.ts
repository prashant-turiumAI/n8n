/**
 * Test script to verify GenerateFlowFile node activity works
 * Run with: pnpm tsx src/test-generate-flowfile.ts
 */

import { generateFlowFileActivity } from './activities/nodes/generate-flowfile';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testGenerateFlowFile() {
	console.log('Testing GenerateFlowFile node activity...\n');

	// Test 1: Generate flow file with custom content
	console.log('Test 1: Generate flow file with custom text content');
	const mockNode1: INode = {
		id: 'generate-1',
		name: 'GenerateFlowFile',
		type: 'n8n-nodes-base.generateFlowFile',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			content: 'Hello, this is a test flow file!',
			dataFormat: 'text',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			content: 'Hello, this is a test flow file!',
			dataFormat: 'text',
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await generateFlowFileActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Generated Content:', result1.json);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Generate flow file with JSON content
	console.log('Test 2: Generate flow file with JSON content');
	const mockNode2: INode = {
		id: 'generate-2',
		name: 'GenerateFlowFile',
		type: 'n8n-nodes-base.generateFlowFile',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			content: '{"name": "Test", "value": 123}',
			dataFormat: 'json',
			attributes: {
				customAttr: 'customValue',
			},
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			content: '{"name": "Test", "value": 123}',
			dataFormat: 'json',
			attributes: {
				customAttr: 'customValue',
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await generateFlowFileActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Generated JSON:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Generate empty flow file
	console.log('Test 3: Generate empty flow file');
	const mockNode3: INode = {
		id: 'generate-3',
		name: 'GenerateFlowFile',
		type: 'n8n-nodes-base.generateFlowFile',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await generateFlowFileActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Generated Content:', result3.json);
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	// Test 4: Generate flow file with specific size
	console.log('Test 4: Generate flow file with specific size (100 bytes)');
	const mockNode4: INode = {
		id: 'generate-4',
		name: 'GenerateFlowFile',
		type: 'n8n-nodes-base.generateFlowFile',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			fileSize: 100,
		},
	} as INode;

	const context4: ExecutionContext = {
		node: mockNode4,
		inputs: {
			fileSize: 100,
		},
		workflowId: 'test-workflow-4',
	};

	try {
		const result4 = await generateFlowFileActivity(context4);
		console.log(' Test 4 passed!');
		console.log('Generated Content Length:', String(result4.json).length);
		console.log('Expected Size: 100 bytes');
		console.log('Attributes:', JSON.stringify(result4.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 4 failed!', error);
	}

	console.log(' All GenerateFlowFile tests completed!');
}

// Run the test
void testGenerateFlowFile();
