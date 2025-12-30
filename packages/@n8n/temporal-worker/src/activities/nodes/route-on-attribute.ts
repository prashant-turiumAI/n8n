import type { ExecutionContext } from '../../types';

export interface RouteOnAttributeInputs {
	/** Routing rules (array of {attribute, operator, value, route}) */
	rules?: Array<{
		attribute: string;
		operator:
			| '='
			| '!='
			| '>'
			| '<'
			| '>='
			| '<='
			| 'LIKE'
			| 'IN'
			| 'NOT IN'
			| 'EXISTS'
			| 'NOT EXISTS';
		value?: unknown;
		route: string;
	}>;
	/** Default route if no rules match */
	defaultRoute?: string;
}

export interface RouteOnAttributeOutputs {
	/** Routed data (same as input) */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata with route information */
	attributes?: Record<string, string>;
}

/**
 * RouteOnAttribute Node Activity
 * Routes flow files based on attribute conditions (similar to NiFi RouteOnAttribute)
 *
 * This node can:
 * - Route flow files based on attribute values
 * - Support multiple routing rules
 * - Evaluate conditions using various operators
 * - Set route attribute for downstream processing
 */
export async function routeOnAttributeActivity(
	context: ExecutionContext,
): Promise<RouteOnAttributeOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<RouteOnAttributeInputs>;

	// Extract parameters from node
	const rules = (node.parameters?.rules || inputs.rules || []) as Array<{
		attribute: string;
		operator: string;
		value?: unknown;
		route: string;
	}>;
	const defaultRoute = (node.parameters?.defaultRoute ||
		inputs.defaultRoute ||
		'unmatched') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Evaluate routing rules
	let matchedRoute = defaultRoute;

	for (const rule of rules) {
		const attributeValue = existingAttributes[rule.attribute];
		const matches = evaluateRouteCondition(attributeValue, rule.operator, rule.value);

		if (matches) {
			matchedRoute = rule.route;
			break; // First match wins
		}
	}

	// Update attributes with route information
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		route: matchedRoute,
		'routing.matched': 'true',
	};

	// Prepare output
	const output: RouteOnAttributeOutputs = {
		json: inputData.json || inputData,
		binary: inputData.binary as Record<string, unknown> | undefined,
		attributes: updatedAttributes,
	};

	return output;
}

/**
 * Evaluate routing condition
 */
function evaluateRouteCondition(
	attributeValue: string | undefined,
	operator: string,
	conditionValue?: unknown,
): boolean {
	switch (operator) {
		case 'EXISTS':
			return attributeValue !== undefined && attributeValue !== null && attributeValue !== '';
		case 'NOT EXISTS':
			return attributeValue === undefined || attributeValue === null || attributeValue === '';
		case '=':
			return String(attributeValue) === String(conditionValue);
		case '!=':
			return String(attributeValue) !== String(conditionValue);
		case '>':
			return Number(attributeValue) > Number(conditionValue);
		case '<':
			return Number(attributeValue) < Number(conditionValue);
		case '>=':
			return Number(attributeValue) >= Number(conditionValue);
		case '<=':
			return Number(attributeValue) <= Number(conditionValue);
		case 'LIKE':
			if (typeof attributeValue === 'string' && typeof conditionValue === 'string') {
				const pattern = conditionValue.replace(/%/g, '.*').replace(/_/g, '.');
				return new RegExp(`^${pattern}$`, 'i').test(attributeValue);
			}
			return false;
		case 'IN':
			if (Array.isArray(conditionValue)) {
				return conditionValue.includes(attributeValue);
			}
			return false;
		case 'NOT IN':
			if (Array.isArray(conditionValue)) {
				return !conditionValue.includes(attributeValue);
			}
			return true;
		default:
			return false;
	}
}
