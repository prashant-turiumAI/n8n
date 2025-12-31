import { log } from '@temporalio/activity';

/**
 * Resolves credentials by calling n8n's internal credential API.
 *
 * This activity fetches decrypted credentials on-demand from the n8n server.
 * Credentials are never stored in Temporal history for security.
 *
 * @param credentialId - The credential ID to resolve
 * @param userId - The user ID who owns/accesses the credential
 * @param n8nApiUrl - The base URL of the n8n API (e.g., http://localhost:5678)
 * @param workerSecret - The secret key for authenticating with n8n's internal API
 * @returns Decrypted credential data
 */
export async function resolveCredentialActivity(
	credentialId: string,
	userId: string,
	n8nApiUrl: string,
	workerSecret: string,
): Promise<Record<string, unknown>> {
	log.info('Resolving credential', { credentialId, userId });

	if (!credentialId || !userId) {
		throw new Error('credentialId and userId are required');
	}

	if (!workerSecret) {
		throw new Error('Worker secret is required for credential resolution');
	}

	try {
		const response = await fetch(`${n8nApiUrl}/internal/credentials/resolve`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-worker-secret': workerSecret,
			},
			body: JSON.stringify({ credentialId, userId }),
		});

		if (!response.ok) {
			const errorText = await response.text();
			log.error('Failed to resolve credential', {
				credentialId,
				userId,
				status: response.status,
				statusText: response.statusText,
				error: errorText,
			});
			throw new Error(
				`Failed to resolve credential: ${response.status} ${response.statusText} - ${errorText}`,
			);
		}

		const result = await response.json();
		log.info('Credential resolved successfully', {
			credentialId,
			credentialType: result.credentialType,
		});

		return result.credentials as Record<string, unknown>;
	} catch (error) {
		log.error('Error resolving credential', {
			error,
			credentialId,
			userId,
		});
		throw error;
	}
}
