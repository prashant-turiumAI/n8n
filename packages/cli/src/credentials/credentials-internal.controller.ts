import { Body, Post, RestController } from '@n8n/decorators';
import { Service } from '@n8n/di';
import { Logger } from '@n8n/backend-common';
import { TemporalConfig } from '@n8n/config';
import { UserRepository } from '@n8n/db';
import type { AuthenticatedRequest } from '@n8n/db';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';

import { ForbiddenError } from '@/errors/response-errors/forbidden.error';
import { NotFoundError } from '@/errors/response-errors/not-found.error';
import { CredentialsFinderService } from './credentials-finder.service';
import { CredentialsService } from './credentials.service';

/**
 * Internal API controller for credential resolution.
 * Used by Temporal workers to securely fetch decrypted credentials.
 *
 * This API is protected by a worker secret to ensure only authorized
 * Temporal workers can access credentials.
 */
@RestController('/internal/credentials')
export class CredentialsInternalController {
	constructor(
		private readonly credentialsService: CredentialsService,
		private readonly credentialsFinderService: CredentialsFinderService,
		private readonly userRepository: UserRepository,
		private readonly temporalConfig: TemporalConfig,
		private readonly logger: Logger,
	) {}

	/**
	 * Resolves and decrypts credentials for use in Temporal activities.
	 *
	 * Security:
	 * - Requires worker secret in X-Worker-Secret header
	 * - Verifies user has access to the credential
	 * - Returns decrypted credentials (never stored in Temporal history)
	 *
	 * @param req - Request containing credentialId and userId in body
	 * @returns Decrypted credential data
	 */
	@Post('/resolve')
	async resolve(
		req: AuthenticatedRequest & {
			body: {
				credentialId: string;
				userId: string;
			};
			headers: {
				'x-worker-secret'?: string;
			};
		},
	) {
		// Verify worker secret for authentication
		const workerSecret = req.headers['x-worker-secret'];
		if (!workerSecret || workerSecret !== this.temporalConfig.workerCredentialSecret) {
			this.logger.warn('Invalid worker secret attempt', {
				hasSecret: !!workerSecret,
				credentialId: req.body?.credentialId,
			});
			throw new ForbiddenError('Invalid worker secret');
		}

		const { credentialId, userId } = req.body;

		if (!credentialId || !userId) {
			throw new NotFoundError('credentialId and userId are required');
		}

		this.logger.debug('Resolving credential for Temporal worker', {
			credentialId,
			userId,
		});

		// Get user to verify access
		const user = await this.userRepository.findOne({ where: { id: userId } });
		if (!user) {
			throw new NotFoundError(`User with ID "${userId}" not found`);
		}

		// Find credential with user access check
		// Using credential:read and credential:update scopes to allow decryption
		const credential = await this.credentialsFinderService.findCredentialForUser(
			credentialId,
			user,
			['credential:read', 'credential:update'],
		);

		if (!credential) {
			throw new NotFoundError(
				`Credential with ID "${credentialId}" not found or user does not have access`,
			);
		}

		// Decrypt the credential data
		const decryptedData = this.credentialsService.decrypt(credential, true);

		this.logger.debug('Credential resolved successfully', {
			credentialId,
			credentialType: credential.type,
			userId,
		});

		// Return decrypted credentials
		// Note: These credentials are never stored in Temporal history
		// They are fetched on-demand when needed by activities
		return {
			credentials: decryptedData as ICredentialDataDecryptedObject,
			credentialType: credential.type,
		};
	}
}
