import { describe, it, expect } from '@jest/globals';

import { httpRequestActivity } from '../http-request';
import type { ExecutionContext } from '../../../types';
import type { INode } from 'n8n-workflow';

describe('HTTP Request Activity', () => {
	it('should make a GET request successfully', async () => {
		const mockNode: INode = {
			id: 'test-node',
			name: 'HTTP Request',
			type: 'n8n-nodes-base.httpRequest',
			typeVersion: 1,
			position: [0, 0],
			parameters: {
				url: 'https://httpbin.org/get',
				method: 'GET',
			},
		} as INode;

		const context: ExecutionContext = {
			node: mockNode,
			inputs: {
				url: 'https://httpbin.org/get',
				method: 'GET',
			},
			workflowId: 'test-workflow',
		};

		const result = await httpRequestActivity(context);

		expect(result).toHaveProperty('statusCode');
		expect(result.statusCode).toBe(200);
		expect(result).toHaveProperty('body');
		expect(result).toHaveProperty('headers');
	}, 10000);
});
