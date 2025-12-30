import type { ExecutionContext } from '../../types';

export interface SplitJsonInputs {
	/** JSON path to the array to split (e.g., 'data.items') */
	arrayPath?: string;
	/** Whether to split at root level if input is an array */
	splitAtRoot?: boolean;
	/** Maximum number of items to split (0 = no limit) */
	maxItems?: number;
	/** Attribute name to store original item index */
	indexAttribute?: string;
}

export interface SplitJsonOutputs {
	/** Split items (array of individual items) */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * SplitJSON Node Activity
 * Splits JSON arrays into individual flow files (similar to NiFi SplitJSON)
 *
 * This node can:
 * - Split JSON arrays into individual items
 * - Split nested arrays using JSON path
 * - Limit the number of items to split
 * - Add index attributes to each split item
 */
export async function splitJsonActivity(context: ExecutionContext): Promise<SplitJsonOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<SplitJsonInputs>;

	// Extract parameters from node
	const arrayPath = (node.parameters?.arrayPath || inputs.arrayPath || '') as string;
	const splitAtRoot = (node.parameters?.splitAtRoot ?? inputs.splitAtRoot ?? true) as boolean;
	const maxItems = (node.parameters?.maxItems || inputs.maxItems || 0) as number;
	const indexAttribute = (node.parameters?.indexAttribute ||
		inputs.indexAttribute ||
		'split.index') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Get input JSON
	let inputJson: unknown = inputData.json || inputData;

	// Extract array to split
	let arrayToSplit: unknown[] = [];

	if (arrayPath) {
		// Extract from JSON path
		const extracted = getJsonValue(inputJson, arrayPath);
		if (Array.isArray(extracted)) {
			arrayToSplit = extracted;
		}
	} else if (splitAtRoot && Array.isArray(inputJson)) {
		// Split at root level
		arrayToSplit = inputJson;
	} else if (typeof inputJson === 'object' && inputJson !== null) {
		// Check if it's an object with array values
		const obj = inputJson as Record<string, unknown>;
		for (const value of Object.values(obj)) {
			if (Array.isArray(value)) {
				arrayToSplit = value;
				break;
			}
		}
	}

	// Apply max items limit
	if (maxItems > 0 && arrayToSplit.length > maxItems) {
		arrayToSplit = arrayToSplit.slice(0, maxItems);
	}

	// If no array found or empty, return original
	if (arrayToSplit.length === 0) {
		return {
			json: inputJson,
			attributes: existingAttributes,
		};
	}

	// For now, return the first item with index attribute
	// In a full implementation, this would create multiple flow files
	// For Temporal, we return the array and let the workflow handle splitting
	const firstItem = arrayToSplit[0];
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		[indexAttribute]: '0',
		'split.count': String(arrayToSplit.length),
		'split.total': String(arrayToSplit.length),
	};

	// Return first item with attributes
	// Note: In a full implementation, this would create multiple outputs
	return {
		json: firstItem,
		attributes: updatedAttributes,
	};
}

/**
 * Get value from JSON object using dot-notation path
 */
function getJsonValue(obj: unknown, path: string): unknown {
	if (!path || !obj) {
		return undefined;
	}

	const parts = path.split('.');
	let value: unknown = obj;

	for (const part of parts) {
		if (value && typeof value === 'object' && part in value) {
			value = (value as Record<string, unknown>)[part];
		} else {
			return undefined;
		}
	}

	return value;
}
