import type { ExecutionMetadata } from '@n8n/db';
import { ExecutionMetadataRepository } from '@n8n/db';
import { Service } from '@n8n/di';

@Service()
export class ExecutionMetadataService {
	constructor(private readonly executionMetadataRepository: ExecutionMetadataRepository) {}

	async save(executionId: string, executionMetadata: Record<string, string>): Promise<void> {
		const metadataRows: Array<Pick<ExecutionMetadata, 'executionId' | 'key' | 'value'>> = [];
		for (const [key, value] of Object.entries(executionMetadata)) {
			metadataRows.push({
				executionId,
				key,
				value,
			});
		}

		await this.executionMetadataRepository.upsert(metadataRows, {
			conflictPaths: { executionId: true, key: true },
		});
	}

	/**
	 * Retrieves execution metadata by executionId.
	 * @param executionId - The execution ID
	 * @returns Record of metadata key-value pairs
	 */
	async get(executionId: string): Promise<Record<string, string>> {
		const metadata = await this.executionMetadataRepository.find({
			where: { executionId },
		});

		const result: Record<string, string> = {};
		for (const item of metadata) {
			result[item.key] = item.value;
		}

		return result;
	}
}
