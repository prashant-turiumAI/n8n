import type { ExecutionContext } from '../../types';

export interface JslTransformJsonInputs {
	/** JSL transformation script */
	script?: string;
	/** Input JSON path (optional, defaults to root) */
	inputPath?: string;
	/** Output JSON path (optional, defaults to root) */
	outputPath?: string;
}

export interface JslTransformJsonOutputs {
	/** Transformed JSON */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * JSLTransformJSON Node Activity
 * Transforms JSON using JSL (JSON Scripting Language) (similar to NiFi JSLTransformJSON)
 *
 * This node can:
 * - Transform JSON using JSL scripts
 * - Support path-based transformations
 * - Apply custom transformation logic
 *
 * Note: This is a simplified implementation. Full JSL support would require a JSL parser.
 */
export async function jslTransformJsonActivity(
	context: ExecutionContext,
): Promise<JslTransformJsonOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<JslTransformJsonInputs>;

	// Extract parameters from node
	const script = (node.parameters?.script || inputs.script || '') as string;
	const inputPath = (node.parameters?.inputPath || inputs.inputPath || '') as string;
	const outputPath = (node.parameters?.outputPath || inputs.outputPath || '') as string;

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

	// For now, implement a simple transformation
	// In a full implementation, you would parse and execute JSL script
	let transformedJson: unknown = inputJson;

	if (script) {
		try {
			// Simple transformation: if script is JSON, merge it with input
			// This is a placeholder - full JSL would require a proper parser
			const scriptJson = JSON.parse(script);
			if (typeof scriptJson === 'object' && scriptJson !== null) {
				// Apply transformation based on script structure
				transformedJson = applySimpleTransform(inputJson, scriptJson);
			}
		} catch (error) {
			// If script is not JSON, treat it as a simple mapping
			// In production, you'd use a proper JSL parser
			console.warn('JSL script parsing not fully implemented, using simple transform');
			transformedJson = inputJson;
		}
	}

	// Apply output path if specified
	if (outputPath && transformedJson) {
		const outputObj: Record<string, unknown> = {};
		setJsonValue(outputObj, outputPath, transformedJson);
		transformedJson = outputObj;
	}

	// Prepare output
	const output: JslTransformJsonOutputs = {
		json: transformedJson,
		attributes: {
			...existingAttributes,
			'transform.type': 'JSL',
		},
	};

	return output;
}

/**
 * Apply simple transformation (placeholder for full JSL implementation)
 */
function applySimpleTransform(input: unknown, script: Record<string, unknown>): unknown {
	if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
		const inputObj = input as Record<string, unknown>;
		const result: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(script)) {
			if (key.startsWith('$')) {
				// Reference to input field
				const refKey = key.substring(1);
				result[refKey] = inputObj[refKey];
			} else {
				result[key] = value;
			}
		}

		return result;
	}

	return input;
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

/**
 * Set value in JSON object using dot-notation path
 */
function setJsonValue(obj: Record<string, unknown>, path: string, value: unknown): void {
	if (!path) {
		return;
	}

	const parts = path.split('.');
	let current: Record<string, unknown> = obj;

	for (let i = 0; i < parts.length - 1; i++) {
		const part = parts[i];
		if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
			current[part] = {};
		}
		current = current[part] as Record<string, unknown>;
	}

	current[parts[parts.length - 1]] = value;
}
