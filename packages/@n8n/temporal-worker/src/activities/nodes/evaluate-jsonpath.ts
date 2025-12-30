import type { ExecutionContext } from '../../types';

export interface EvaluateJsonPathInputs {
	/** JSONPath expressions (array of {name, path}) */
	jsonPathExpressions?: Array<{
		name: string;
		path: string;
	}>;
	/** Destination: 'attribute', 'content' */
	destination?: 'attribute' | 'content';
	/** Return null for missing values */
	returnNullForMissingAttributes?: boolean;
	/** Input JSON path (optional, defaults to root) */
	inputPath?: string;
}

export interface EvaluateJsonPathOutputs {
	/** Extracted JSON (if destination is 'content') */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata with extracted values */
	attributes?: Record<string, string>;
}

/**
 * EvaluateJsonPath Node Activity
 * Extracts values from JSON using JSONPath expressions (similar to NiFi EvaluateJsonPath)
 *
 * This node can:
 * - Extract values using JSONPath expressions
 * - Store results in attributes or content
 * - Support multiple JSONPath expressions
 * - Handle missing values
 */
export async function evaluateJsonPathActivity(
	context: ExecutionContext,
): Promise<EvaluateJsonPathOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<EvaluateJsonPathInputs>;

	// Extract parameters from node
	const jsonPathExpressions = (node.parameters?.jsonPathExpressions ||
		inputs.jsonPathExpressions ||
		[]) as Array<{
		name: string;
		path: string;
	}>;
	const destination = (node.parameters?.destination || inputs.destination || 'attribute') as string;
	const returnNullForMissingAttributes = (node.parameters?.returnNullForMissingAttributes ??
		inputs.returnNullForMissingAttributes ??
		false) as boolean;
	const inputPath = (node.parameters?.inputPath || inputs.inputPath || '') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Get input JSON
	let inputJson: unknown = inputData.json || inputData;

	// Extract from input path if specified
	if (inputPath) {
		inputJson = getJsonValue(inputJson, inputPath);
	}

	// Evaluate JSONPath expressions
	const extractedValues: Record<string, unknown> = {};

	for (const expr of jsonPathExpressions) {
		try {
			const value = evaluateJsonPath(inputJson, expr.path);
			if (value !== undefined) {
				extractedValues[expr.name] = value;
			} else if (returnNullForMissingAttributes) {
				extractedValues[expr.name] = null;
			}
		} catch (error) {
			console.warn(`Failed to evaluate JSONPath "${expr.path}":`, error);
			if (returnNullForMissingAttributes) {
				extractedValues[expr.name] = null;
			}
		}
	}

	// Prepare output based on destination
	const updatedAttributes: Record<string, string> = { ...existingAttributes };

	if (destination === 'attribute') {
		// Store in attributes
		for (const [name, value] of Object.entries(extractedValues)) {
			if (value !== null && value !== undefined) {
				updatedAttributes[name] = typeof value === 'string' ? value : JSON.stringify(value);
			} else if (returnNullForMissingAttributes) {
				updatedAttributes[name] = '';
			}
		}
	}

	const output: EvaluateJsonPathOutputs = {
		json: destination === 'content' ? extractedValues : inputJson,
		binary: inputData.binary as Record<string, unknown> | undefined,
		attributes: updatedAttributes,
	};

	return output;
}

/**
 * Evaluate JSONPath expression (simplified implementation)
 * Supports basic JSONPath syntax:
 * - $ - root
 * - .field - field access
 * - [index] - array access
 * - [*] - all array elements
 * - ..field - recursive descent
 *
 * For full JSONPath support, use a library like 'jsonpath' or 'jsonpath-plus'
 */
function evaluateJsonPath(data: unknown, path: string): unknown {
	if (!path || path === '$') {
		return data;
	}

	// Remove leading $ and .
	let normalizedPath = path.replace(/^\$\.?/, '');

	if (!normalizedPath) {
		return data;
	}

	// Split path into parts
	const parts = normalizedPath.split(/[\.\[\]]/).filter(Boolean);
	let current: unknown = data;

	for (const part of parts) {
		if (current === null || current === undefined) {
			return undefined;
		}

		if (part === '*') {
			// Wildcard - return all elements if array
			if (Array.isArray(current)) {
				return current;
			}
			return undefined;
		}

		if (Array.isArray(current)) {
			// Array access
			const index = parseInt(part, 10);
			if (!isNaN(index) && index >= 0 && index < current.length) {
				current = current[index];
			} else {
				return undefined;
			}
		} else if (typeof current === 'object' && current !== null) {
			// Object field access
			if (part in current) {
				current = (current as Record<string, unknown>)[part];
			} else {
				// Try recursive descent
				const found = findRecursive(current, part);
				if (found !== undefined) {
					current = found;
				} else {
					return undefined;
				}
			}
		} else {
			return undefined;
		}
	}

	return current;
}

/**
 * Recursive descent search
 */
function findRecursive(obj: unknown, field: string): unknown | undefined {
	if (typeof obj !== 'object' || obj === null) {
		return undefined;
	}

	if (Array.isArray(obj)) {
		for (const item of obj) {
			const found = findRecursive(item, field);
			if (found !== undefined) {
				return found;
			}
		}
		return undefined;
	}

	const objRecord = obj as Record<string, unknown>;
	if (field in objRecord) {
		return objRecord[field];
	}

	for (const value of Object.values(objRecord)) {
		const found = findRecursive(value, field);
		if (found !== undefined) {
			return found;
		}
	}

	return undefined;
}

/**
 * Get value from JSON object using dot-notation path
 */
function getJsonValue(obj: unknown, path: string): unknown {
	if (!path || !obj) {
		return obj;
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
