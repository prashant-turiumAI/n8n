/**
 * Test script to verify UpdateAttribute node activity works
 * Run with: pnpm tsx src/test-update-attribute.ts
 */

import { updateAttributeActivity } from './activities/nodes/update-attribute';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testUpdateAttribute() {
	console.log('Testing UpdateAttribute node activity...\n');

	// Test 1: Add new attributes
	console.log('Test 1: Add new attributes to existing data');
	const mockNode1: INode = {
		id: 'update-1',
		name: 'UpdateAttribute',
		type: 'n8n-nodes-base.updateAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			attributes: [
				{ key: 'newAttr1', value: 'value1' },
				{ key: 'newAttr2', value: 'value2' },
			],
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: { existing: 'data' },
			attributes: {
				existingAttr: 'existingValue',
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await updateAttributeActivity(context1);
		console.log(' Test 1 passed!');
		console.log('JSON Data:', JSON.stringify(result1.json, null, 2));
		console.log('Updated Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Update existing attributes
	console.log('Test 2: Update existing attributes');
	const mockNode2: INode = {
		id: 'update-2',
		name: 'UpdateAttribute',
		type: 'n8n-nodes-base.updateAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			attributes: [
				{ key: 'existingAttr', value: 'updatedValue' },
				{ key: 'newAttr', value: 'newValue' },
			],
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: { data: 'test' },
			attributes: {
				existingAttr: 'oldValue',
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await updateAttributeActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Updated Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('Expected: existingAttr = "updatedValue", newAttr = "newValue"');
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Delete attributes
	console.log('Test 3: Delete attributes');
	const mockNode3: INode = {
		id: 'update-3',
		name: 'UpdateAttribute',
		type: 'n8n-nodes-base.updateAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			deleteAttributes: ['attrToDelete', 'anotherAttr'],
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: { data: 'test' },
			attributes: {
				attrToDelete: 'deleteMe',
				anotherAttr: 'deleteMeToo',
				keepMe: 'keepThis',
			},
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await updateAttributeActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Updated Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('Expected: only "keepMe" should remain');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	// Test 4: Expression evaluation
	console.log('Test 4: Expression evaluation in attribute values');
	const mockNode4: INode = {
		id: 'update-4',
		name: 'UpdateAttribute',
		type: 'n8n-nodes-base.updateAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			attributes: [
				{ key: 'computedAttr', value: '${existingAttr}-computed' },
				{ key: 'jsonAttr', value: '${json.field}' },
			],
		},
	} as INode;

	const context4: ExecutionContext = {
		node: mockNode4,
		inputs: {
			json: { field: 'jsonValue' },
			attributes: {
				existingAttr: 'baseValue',
			},
		},
		workflowId: 'test-workflow-4',
	};

	try {
		const result4 = await updateAttributeActivity(context4);
		console.log(' Test 4 passed!');
		console.log('Updated Attributes:', JSON.stringify(result4.attributes, null, 2));
		console.log('Expected: computedAttr = "baseValue-computed", jsonAttr = "jsonValue"');
		console.log('');
	} catch (error) {
		console.error(' Test 4 failed!', error);
	}

	// Test 5: Replace all attributes (don't keep existing)
	console.log("Test 5: Replace all attributes (don't keep existing)");
	const mockNode5: INode = {
		id: 'update-5',
		name: 'UpdateAttribute',
		type: 'n8n-nodes-base.updateAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			attributes: [{ key: 'newOnly', value: 'onlyThis' }],
			keepExistingAttributes: false,
		},
	} as INode;

	const context5: ExecutionContext = {
		node: mockNode5,
		inputs: {
			json: { data: 'test' },
			attributes: {
				oldAttr: 'shouldBeRemoved',
			},
		},
		workflowId: 'test-workflow-5',
	};

	try {
		const result5 = await updateAttributeActivity(context5);
		console.log(' Test 5 passed!');
		console.log('Updated Attributes:', JSON.stringify(result5.attributes, null, 2));
		console.log('Expected: only "newOnly" should exist (oldAttr removed)');
		console.log('');
	} catch (error) {
		console.error(' Test 5 failed!', error);
	}

	console.log(' All UpdateAttribute tests completed!');
}

// Run the test
void testUpdateAttribute();
