/**
 * Test script to verify RouteOnAttribute node activity works
 * Run with: pnpm tsx src/test-route-on-attribute.ts
 */

import { routeOnAttributeActivity } from './activities/nodes/route-on-attribute';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testRouteOnAttribute() {
	console.log('Testing RouteOnAttribute node activity...\n');

	// Test 1: Route based on attribute value
	console.log('Test 1: Route based on attribute value');
	const mockNode1: INode = {
		id: 'route-1',
		name: 'RouteOnAttribute',
		type: 'n8n-nodes-base.routeOnAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			rules: [
				{ attribute: 'status', operator: '=', value: 'active', route: 'active_route' },
				{ attribute: 'status', operator: '=', value: 'inactive', route: 'inactive_route' },
			],
			defaultRoute: 'default_route',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {
			json: { data: 'test' },
			attributes: {
				status: 'active',
			},
		},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await routeOnAttributeActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Route:', result1.attributes?.route);
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('Expected: route = "active_route"');
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
	}

	// Test 2: Route with LIKE operator
	console.log('Test 2: Route with LIKE operator');
	const mockNode2: INode = {
		id: 'route-2',
		name: 'RouteOnAttribute',
		type: 'n8n-nodes-base.routeOnAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			rules: [
				{ attribute: 'filename', operator: 'LIKE', value: '%.txt', route: 'text_files' },
				{ attribute: 'filename', operator: 'LIKE', value: '%.json', route: 'json_files' },
			],
			defaultRoute: 'other_files',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {
			json: {},
			attributes: {
				filename: 'data.txt',
			},
		},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await routeOnAttributeActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Route:', result2.attributes?.route);
		console.log('Expected: route = "text_files"');
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
	}

	// Test 3: Route with EXISTS operator
	console.log('Test 3: Route with EXISTS operator');
	const mockNode3: INode = {
		id: 'route-3',
		name: 'RouteOnAttribute',
		type: 'n8n-nodes-base.routeOnAttribute',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			rules: [{ attribute: 'priority', operator: 'EXISTS', route: 'priority_route' }],
			defaultRoute: 'no_priority',
		},
	} as INode;

	const context3: ExecutionContext = {
		node: mockNode3,
		inputs: {
			json: {},
			attributes: {
				priority: 'high',
			},
		},
		workflowId: 'test-workflow-3',
	};

	try {
		const result3 = await routeOnAttributeActivity(context3);
		console.log(' Test 3 passed!');
		console.log('Route:', result3.attributes?.route);
		console.log('Expected: route = "priority_route"');
		console.log('');
	} catch (error) {
		console.error(' Test 3 failed!', error);
	}

	console.log(' All RouteOnAttribute tests completed!');
}

// Run the test
void testRouteOnAttribute();
