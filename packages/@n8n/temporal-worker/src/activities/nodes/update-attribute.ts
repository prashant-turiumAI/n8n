import type { ExecutionContext } from '../../types';

export interface UpdateAttributeInputs {
	/** Attributes to add/update (key-value pairs) */
	attributes?: Array<{
		key: string;
		value: string;
		/** Whether to delete the attribute if value is empty */
		deleteIfEmpty?: boolean;
	}>;
	/** Delete attributes (list of attribute keys to remove) */
	deleteAttributes?: string[];
	/** Whether to keep existing attributes */
	keepExistingAttributes?: boolean;
}

export interface UpdateAttributeOutputs {
	/** Updated JSON data */
	json?: unknown;
	/** Updated binary data */
	binary?: Record<string, unknown>;
	/** Updated attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * UpdateAttribute Node Activity
 * Updates, adds, or removes attributes from flow files (similar to NiFi UpdateAttribute)
 *
 * This node can:
 * - Add new attributes
 * - Update existing attributes
 * - Delete attributes
 * - Use expressions in attribute values
 * - Preserve or replace existing attributes
 */
export async function updateAttributeActivity(
	context: ExecutionContext,
): Promise<UpdateAttributeOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<UpdateAttributeInputs>;

	// Extract parameters from node
	let attributesToUpdate: Array<{
		key: string;
		value: string;
		deleteIfEmpty?: boolean;
	}> = [];

	// Handle attributes - prioritize node parameters over inputs
	// Node parameters contain the configuration, inputs contain data from previous nodes
	const attributesParam = node.parameters?.attributes || inputs.attributes;
	if (Array.isArray(attributesParam)) {
		attributesToUpdate = attributesParam;
	} else if (attributesParam && typeof attributesParam === 'object') {
		// If it's an object, convert to array format
		attributesToUpdate = Object.entries(attributesParam as Record<string, string>).map(
			([key, value]) => ({ key, value }),
		);
	}

	let deleteAttributes: string[] = [];
	// Prioritize node parameters (configuration) over inputs (data)
	const deleteAttributesParam = node.parameters?.deleteAttributes || inputs.deleteAttributes;
	if (Array.isArray(deleteAttributesParam)) {
		deleteAttributes = deleteAttributesParam;
	} else if (typeof deleteAttributesParam === 'string') {
		deleteAttributes = [deleteAttributesParam];
	}

	// Prioritize node parameters (configuration) over inputs (data)
	const keepExistingAttributes = (node.parameters?.keepExistingAttributes ??
		inputs.keepExistingAttributes ??
		true) as boolean;

	// Get input data from previous nodes
	const inputData = context.inputs || {};

	// Extract existing data
	let existingJson: unknown = inputData.json || {};
	let existingBinary: Record<string, unknown> | undefined = inputData.binary as
		| Record<string, unknown>
		| undefined;
	let existingAttributes: Record<string, string> = {};

	// If input has attributes, preserve them
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Start with existing attributes if we should keep them
	const updatedAttributes: Record<string, string> = keepExistingAttributes
		? { ...existingAttributes }
		: {};

	// Update/add attributes
	for (const attr of attributesToUpdate) {
		if (attr.key) {
			// Evaluate the value (could contain expressions, but for now use as-is)
			let value = attr.value || '';

			// Simple expression evaluation (can be enhanced later)
			// Replace ${...} expressions with actual values
			value = evaluateExpressions(value, {
				...updatedAttributes,
				json: existingJson,
			});

			// Add or update the attribute
			if (attr.deleteIfEmpty && !value) {
				// Delete if empty and deleteIfEmpty is true
				delete updatedAttributes[attr.key];
			} else {
				updatedAttributes[attr.key] = value;
			}
		}
	}

	// Delete specified attributes
	for (const key of deleteAttributes) {
		if (key) {
			delete updatedAttributes[key];
		}
	}

	// Prepare output
	const output: UpdateAttributeOutputs = {
		json: existingJson,
		binary: existingBinary,
		attributes: updatedAttributes,
	};

	return output;
}

/**
 * Simple expression evaluator
 * Replaces ${attributeName} or ${json.field} with actual values
 *
 * @param expression - Expression string to evaluate
 * @param context - Context object with available variables
 * @returns Evaluated string
 */
function evaluateExpressions(expression: string, context: Record<string, unknown>): string {
	if (!expression || typeof expression !== 'string') {
		return String(expression || '');
	}

	// Replace ${attributeName} patterns
	return expression.replace(/\$\{([^}]+)\}/g, (match, path) => {
		const parts = path.split('.');
		let value: unknown = context;

		for (const part of parts) {
			if (value && typeof value === 'object' && part in value) {
				value = (value as Record<string, unknown>)[part];
			} else {
				return match; // Return original if path not found
			}
		}

		return String(value ?? match);
	});
}
