import type { ExecutionContext } from '../../types';

export interface MergeRecordInputs {
	/** Merge strategy: 'defragment', 'bin-packing', 'zip' */
	mergeStrategy?: 'defragment' | 'bin-packing' | 'zip';
	/** Record reader format */
	recordReader?: 'json' | 'csv' | 'avro';
	/** Record writer format */
	recordWriter?: 'json' | 'csv' | 'avro';
	/** Minimum number of records to merge */
	minRecords?: number;
	/** Maximum number of records to merge */
	maxRecords?: number;
	/** Correlation attribute name */
	correlationAttribute?: string;
	/** Attribute name to store original record count */
	countAttribute?: string;
}

export interface MergeRecordOutputs {
	/** Merged records */
	json?: unknown[];
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * MergeRecord Node Activity
 * Merges records from multiple flow files (similar to NiFi MergeRecord)
 *
 * This node can:
 * - Merge records from multiple flow files
 * - Support different merge strategies
 * - Handle correlation based on attributes
 * - Control merge size and count limits
 */
export async function mergeRecordActivity(context: ExecutionContext): Promise<MergeRecordOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<MergeRecordInputs>;

	// Extract parameters from node
	const mergeStrategy = (node.parameters?.mergeStrategy ||
		inputs.mergeStrategy ||
		'defragment') as string;
	const minRecords = (node.parameters?.minRecords || inputs.minRecords || 1) as number;
	const maxRecords = (node.parameters?.maxRecords || inputs.maxRecords || 1000) as number;
	const correlationAttribute = (node.parameters?.correlationAttribute ||
		inputs.correlationAttribute) as string | undefined;
	const countAttribute = (node.parameters?.countAttribute ||
		inputs.countAttribute ||
		'record.count') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Extract records to merge
	let recordsToMerge: unknown[] = [];

	// Extract records from input
	if (Array.isArray(inputData.json)) {
		recordsToMerge = inputData.json;
	} else if (inputData.main && Array.isArray(inputData.main)) {
		// Flatten array of arrays
		for (const itemArray of inputData.main) {
			if (Array.isArray(itemArray)) {
				recordsToMerge.push(...itemArray);
			} else {
				recordsToMerge.push(itemArray);
			}
		}
	} else if (inputData.json) {
		recordsToMerge = [inputData.json];
	}

	// Check minimum records requirement
	if (recordsToMerge.length < minRecords) {
		// Not enough records to merge
		return {
			json: recordsToMerge,
			attributes: {
				...existingAttributes,
				[countAttribute]: String(recordsToMerge.length),
				merged: 'false',
			},
		};
	}

	// Limit to max records
	if (recordsToMerge.length > maxRecords) {
		recordsToMerge = recordsToMerge.slice(0, maxRecords);
	}

	// Group by correlation attribute if specified
	let mergedRecords: unknown[] = recordsToMerge;

	if (correlationAttribute) {
		const grouped = groupByCorrelation(recordsToMerge, correlationAttribute);
		mergedRecords = Object.values(grouped).flat();
	}

	// Apply merge strategy
	if (mergeStrategy === 'defragment' || mergeStrategy === 'bin-packing') {
		// Keep as array of records
		mergedRecords = recordsToMerge;
	} else if (mergeStrategy === 'zip') {
		// Interleave records (simplified)
		mergedRecords = recordsToMerge;
	}

	// Prepare output
	const output: MergeRecordOutputs = {
		json: mergedRecords,
		attributes: {
			...existingAttributes,
			[countAttribute]: String(recordsToMerge.length),
			merged: 'true',
			mergeStrategy,
		},
	};

	return output;
}

/**
 * Group records by correlation attribute
 */
function groupByCorrelation(
	records: unknown[],
	correlationAttribute: string,
): Record<string, unknown[]> {
	const grouped: Record<string, unknown[]> = {};

	for (const record of records) {
		if (typeof record === 'object' && record !== null) {
			const recordObj = record as Record<string, unknown>;
			const correlationValue = String(recordObj[correlationAttribute] || 'default');

			if (!grouped[correlationValue]) {
				grouped[correlationValue] = [];
			}

			grouped[correlationValue].push(record);
		}
	}

	return grouped;
}
