import { Connection, Client } from '@temporalio/client';
import { Service } from '@n8n/di';
import { Logger } from '@n8n/backend-common';
import { TemporalConfig } from '@n8n/config';

/**
 * Service for managing Temporal client connections.
 * Handles connection lifecycle and provides access to Temporal client.
 */
@Service()
export class TemporalClientService {
	private client: Client | null = null;
	private connection: Connection | null = null;

	constructor(
		private readonly logger: Logger,
		private readonly temporalConfig: TemporalConfig,
	) {}

	/**
	 * Connects to Temporal server and returns the client.
	 * Reuses existing connection if already connected.
	 */
	async connect(): Promise<Client> {
		if (this.client) {
			return this.client;
		}

		if (!this.temporalConfig.enabled) {
			throw new Error('Temporal is not enabled');
		}

		try {
			const connectionOptions: Parameters<typeof Connection.connect>[0] = {
				address: this.temporalConfig.host,
			};

			// Add TLS configuration if enabled
			if (this.temporalConfig.tlsEnabled) {
				// TODO: Implement TLS configuration when needed
				// connectionOptions.tls = {
				//   clientCertPair: {
				//     crt: await fs.readFile(this.temporalConfig.tlsCertPath!),
				//     key: await fs.readFile(this.temporalConfig.tlsKeyPath!),
				//   },
				// };
				this.logger.warn('TLS configuration not yet implemented for Temporal connection');
			}

			this.connection = await Connection.connect(connectionOptions);

			this.client = new Client({
				connection: this.connection,
				namespace: this.temporalConfig.namespace,
			});

			this.logger.info('Connected to Temporal server', {
				address: this.temporalConfig.host,
				namespace: this.temporalConfig.namespace,
			});

			return this.client;
		} catch (error) {
			this.logger.error('Failed to connect to Temporal', { error });
			throw error;
		}
	}

	/**
	 * Gets the Temporal client.
	 * Throws error if not connected.
	 */
	getClient(): Client {
		if (!this.client) {
			throw new Error('Temporal client not connected. Call connect() first.');
		}
		return this.client;
	}

	/**
	 * Disconnects from Temporal server and cleans up resources.
	 */
	async disconnect(): Promise<void> {
		if (this.connection) {
			await this.connection.close();
			this.connection = null;
			this.client = null;
			this.logger.info('Disconnected from Temporal server');
		}
	}
}
