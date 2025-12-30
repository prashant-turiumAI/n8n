/**
 * Test script to verify QueryRecord node activity works
 * Run with: pnpm tsx src/test-query-record.ts
 */

import { queryRecordActivity } from './activities/nodes/query-record';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testQueryRecord() {
	console.log('Testing QueryRecord node activity...\n');

	// Test 1: Query with WHERE condition
	console.log('Test 1: Query with WHERE condition');
	const mockNode1: INode = {
		id: 'query-1',
		name: 'QueryRecord',
		type: 'n8n-nodes-base.queryRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			whereConditions: [{ field: 'age', operator: '>', value: 25 }],
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: [
				{ name: 'John', age: 30, city: 'New York' },
				{ name: 'Jane', age: 25, city: 'London' },
				{ name: 'Bob', age: 35, city: 'Paris' },
			],
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await queryRecordActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Query Results:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('Expected: Only records with age > 25');
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Query with SELECT fields and ORDER BY
	console.log('Test 2: Query with SELECT fields and ORDER BY');
	const mockNode2: INode = {
		id: 'query-2',
		name: 'QueryRecord',
		type: 'n8n-nodes-base.queryRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			selectFields: ['name', 'age'],
			orderBy: {
				field: 'age',
				direction: 'DESC',
			},
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: [
				{ name: 'John', age: 30, city: 'New York' },
				{ name: 'Jane', age: 25, city: 'London' },
				{ name: 'Bob', age: 35, city: 'Paris' },
			],
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await queryRecordActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Query Results:', JSON.stringify(result2.json, null, 2));
		console.log('Attributes:', JSON.stringify(result2.attributes, null, 2));
		console.log('Expected: Only name and age fields, sorted by age DESC');
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Query with LIMIT
	console.log('Test 3: Query with LIMIT');
	const mockNode3: INode = {
		id: 'query-3',
		name: 'QueryRecord',
		type: 'n8n-nodes-base.queryRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			limit: 2,
			orderBy: {
				field: 'age',
				direction: 'ASC',
			},
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: [
				{ name: 'John', age: 30, city: 'New York' },
				{ name: 'Jane', age: 25, city: 'London' },
				{ name: 'Bob', age: 35, city: 'Paris' },
			],
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await queryRecordActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Query Results:', JSON.stringify(result3.json, null, 2));
		console.log('Attributes:', JSON.stringify(result3.attributes, null, 2));
		console.log('Expected: Only 2 records, sorted by age ASC');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	// Test 4: Query with LIKE operator
	console.log('Test 4: Query with LIKE operator');
	const mockNode4: INode = {
		id: 'query-4',
		name: 'QueryRecord',
		type: 'n8n-nodes-base.queryRecord',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			whereConditions: [{ field: 'name', operator: 'LIKE', value: 'J%' }],
		},
	} as INode;

	const context4: ExecutionContext = {
		node: mockNode4,
		inputs: {
			json: [
				{ name: 'John', age: 30 },
				{ name: 'Jane', age: 25 },
				{ name: 'Bob', age: 35 },
			],
		},
		workflowId: 'test-workflow-4',
	};

	try {
		const result4 = await queryRecordActivity(context4);
		console.log(' Test 4 passed!');
		console.log('Query Results:', JSON.stringify(result4.json, null, 2));
		console.log('Expected: Only names starting with "J"');
		console.log('');
	} catch (error) {
		console.error(' Test 4 failed!', error);
	}

	console.log(' All QueryRecord tests completed!');
}

// Run the test
void testQueryRecord();
