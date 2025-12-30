import type { ExecutionContext } from '../../types';

export interface ReplaceTextInputs {
	/** Search string or regex pattern */
	searchValue?: string;
	/** Replacement string */
	replaceValue?: string;
	/** Whether searchValue is a regex pattern */
	useRegex?: boolean;
	/** Regex flags (e.g., 'gi' for global, case-insensitive) */
	regexFlags?: string;
	/** Whether to replace all occurrences or just the first */
	replaceAll?: boolean;
	/** Character set encoding */
	characterSet?: string;
	/** Maximum buffer size */
	maxBufferSize?: number;
}

export interface ReplaceTextOutputs {
	/** Replaced content/data */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * ReplaceText Node Activity
 * Replaces text in flow file content using string or regex (similar to NiFi ReplaceText)
 *
 * This node can:
 * - Replace text using simple string replacement
 * - Replace text using regular expressions
 * - Replace all occurrences or just the first
 * - Handle large content with buffer limits
 */
export async function replaceTextActivity(context: ExecutionContext): Promise<ReplaceTextOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<ReplaceTextInputs>;

	// Extract parameters from node
	const searchValue = (node.parameters?.searchValue || inputs.searchValue || '') as string;
	const replaceValue = (node.parameters?.replaceValue || inputs.replaceValue || '') as string;
	const useRegex = (node.parameters?.useRegex ?? inputs.useRegex ?? false) as boolean;
	const regexFlags = (node.parameters?.regexFlags || inputs.regexFlags || 'g') as string;
	const replaceAll = (node.parameters?.replaceAll ?? inputs.replaceAll ?? true) as boolean;
	const maxBufferSize = (node.parameters?.maxBufferSize ||
		inputs.maxBufferSize ||
		1048576) as number; // 1MB default

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Get content to process
	let content: string = '';

	if (typeof inputData.json === 'string') {
		content = inputData.json;
	} else if (typeof inputData.json === 'object' && inputData.json !== null) {
		content = JSON.stringify(inputData.json);
	} else {
		content = String(inputData.json || '');
	}

	// Check buffer size
	if (content.length > maxBufferSize) {
		console.warn(`Content size (${content.length}) exceeds max buffer size (${maxBufferSize})`);
		content = content.substring(0, maxBufferSize);
	}

	// Perform replacement
	let replacedContent = content;

	if (searchValue) {
		try {
			if (useRegex) {
				// Use regex replacement
				const flags = replaceAll ? regexFlags : regexFlags.replace('g', '');
				const regex = new RegExp(searchValue, flags);
				replacedContent = content.replace(regex, replaceValue);
			} else {
				// Simple string replacement
				if (replaceAll) {
					// Replace all occurrences
					replacedContent = content.split(searchValue).join(replaceValue);
				} else {
					// Replace first occurrence only
					replacedContent = content.replace(searchValue, replaceValue);
				}
			}
		} catch (error) {
			console.error('Error in text replacement:', error);
			// Return original on error
			replacedContent = content;
		}
	}

	// Try to parse as JSON if it looks like JSON
	let outputJson: unknown = replacedContent;
	try {
		if (
			(replacedContent.startsWith('{') && replacedContent.endsWith('}')) ||
			(replacedContent.startsWith('[') && replacedContent.endsWith(']'))
		) {
			outputJson = JSON.parse(replacedContent);
		}
	} catch {
		// Not valid JSON, keep as string
		outputJson = replacedContent;
	}

	// Calculate replacement count
	let replaceCount = 0;
	if (searchValue) {
		try {
			if (useRegex) {
				const regex = new RegExp(searchValue, regexFlags);
				const matches = content.match(regex);
				replaceCount = matches ? matches.length : 0;
			} else {
				// Count occurrences of search string
				replaceCount = content.split(searchValue).length - 1;
			}
		} catch {
			replaceCount = 0;
		}
	}

	// Update attributes
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		'replace.count': String(replaceCount),
	};

	// Prepare output
	const output: ReplaceTextOutputs = {
		json: outputJson,
		attributes: updatedAttributes,
	};

	return output;
}
