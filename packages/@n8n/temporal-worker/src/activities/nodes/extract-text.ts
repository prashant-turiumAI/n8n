import type { ExecutionContext } from '../../types';

export interface ExtractTextInputs {
	/** Regular expression pattern to extract */
	regex?: string;
	/** Whether to extract all matches or just the first */
	extractAll?: boolean;
	/** Attribute name to store extracted text */
	attributeName?: string;
	/** Maximum length of extracted text */
	maxLength?: number;
	/** Character set encoding (e.g., 'UTF-8', 'ISO-8859-1') */
	characterSet?: string;
	/** Whether to extract from JSON fields */
	extractFromJson?: boolean;
	/** JSON field path to extract from (e.g., 'data.text') */
	jsonPath?: string;
}

export interface ExtractTextOutputs {
	/** Extracted text/data */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata with extracted text */
	attributes?: Record<string, string>;
}

/**
 * ExtractText Node Activity
 * Extracts text from flow file content using regex or other methods (similar to NiFi ExtractText)
 *
 * This node can:
 * - Extract text using regular expressions
 * - Extract from JSON fields
 * - Store extracted text in attributes
 * - Extract all matches or just the first
 */
export async function extractTextActivity(context: ExecutionContext): Promise<ExtractTextOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<ExtractTextInputs>;

	// Extract parameters from node
	const regex = (node.parameters?.regex || inputs.regex || '') as string;
	const extractAll = (node.parameters?.extractAll ?? inputs.extractAll ?? false) as boolean;
	const attributeName = (node.parameters?.attributeName ||
		inputs.attributeName ||
		'extracted.text') as string;
	const maxLength = (node.parameters?.maxLength || inputs.maxLength) as number | undefined;
	const characterSet = (node.parameters?.characterSet || inputs.characterSet || 'UTF-8') as string;
	const extractFromJson = (node.parameters?.extractFromJson ??
		inputs.extractFromJson ??
		false) as boolean;
	const jsonPath = (node.parameters?.jsonPath || inputs.jsonPath || '') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};

	// Extract content to search
	let contentToSearch = '';
	let existingJson: unknown = inputData.json || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Determine content source
	if (extractFromJson && jsonPath) {
		// Extract from JSON field
		const jsonValue = getJsonValue(existingJson, jsonPath);
		contentToSearch = String(jsonValue || '');
	} else if (typeof existingJson === 'string') {
		contentToSearch = existingJson;
	} else if (typeof existingJson === 'object' && existingJson !== null) {
		// Convert JSON to string for searching
		contentToSearch = JSON.stringify(existingJson);
	} else {
		contentToSearch = String(existingJson || '');
	}

	// Extract text using regex
	let extractedText = '';
	const extractedTexts: string[] = [];

	if (regex) {
		try {
			const regexPattern = new RegExp(regex, extractAll ? 'g' : '');
			const matches = contentToSearch.match(regexPattern);

			if (matches) {
				if (extractAll) {
					extractedTexts.push(...matches);
					extractedText = matches.join(', ');
				} else {
					extractedText = matches[0] || '';
					extractedTexts.push(extractedText);
				}
			}
		} catch (error) {
			// Invalid regex, return empty
			console.warn('Invalid regex pattern:', regex, error);
		}
	} else {
		// No regex, return entire content
		extractedText = contentToSearch;
		extractedTexts.push(extractedText);
	}

	// Apply max length if specified
	if (maxLength && extractedText.length > maxLength) {
		extractedText = extractedText.substring(0, maxLength);
	}

	// Store extracted text in attributes
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		[attributeName]: extractedText,
	};

	// If extracting all, store count
	if (extractAll && extractedTexts.length > 0) {
		updatedAttributes[`${attributeName}.count`] = String(extractedTexts.length);
		// Store all matches in a comma-separated attribute
		updatedAttributes[`${attributeName}.all`] = extractedTexts.join(', ');
	}

	// Prepare output
	const output: ExtractTextOutputs = {
		json: existingJson,
		attributes: updatedAttributes,
	};

	return output;
}

/**
 * Get value from JSON object using dot-notation path
 * @param obj - JSON object
 * @param path - Dot-notation path (e.g., 'data.text')
 * @returns Extracted value
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
