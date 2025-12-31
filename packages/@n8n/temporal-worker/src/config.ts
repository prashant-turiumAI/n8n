import { Config, Nested, TemporalConfig } from '@n8n/config';

@Config
export class TemporalWorkerConfig {
	@Nested
	temporal!: TemporalConfig;
}
