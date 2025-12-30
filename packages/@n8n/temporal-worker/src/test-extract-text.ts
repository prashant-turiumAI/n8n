/**
 * Test script to verify ExtractText node activity works
 * Run with: pnpm tsx src/test-extract-text.ts
 */

import { extractTextActivity } from './activities/nodes/extract-text';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testExtractText() {
	console.log('Testing ExtractText node activity...\n');

	// Test 1: Extract email addresses using regex
	console.log('Test 1: Extract email addresses using regex');
	const mockNode1: INode = {
		id: 'extract-1',
		name: 'ExtractText',
		type: 'n8n-nodes-base.extractText',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			regex: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
			extractAll: true,
			attributeName: 'emails',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: 'Contact us at support@example.com or sales@test.com for more info.',
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await extractTextActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Original JSON:', result1.json);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Extract from JSON field
	console.log('Test 2: Extract from JSON field');
	const mockNode2: INode = {
		id: 'extract-2',
		name: 'ExtractText',
		type: 'n8n-nodes-base.extractText',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			extractFromJson: true,
			jsonPath: 'data.text',
			regex: '\\d+',
			attributeName: 'numbers',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: {
				data: {
					text: 'The price is 100 dollars and quantity is 50 units.',
				},
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await extractTextActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Original JSON:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Extract first match only
	console.log('Test 3: Extract first match only');
	const mockNode3: INode = {
		id: 'extract-3',
		name: 'ExtractText',
		type: 'n8n-nodes-base.extractText',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			regex: '\\d+',
			extractAll: false,
			attributeName: 'firstNumber',
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: 'There are 10 apples and 20 oranges.',
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await extractTextActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('Expected: firstNumber = "10" (first match only)');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All ExtractText tests completed!');
}

// Run the test
void testExtractText();
