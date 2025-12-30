import { Config, Env } from '../decorators';

@Config
export class TemporalConfig {
	/** Whether Temporal execution mode is enabled */
	@Env('N8N_TEMPORAL_ENABLED')
	enabled: boolean = false;

	/** Temporal server address (host:port) */
	@Env('N8N_TEMPORAL_HOST')
	host: string = 'localhost:7233';

	/** Temporal namespace */
	@Env('N8N_TEMPORAL_NAMESPACE')
	namespace: string = 'default';

	/** Task queue name for n8n workflows */
	@Env('N8N_TEMPORAL_TASK_QUEUE')
	taskQueue: string = 'n8n-workflows';

	/** Secret for authenticating worker with n8n credential API */
	@Env('N8N_TEMPORAL_WORKER_CREDENTIAL_SECRET')
	workerCredentialSecret?: string;
}
