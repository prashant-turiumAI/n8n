import type { ExecutionContext } from '../../types';

export interface LogAttributeInputs {
	/** Log level: 'debug', 'info', 'warn', 'error' */
	logLevel?: 'debug' | 'info' | 'warn' | 'error';
	/** Attributes to log (comma-separated or array, empty = all) */
	attributesToLog?: string | string[];
	/** Log flow file content */
	logContent?: boolean;
	/** Maximum content length to log */
	maxContentLength?: number;
	/** Log flow file size */
	logSize?: boolean;
	/** Custom log message prefix */
	logPrefix?: string;
}

export interface LogAttributeOutputs {
	/** Original data (pass-through) */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * LogAttribute Node Activity
 * Logs flow file attributes for debugging/monitoring (similar to NiFi LogAttribute)
 *
 * This node can:
 * - Log flow file attributes
 * - Log flow file content
 * - Support different log levels
 * - Filter which attributes to log
 * - Pass through data unchanged
 */
export async function logAttributeActivity(
	context: ExecutionContext,
): Promise<LogAttributeOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<LogAttributeInputs>;

	// Extract parameters from node
	const logLevel = (node.parameters?.logLevel || inputs.logLevel || 'info') as string;
	const attributesToLog = node.parameters?.attributesToLog || inputs.attributesToLog;
	const logContent = (node.parameters?.logContent ?? inputs.logContent ?? false) as boolean;
	const maxContentLength = (node.parameters?.maxContentLength ||
		inputs.maxContentLength ||
		1000) as number;
	const logSize = (node.parameters?.logSize ?? inputs.logSize ?? true) as boolean;
	const logPrefix = (node.parameters?.logPrefix || inputs.logPrefix || '') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Determine which attributes to log
	let attributesToLogList: string[] = [];

	if (attributesToLog) {
		if (Array.isArray(attributesToLog)) {
			attributesToLogList = attributesToLog.map((a) => String(a)).filter(Boolean);
		} else if (typeof attributesToLog === 'string') {
			attributesToLogList = attributesToLog
				.split(',')
				.map((a) => a.trim())
				.filter(Boolean);
		}
	} else {
		// Log all attributes
		attributesToLogList = Object.keys(existingAttributes);
	}

	// Build log message
	const logParts: string[] = [];

	if (logPrefix) {
		logParts.push(`[${logPrefix}]`);
	}

	logParts.push('Flow File Attributes:');

	// Log selected attributes
	for (const attrName of attributesToLogList) {
		if (attrName in existingAttributes) {
			logParts.push(`${attrName}="${existingAttributes[attrName]}"`);
		}
	}

	// Log size if requested
	if (logSize) {
		let size = 0;
		if (inputData.binary && typeof inputData.binary === 'object') {
			const binaryObj = inputData.binary as Record<string, unknown>;
			if (typeof binaryObj.data === 'string') {
				size = Buffer.from(binaryObj.data, 'base64').length;
			}
		} else if (inputData.json) {
			size = Buffer.from(JSON.stringify(inputData.json), 'utf8').length;
		}
		logParts.push(`size=${size} bytes`);
	}

	// Log content if requested
	if (logContent) {
		let content = '';
		if (inputData.json) {
			const jsonStr = JSON.stringify(inputData.json);
			content =
				jsonStr.length > maxContentLength
					? jsonStr.substring(0, maxContentLength) + '...'
					: jsonStr;
		} else if (inputData.binary) {
			content = '[Binary Data]';
		}
		if (content) {
			logParts.push(`content="${content}"`);
		}
	}

	// Log the message
	const logMessage = logParts.join(' ');

	switch (logLevel) {
		case 'debug':
			console.debug(logMessage);
			break;
		case 'info':
			console.info(logMessage);
			break;
		case 'warn':
			console.warn(logMessage);
			break;
		case 'error':
			console.error(logMessage);
			break;
		default:
			console.log(logMessage);
	}

	// Update attributes to track logging
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		'log.timestamp': new Date().toISOString(),
		'log.level': logLevel,
	};

	// Prepare output (pass through unchanged)
	const output: LogAttributeOutputs = {
		json: inputData.json,
		binary: inputData.binary as Record<string, unknown> | undefined,
		attributes: updatedAttributes,
	};

	return output;
}
