/**
 * Test script to verify ReplaceText node activity works
 * Run with: pnpm tsx src/test-replace-text.ts
 */

import { replaceTextActivity } from './activities/nodes/replace-text';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testReplaceText() {
	console.log('Testing ReplaceText node activity...\n');

	// Test 1: Simple string replacement
	console.log('Test 1: Simple string replacement');
	const mockNode1: INode = {
		id: 'replace-1',
		name: 'ReplaceText',
		type: 'n8n-nodes-base.replaceText',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			searchValue: 'old',
			replaceValue: 'new',
			replaceAll: true,
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: 'The old text is old and needs to be replaced.',
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await replaceTextActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Original:', 'The old text is old and needs to be replaced.');
		console.log('Replaced:', result1.json);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Regex replacement
	console.log('Test 2: Regex replacement');
	const mockNode2: INode = {
		id: 'replace-2',
		name: 'ReplaceText',
		type: 'n8n-nodes-base.replaceText',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			searchValue: '\\d+',
			replaceValue: 'NUMBER',
			useRegex: true,
			replaceAll: true,
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: 'There are 10 apples and 20 oranges.',
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await replaceTextActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Original:', 'There are 10 apples and 20 oranges.');
		console.log('Replaced:', result2.json);
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Replace first occurrence only
	console.log('Test 3: Replace first occurrence only');
	const mockNode3: INode = {
		id: 'replace-3',
		name: 'ReplaceText',
		type: 'n8n-nodes-base.replaceText',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			searchValue: 'test',
			replaceValue: 'TEST',
			replaceAll: false,
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: 'This is a test and another test.',
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await replaceTextActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Original:', 'This is a test and another test.');
		console.log('Replaced:', result3.json);
		console.log('Expected: Only first "test" replaced');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All ReplaceText tests completed!');
}

// Run the test
void testReplaceText();
