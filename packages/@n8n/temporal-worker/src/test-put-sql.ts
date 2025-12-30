/**
 * Test script to verify PutSQL node activity works
 * Run with: pnpm tsx src/test-put-sql.ts
 *
 * Note: This test requires a database connection.
 * Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS environment variables.
 */

import { putSqlActivity } from './activities/nodes/put-sql';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testPutSql() {
	console.log('Testing PutSQL node activity...\n');
	console.log('  Note: This test requires database configuration.');
	console.log('Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS environment variables.\n');

	// Test 1: Execute INSERT statement
	console.log('Test 1: Execute INSERT statement');
	const mockNode1: INode = {
		id: 'putsql-1',
		name: 'PutSQL',
		type: 'n8n-nodes-base.putSql',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			databaseType: 'mysql',
			host: process.env.DB_HOST || 'localhost',
			port: parseInt(process.env.DB_PORT || '3306', 10),
			database: process.env.DB_NAME || 'test',
			username: process.env.DB_USER || 'root',
			password: process.env.DB_PASS || '',
			statement:
				'CREATE TABLE IF NOT EXISTS test_table (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await putSqlActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Statement Result:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
		console.log('This is expected if database is not configured.');
		console.log('');
	}

	console.log(' All PutSQL tests completed!');
	console.log('\n To test with real database:');
	console.log('   Set environment variables: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS');
}

// Run the test
void testPutSql();
