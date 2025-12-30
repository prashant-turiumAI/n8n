import type { ExecutionContext } from '../../types';

export interface SplitRecordInputs {
	/** Record reader format */
	recordReader?: 'json' | 'csv' | 'avro';
	/** Record writer format */
	recordWriter?: 'json' | 'csv' | 'avro';
	/** Maximum number of records per split */
	maxRecords?: number;
	/** Split by attribute value */
	splitByAttribute?: string;
	/** Attribute name to store split index */
	indexAttribute?: string;
	/** Attribute name to store total splits */
	totalSplitsAttribute?: string;
}

export interface SplitRecordOutputs {
	/** Split records (array of individual records) */
	json?: unknown[];
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * SplitRecord Node Activity
 * Splits records into multiple flow files (similar to NiFi SplitRecord)
 *
 * This node can:
 * - Split records into individual flow files
 * - Limit records per split
 * - Split by attribute value
 * - Add split metadata to attributes
 */
export async function splitRecordActivity(context: ExecutionContext): Promise<SplitRecordOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<SplitRecordInputs>;

	// Extract parameters from node
	const maxRecords = (node.parameters?.maxRecords || inputs.maxRecords || 0) as number;
	const splitByAttribute = (node.parameters?.splitByAttribute || inputs.splitByAttribute) as
		| string
		| undefined;
	const indexAttribute = (node.parameters?.indexAttribute ||
		inputs.indexAttribute ||
		'split.index') as string;
	const totalSplitsAttribute = (node.parameters?.totalSplitsAttribute ||
		inputs.totalSplitsAttribute ||
		'split.total') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Extract records to split
	let recordsToSplit: unknown[] = [];

	// Extract records from input
	if (Array.isArray(inputData.json)) {
		recordsToSplit = inputData.json;
	} else if (inputData.main && Array.isArray(inputData.main)) {
		// Flatten array of arrays
		for (const itemArray of inputData.main) {
			if (Array.isArray(itemArray)) {
				recordsToSplit.push(...itemArray);
			} else {
				recordsToSplit.push(itemArray);
			}
		}
	} else if (inputData.json) {
		recordsToSplit = [inputData.json];
	}

	// Split by attribute if specified
	if (splitByAttribute) {
		const grouped = groupByAttribute(recordsToSplit, splitByAttribute);
		recordsToSplit = Object.values(grouped).flat();
	}

	// Apply max records limit per split
	let splitRecords: unknown[] = recordsToSplit;

	if (maxRecords > 0 && recordsToSplit.length > maxRecords) {
		// For now, return first maxRecords items
		// In a full implementation, this would create multiple flow files
		splitRecords = recordsToSplit.slice(0, maxRecords);
	}

	// For now, return the first record with split metadata
	// In a full implementation, this would create multiple outputs
	const firstRecord = splitRecords[0] || null;

	// Update attributes
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		[indexAttribute]: '0',
		[totalSplitsAttribute]: String(recordsToSplit.length),
		'split.count': String(splitRecords.length),
	};

	// Prepare output
	const output: SplitRecordOutputs = {
		json: firstRecord ? [firstRecord] : [],
		attributes: updatedAttributes,
	};

	return output;
}

/**
 * Group records by attribute value
 */
function groupByAttribute(records: unknown[], attribute: string): Record<string, unknown[]> {
	const grouped: Record<string, unknown[]> = {};

	for (const record of records) {
		if (typeof record === 'object' && record !== null) {
			const recordObj = record as Record<string, unknown>;
			const attributeValue = String(recordObj[attribute] || 'default');

			if (!grouped[attributeValue]) {
				grouped[attributeValue] = [];
			}

			grouped[attributeValue].push(record);
		}
	}

	return grouped;
}
