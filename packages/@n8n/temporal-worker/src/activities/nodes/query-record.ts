import type { ExecutionContext } from '../../types';

export interface QueryRecordInputs {
	/** SQL-like query string (SELECT, WHERE, ORDER BY, LIMIT) */
	query?: string;
	/** Field to SELECT (comma-separated or array) */
	selectFields?: string | string[];
	/** WHERE conditions (array of {field, operator, value}) */
	whereConditions?: Array<{
		field: string;
		operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN';
		value: unknown;
	}>;
	/** ORDER BY clause (field and direction) */
	orderBy?: {
		field: string;
		direction?: 'ASC' | 'DESC';
	};
	/** LIMIT clause (max number of records) */
	limit?: number;
	/** OFFSET clause (skip records) */
	offset?: number;
}

export interface QueryRecordOutputs {
	/** Query results */
	json?: unknown[];
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * QueryRecord Node Activity
 * Queries records from flow file data using SQL-like syntax (similar to NiFi QueryRecord)
 *
 * This node can:
 * - Query records from flow file data
 * - Support SELECT, WHERE, ORDER BY, LIMIT clauses
 * - Filter records based on conditions
 * - Sort and limit results
 */
export async function queryRecordActivity(context: ExecutionContext): Promise<QueryRecordOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<QueryRecordInputs>;

	// Extract parameters from node
	const query = (node.parameters?.query || inputs.query || '') as string;
	const selectFields = node.parameters?.selectFields || inputs.selectFields;
	const whereConditions = (node.parameters?.whereConditions || inputs.whereConditions || []) as
		| Array<{
				field: string;
				operator: string;
				value: unknown;
		  }>
		| undefined;
	const orderBy = node.parameters?.orderBy || inputs.orderBy;
	const limit = (node.parameters?.limit || inputs.limit || 0) as number;
	const offset = (node.parameters?.offset || inputs.offset || 0) as number;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Get records to query
	let records: unknown[] = [];

	// Extract records from input
	if (Array.isArray(inputData.json)) {
		records = inputData.json;
	} else if (inputData.main && Array.isArray(inputData.main)) {
		// Flatten array of arrays
		for (const itemArray of inputData.main) {
			if (Array.isArray(itemArray)) {
				records.push(...itemArray);
			} else {
				records.push(itemArray);
			}
		}
	} else if (inputData.json) {
		records = [inputData.json];
	}

	// Convert records to objects if they're not already
	const objectRecords = records.map((record) => {
		if (typeof record === 'object' && record !== null) {
			return record as Record<string, unknown>;
		}
		return { value: record };
	});

	// Apply WHERE conditions
	let filteredRecords = objectRecords;

	if (whereConditions && whereConditions.length > 0) {
		filteredRecords = objectRecords.filter((record) => {
			return whereConditions.every((condition) => {
				const fieldValue = getFieldValue(record, condition.field);
				return evaluateCondition(fieldValue, condition.operator, condition.value);
			});
		});
	}

	// Apply ORDER BY
	if (orderBy && orderBy.field) {
		filteredRecords.sort((a, b) => {
			const aValue = getFieldValue(a, orderBy.field);
			const bValue = getFieldValue(b, orderBy.field);

			let comparison = 0;
			if (aValue < bValue) {
				comparison = -1;
			} else if (aValue > bValue) {
				comparison = 1;
			}

			return orderBy.direction === 'DESC' ? -comparison : comparison;
		});
	}

	// Apply SELECT fields
	let selectedRecords = filteredRecords;

	if (selectFields) {
		const fields = Array.isArray(selectFields)
			? selectFields
			: selectFields.split(',').map((f) => f.trim());

		selectedRecords = filteredRecords.map((record) => {
			const selected: Record<string, unknown> = {};
			for (const field of fields) {
				if (field === '*') {
					return record;
				}
				const value = getFieldValue(record, field);
				if (value !== undefined) {
					selected[field] = value;
				}
			}
			return selected;
		});
	}

	// Apply OFFSET and LIMIT
	let finalRecords = selectedRecords;
	if (offset > 0) {
		finalRecords = finalRecords.slice(offset);
	}
	if (limit > 0) {
		finalRecords = finalRecords.slice(0, limit);
	}

	// Prepare output
	const output: QueryRecordOutputs = {
		json: finalRecords,
		attributes: {
			...existingAttributes,
			'query.totalRecords': String(objectRecords.length),
			'query.filteredRecords': String(filteredRecords.length),
			'query.resultRecords': String(finalRecords.length),
		},
	};

	return output;
}

/**
 * Get field value from record using dot notation
 */
function getFieldValue(record: Record<string, unknown>, field: string): unknown {
	if (!field || !record) {
		return undefined;
	}

	const parts = field.split('.');
	let value: unknown = record;

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
 * Evaluate a condition
 */
function evaluateCondition(
	fieldValue: unknown,
	operator: string,
	conditionValue: unknown,
): boolean {
	switch (operator) {
		case '=':
			return fieldValue === conditionValue;
		case '!=':
			return fieldValue !== conditionValue;
		case '>':
			return (fieldValue as number) > (conditionValue as number);
		case '<':
			return (fieldValue as number) < (conditionValue as number);
		case '>=':
			return (fieldValue as number) >= (conditionValue as number);
		case '<=':
			return (fieldValue as number) <= (conditionValue as number);
		case 'LIKE':
			if (typeof fieldValue === 'string' && typeof conditionValue === 'string') {
				const pattern = conditionValue.replace(/%/g, '.*').replace(/_/g, '.');
				return new RegExp(`^${pattern}$`, 'i').test(fieldValue);
			}
			return false;
		case 'IN':
			if (Array.isArray(conditionValue)) {
				return conditionValue.includes(fieldValue);
			}
			return false;
		case 'NOT IN':
			if (Array.isArray(conditionValue)) {
				return !conditionValue.includes(fieldValue);
			}
			return true;
		default:
			return false;
	}
}
