import type { ExecutionContext } from '../../types';

export interface MergeContentInputs {
	/** Merge strategy: 'bin-packing', 'defragment', 'zip' */
	mergeStrategy?: 'bin-packing' | 'defragment' | 'zip';
	/** Delimiter to use when merging (for text content) */
	delimiter?: string;
	/** Header to include at the start of merged content */
	header?: string;
	/** Footer to include at the end of merged content */
	footer?: string;
	/** Minimum number of flow files to merge */
	minEntries?: number;
	/** Maximum number of flow files to merge */
	maxEntries?: number;
	/** Maximum size of merged content (in bytes) */
	maxSize?: number;
	/** Attribute name to store original flow file count */
	countAttribute?: string;
}

export interface MergeContentOutputs {
	/** Merged content/data */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * MergeContent Node Activity
 * Merges multiple flow files into a single flow file (similar to NiFi MergeContent)
 *
 * This node can:
 * - Merge multiple items from previous nodes
 * - Support different merge strategies (bin-packing, defragment, zip)
 * - Add headers and footers
 * - Control merge size and count limits
 */
export async function mergeContentActivity(
	context: ExecutionContext,
): Promise<MergeContentOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<MergeContentInputs>;

	// Extract parameters from node
	const mergeStrategy = (node.parameters?.mergeStrategy ||
		inputs.mergeStrategy ||
		'defragment') as string;
	const delimiter = (node.parameters?.delimiter || inputs.delimiter || '\n') as string;
	const header = (node.parameters?.header || inputs.header || '') as string;
	const footer = (node.parameters?.footer || inputs.footer || '') as string;
	const minEntries = (node.parameters?.minEntries || inputs.minEntries || 1) as number;
	const maxEntries = (node.parameters?.maxEntries || inputs.maxEntries || 1000) as number;
	const maxSize = (node.parameters?.maxSize || inputs.maxSize) as number | undefined;
	const countAttribute = (node.parameters?.countAttribute ||
		inputs.countAttribute ||
		'fragment.count') as string;

	// Get input data from previous nodes
	// In n8n, input data comes as arrays of items
	const inputData = context.inputs || {};

	// Extract items to merge
	// Input data structure: { main: [[item1], [item2], ...] }
	let itemsToMerge: unknown[] = [];

	if (inputData.main && Array.isArray(inputData.main)) {
		// Flatten the array of arrays into a single array
		for (const itemArray of inputData.main) {
			if (Array.isArray(itemArray)) {
				itemsToMerge.push(...itemArray);
			} else {
				itemsToMerge.push(itemArray);
			}
		}
	} else if (Array.isArray(inputData)) {
		itemsToMerge = inputData;
	} else if (inputData.json) {
		// Single item
		itemsToMerge = [inputData.json];
	}

	// Check minimum entries requirement
	if (itemsToMerge.length < minEntries) {
		// Not enough items to merge, return as-is or wait for more
		// For now, return the items as-is
		return {
			json: itemsToMerge.length === 1 ? itemsToMerge[0] : itemsToMerge,
			attributes: {
				[countAttribute]: String(itemsToMerge.length),
				merged: 'false',
			},
		};
	}

	// Limit to max entries
	if (itemsToMerge.length > maxEntries) {
		itemsToMerge = itemsToMerge.slice(0, maxEntries);
	}

	// Merge based on strategy
	let mergedContent: unknown = '';

	if (mergeStrategy === 'defragment' || mergeStrategy === 'bin-packing') {
		// Merge as text/JSON array
		const contents: string[] = [];

		// Add header if provided
		if (header) {
			contents.push(header);
		}

		// Merge all items
		for (const item of itemsToMerge) {
			if (typeof item === 'string') {
				contents.push(item);
			} else if (typeof item === 'object' && item !== null) {
				contents.push(JSON.stringify(item));
			} else {
				contents.push(String(item));
			}
		}

		// Add footer if provided
		if (footer) {
			contents.push(footer);
		}

		mergedContent = contents.join(delimiter);

		// Check max size if specified
		if (maxSize && String(mergedContent).length > maxSize) {
			// Truncate if needed
			mergedContent = String(mergedContent).substring(0, maxSize);
		}
	} else if (mergeStrategy === 'zip') {
		// For zip strategy, we'd need to create a zip file
		// For now, merge as JSON array
		mergedContent = itemsToMerge;
	} else {
		// Default: merge as JSON array
		mergedContent = itemsToMerge;
	}

	// Prepare output
	const output: MergeContentOutputs = {
		json: mergedContent,
		attributes: {
			[countAttribute]: String(itemsToMerge.length),
			merged: 'true',
			mergeStrategy,
		},
	};

	return output;
}
