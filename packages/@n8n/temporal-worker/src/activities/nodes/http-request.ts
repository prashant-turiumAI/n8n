import { log } from '@temporalio/activity';
import type { NodeActivityInput, NodeActivityOutput } from '../base-activity';
import { resolveCredentialActivity } from '../credentials';

/**
 * Activity for executing HTTP Request nodes.
 * HTTP Request nodes make HTTP requests to external APIs.
 *
 * This implementation demonstrates credential resolution flow:
 * 1. Check if node requires credentials
 * 2. Resolve credentials using credential activity
 * 3. Use credentials for authentication
 * 4. Make HTTP request
 * 5. Return response data
 */
export async function executeHttpRequestActivity(
	input: NodeActivityInput,
): Promise<NodeActivityOutput> {
	const { node, inputData, executionId, userId, n8nApiUrl, workerSecret } = input;

	log.info('Executing HTTP Request node', {
		nodeName: node.name,
		executionId,
	});

	try {
		// Step 1: Check if node requires credentials
		let credentials: Record<string, unknown> | undefined;
		if (node.credentials && n8nApiUrl && workerSecret) {
			// Get the credential type from node (e.g., 'oAuth2Api', 'httpBasicAuth', etc.)
			const credentialTypes = Object.keys(node.credentials);
			if (credentialTypes.length > 0) {
				const credentialType = credentialTypes[0];
				const credentialDetails = node.credentials[credentialType];

				if (credentialDetails && credentialDetails.id) {
					log.info('Resolving credentials for HTTP Request node', {
						nodeName: node.name,
						credentialType,
						credentialId: credentialDetails.id,
						executionId,
					});

					// Step 2: Resolve credentials using credential activity
					// This calls the n8n internal API to get decrypted credentials
					try {
						credentials = await resolveCredentialActivity(
							credentialDetails.id,
							userId || 'system',
							n8nApiUrl,
							workerSecret,
						);

						log.info('Credentials resolved successfully', {
							nodeName: node.name,
							credentialType,
							executionId,
						});
					} catch (credError) {
						log.error('Failed to resolve credentials', {
							error: credError,
							nodeName: node.name,
							credentialId: credentialDetails.id,
							executionId,
						});
						throw new Error(
							`Failed to resolve credentials for HTTP Request: ${credError instanceof Error ? credError.message : String(credError)}`,
						);
					}
				}
			}
		}

		// TODO: Implement full HTTP Request logic:
		// 3. Get node parameters (method, url, headers, body, etc.)
		// 4. Apply credentials to request (headers, auth, etc.)
		// 5. Make HTTP request using credentials
		// 6. Process response
		// 7. Return response data

		log.warn('HTTP Request node execution not yet fully implemented', {
			nodeName: node.name,
			hasCredentials: !!credentials,
			executionId,
		});

		// For now, return input data with credential info (placeholder)
		// In full implementation, this would make the actual HTTP request
		return {
			data: inputData || [
				[
					{
						json: {
							message: 'HTTP Request node executed (placeholder)',
							credentialsResolved: !!credentials,
							note: 'Full HTTP request implementation pending',
						},
					},
				],
			],
		};
	} catch (error) {
		log.error('HTTP Request node execution failed', {
			error,
			nodeName: node.name,
			executionId,
		});

		return {
			data: [],
			error: {
				message: error instanceof Error ? error.message : String(error),
				nodeName: node.name,
			},
		};
	}
}
