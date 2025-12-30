import type { ExecutionContext } from '../../types';

export interface JoltTransformJsonInputs {
	/** JOLT specification (JSON) */
	spec?: string;
	/** JOLT transformation mode: 'shift', 'default', 'remove', 'sort' */
	mode?: 'shift' | 'default' | 'remove' | 'sort';
	/** Input JSON path (optional) */
	inputPath?: string;
}

export interface JoltTransformJsonOutputs {
	/** Transformed JSON */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * JoltTransformJSON Node Activity
 * Transforms JSON using JOLT specification (similar to NiFi JoltTransformJSON)
 *
 * This node can:
 * - Transform JSON using JOLT specifications
 * - Support shift, default, remove, sort operations
 * - Apply complex JSON transformations
 *
 * Note: This is a simplified implementation. Full JOLT support would require a JOLT library.
 */
export async function joltTransformJsonActivity(
	context: ExecutionContext,
): Promise<JoltTransformJsonOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<JoltTransformJsonInputs>;

	// Extract parameters from node
	const spec = (node.parameters?.spec || inputs.spec || '') as string;
	const mode = (node.parameters?.mode || inputs.mode || 'shift') as string;
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

	// Transform using JOLT specification
	let transformedJson: unknown = inputJson;

	if (spec) {
		try {
			const joltSpec = JSON.parse(spec);
			transformedJson = applyJoltTransform(inputJson, joltSpec, mode);
		} catch (error) {
			console.error('Failed to parse JOLT spec:', error);
			// Return original on error
			transformedJson = inputJson;
		}
	}

	// Prepare output
	const output: JoltTransformJsonOutputs = {
		json: transformedJson,
		attributes: {
			...existingAttributes,
			'transform.type': 'JOLT',
			'transform.mode': mode,
		},
	};

	return output;
}

/**
 * Apply JOLT transformation (simplified implementation)
 * In production, use a proper JOLT library like 'jolt-core' or 'jolt-transform'
 */
function applyJoltTransform(input: unknown, spec: unknown, mode: string): unknown {
	if (mode === 'shift' && typeof spec === 'object' && spec !== null) {
		return applyShiftTransform(input, spec as Record<string, unknown>);
	}

	// For other modes, return input (would need full JOLT implementation)
	return input;
}

/**
 * Apply JOLT shift transformation (simplified)
 */
function applyShiftTransform(input: unknown, spec: Record<string, unknown>): unknown {
	if (typeof input !== 'object' || input === null) {
		return input;
	}

	if (Array.isArray(input)) {
		return input.map((item) => applyShiftTransform(item, spec));
	}

	const inputObj = input as Record<string, unknown>;
	const result: Record<string, unknown> = {};

	for (const [outputKey, inputKey] of Object.entries(spec)) {
		if (typeof inputKey === 'string') {
			// Simple key mapping
			if (inputKey in inputObj) {
				result[outputKey] = inputObj[inputKey];
			}
		} else if (typeof inputKey === 'object' && inputKey !== null) {
			// Nested transformation
			const nestedInput = getJsonValue(inputObj, outputKey);
			if (nestedInput !== undefined) {
				result[outputKey] = applyShiftTransform(nestedInput, inputKey as Record<string, unknown>);
			}
		}
	}

	return result;
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
