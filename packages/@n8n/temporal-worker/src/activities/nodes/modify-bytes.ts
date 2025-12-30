import type { ExecutionContext } from '../../types';

export interface ModifyBytesInputs {
	/** Byte modification operation: 'replace', 'insert', 'delete', 'truncate' */
	operation?: 'replace' | 'insert' | 'delete' | 'truncate';
	/** Start offset (in bytes) */
	offset?: number;
	/** Length of bytes to modify */
	length?: number;
	/** Replacement bytes (hex string or base64) */
	replacementBytes?: string;
	/** Byte encoding: 'hex', 'base64', 'ascii' */
	encoding?: 'hex' | 'base64' | 'ascii';
	/** Truncate to this length (for truncate operation) */
	truncateLength?: number;
}

export interface ModifyBytesOutputs {
	/** Modified binary data */
	binary?: Record<string, unknown>;
	/** JSON data (if applicable) */
	json?: unknown;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * ModifyBytes Node Activity
 * Modifies binary data/bytes in flow files (similar to NiFi ModifyBytes)
 *
 * This node can:
 * - Replace bytes at specific offset
 * - Insert bytes at specific position
 * - Delete bytes from specific position
 * - Truncate binary data
 * - Support hex, base64, and ASCII encodings
 */
export async function modifyBytesActivity(context: ExecutionContext): Promise<ModifyBytesOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<ModifyBytesInputs>;

	// Extract parameters from node
	const operation = (node.parameters?.operation || inputs.operation || 'replace') as string;
	const offset = (node.parameters?.offset || inputs.offset || 0) as number;
	const length = (node.parameters?.length || inputs.length || 0) as number;
	const replacementBytes = (node.parameters?.replacementBytes ||
		inputs.replacementBytes ||
		'') as string;
	const encoding = (node.parameters?.encoding || inputs.encoding || 'hex') as string;
	const truncateLength = (node.parameters?.truncateLength || inputs.truncateLength || 0) as number;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Get binary data
	let binaryData: Buffer | null = null;

	if (inputData.binary && typeof inputData.binary === 'object') {
		const binaryObj = inputData.binary as Record<string, unknown>;
		// Try to get binary data from common keys
		if (binaryObj.data && Buffer.isBuffer(binaryObj.data)) {
			binaryData = binaryObj.data as Buffer;
		} else if (typeof binaryObj.data === 'string') {
			// Assume base64 encoded
			binaryData = Buffer.from(binaryObj.data, 'base64');
		}
	} else if (typeof inputData.json === 'string') {
		// Treat string as binary data
		binaryData = Buffer.from(inputData.json, 'utf8');
	}

	if (!binaryData) {
		// No binary data found, return original
		return {
			json: inputData.json,
			binary: inputData.binary as Record<string, unknown> | undefined,
			attributes: existingAttributes,
		};
	}

	// Perform byte modification
	let modifiedData: Buffer = binaryData;

	try {
		switch (operation) {
			case 'replace': {
				// Replace bytes at offset
				const replacement = decodeBytes(replacementBytes, encoding);
				const before = binaryData.slice(0, offset);
				const after = binaryData.slice(offset + length);
				modifiedData = Buffer.concat([before, replacement, after]);
				break;
			}
			case 'insert': {
				// Insert bytes at offset
				const insertion = decodeBytes(replacementBytes, encoding);
				const before = binaryData.slice(0, offset);
				const after = binaryData.slice(offset);
				modifiedData = Buffer.concat([before, insertion, after]);
				break;
			}
			case 'delete': {
				// Delete bytes from offset
				const before = binaryData.slice(0, offset);
				const after = binaryData.slice(offset + length);
				modifiedData = Buffer.concat([before, after]);
				break;
			}
			case 'truncate': {
				// Truncate to specified length
				if (truncateLength > 0 && truncateLength < binaryData.length) {
					modifiedData = binaryData.slice(0, truncateLength);
				}
				break;
			}
			default:
				modifiedData = binaryData;
		}
	} catch (error) {
		console.error('Error modifying bytes:', error);
		// Return original on error
		modifiedData = binaryData;
	}

	// Prepare output
	const output: ModifyBytesOutputs = {
		binary: {
			data: modifiedData.toString('base64'),
			mimeType:
				(inputData.binary as Record<string, unknown> | undefined)?.mimeType ||
				'application/octet-stream',
		},
		attributes: {
			...existingAttributes,
			'bytes.originalSize': String(binaryData.length),
			'bytes.modifiedSize': String(modifiedData.length),
			'bytes.operation': operation,
		},
	};

	return output;
}

/**
 * Decode bytes from string based on encoding
 */
function decodeBytes(data: string, encoding: string): Buffer {
	switch (encoding) {
		case 'hex':
			return Buffer.from(data.replace(/\s/g, ''), 'hex');
		case 'base64':
			return Buffer.from(data, 'base64');
		case 'ascii':
			return Buffer.from(data, 'ascii');
		default:
			return Buffer.from(data, 'utf8');
	}
}
