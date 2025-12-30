/**
 * Test script to verify PutEmail node activity works
 * Run with: pnpm tsx src/test-put-email.ts
 *
 * Note: This test requires a valid SMTP server configuration.
 * For testing, you can use a service like Mailtrap or configure a local SMTP server.
 */

import { putEmailActivity } from './activities/nodes/put-email';
import type { ExecutionContext } from './types';
import type { INode } from 'n8n-workflow';

async function testPutEmail() {
	console.log('Testing PutEmail node activity...\n');
	console.log('  Note: This test requires SMTP configuration.');
	console.log('Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS environment variables.\n');

	// Test 1: Send simple text email
	console.log('Test 1: Send simple text email');
	const mockNode1: INode = {
		id: 'email-1',
		name: 'PutEmail',
		type: 'n8n-nodes-base.putEmail',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			smtpHost: process.env.SMTP_HOST || 'localhost',
			smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
			smtpUsername: process.env.SMTP_USER,
			smtpPassword: process.env.SMTP_PASS,
			useTLS: true,
			from: process.env.SMTP_FROM || 'test@example.com',
			to: process.env.SMTP_TO || 'recipient@example.com',
			subject: 'Test Email from n8n Temporal Worker',
			text: 'This is a test email sent from the PutEmail node activity.',
		},
	} as INode;

	const context1: ExecutionContext = {
		node: mockNode1,
		inputs: {},
		workflowId: 'test-workflow-1',
	};

	try {
		const result1 = await putEmailActivity(context1);
		console.log(' Test 1 passed!');
		console.log('Email Result:', JSON.stringify(result1.json, null, 2));
		console.log('Attributes:', JSON.stringify(result1.attributes, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 1 failed!', error);
		console.log('This is expected if SMTP is not configured.');
		console.log('');
	}

	// Test 2: Send HTML email
	console.log('Test 2: Send HTML email');
	const mockNode2: INode = {
		id: 'email-2',
		name: 'PutEmail',
		type: 'n8n-nodes-base.putEmail',
		typeVersion: 1,
		position: [0, 0],
		parameters: {
			smtpHost: process.env.SMTP_HOST || 'localhost',
			smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
			smtpUsername: process.env.SMTP_USER,
			smtpPassword: process.env.SMTP_PASS,
			useTLS: true,
			from: process.env.SMTP_FROM || 'test@example.com',
			to: process.env.SMTP_TO || 'recipient@example.com',
			subject: 'Test HTML Email',
			html: '<h1>Test Email</h1><p>This is an <strong>HTML</strong> email.</p>',
		},
	} as INode;

	const context2: ExecutionContext = {
		node: mockNode2,
		inputs: {},
		workflowId: 'test-workflow-2',
	};

	try {
		const result2 = await putEmailActivity(context2);
		console.log(' Test 2 passed!');
		console.log('Email Result:', JSON.stringify(result2.json, null, 2));
		console.log('');
	} catch (error) {
		console.error(' Test 2 failed!', error);
		console.log('This is expected if SMTP is not configured.');
		console.log('');
	}

	console.log(' All PutEmail tests completed!');
	console.log('\n To test with real SMTP:');
	console.log(
		'   Set environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_TO',
	);
}

// Run the test
void testPutEmail();
