import { Config, Env } from '../decorators';

@Config
export class TemporalConfig {
	/** Whether Temporal workflow execution is enabled. */
	@Env('TEMPORAL_ENABLED')
	enabled: boolean = false;

	/** Temporal server address (host:port). */
	@Env('TEMPORAL_HOST')
	host: string = 'localhost:7233';

	/** Temporal namespace. */
	@Env('TEMPORAL_NAMESPACE')
	namespace: string = 'default';

	/** Temporal task queue name for n8n workflows. */
	@Env('TEMPORAL_TASK_QUEUE')
	taskQueue: string = 'n8n-workflows';

	/** Secret key for authenticating Temporal worker with n8n credential API. */
	@Env('TEMPORAL_WORKER_CREDENTIAL_SECRET')
	workerCredentialSecret: string = '';

	/** Whether TLS is enabled for Temporal connection. */
	@Env('TEMPORAL_TLS_ENABLED')
	tlsEnabled: boolean = false;

	/** Path to TLS certificate file. */
	@Env('TEMPORAL_TLS_CERT_PATH')
	tlsCertPath?: string;

	/** Path to TLS key file. */
	@Env('TEMPORAL_TLS_KEY_PATH')
	tlsKeyPath?: string;
}
