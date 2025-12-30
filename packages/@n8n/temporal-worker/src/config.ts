import { Container } from '@n8n/di';

import { TemporalConfig } from '@n8n/config';

export function getTemporalConfig(): TemporalConfig {
	return Container.get(TemporalConfig);
}
