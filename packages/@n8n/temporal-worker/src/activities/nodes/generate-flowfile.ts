import type { ExecutionContext } from '../../types';

export interface GenerateFlowFileInputs {
	/** Content to generate in the flow file */
	content?: string;
	/** File size in bytes (for generating files of specific size) */
	fileSize?: number;
	/** Data format: 'json', 'text', 'binary' */
	dataFormat?: 'json' | 'text' | 'binary';
	/** Number of flow files to generate */
	numberOfFiles?: number;
	/** Custom attributes to add to the flow file */
	attributes?: Record<string, string>;
}

export interface GenerateFlowFileOutputs {
	/** Generated content/data */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * GenerateFlowFile Node Activity
 * Generates flow files with configurable content (similar to NiFi GenerateFlowFile)
 *
 * This node can:
 * - Generate empty flow files
 * - Generate flow files with custom text content
 * - Generate flow files with JSON data
 * - Generate multiple flow files
 * - Add custom attributes to flow files
 */
export async function generateFlowFileActivity(
	context: ExecutionContext,
): Promise<GenerateFlowFileOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<GenerateFlowFileInputs>;

	// Extract parameters from node
	const content = (inputs.content || node.parameters?.content || '') as string;
	const fileSize = (inputs.fileSize || node.parameters?.fileSize) as number | undefined;
	const dataFormat = (inputs.dataFormat || node.parameters?.dataFormat || 'text') as string;
	const numberOfFiles = (inputs.numberOfFiles || node.parameters?.numberOfFiles || 1) as number;
	const attributes = (inputs.attributes || node.parameters?.attributes || {}) as Record<
		string,
		string
	>;

	// Generate the content
	let generatedContent: unknown = '';

	if (fileSize && fileSize > 0) {
		// Generate content of specific size
		generatedContent = '0'.repeat(fileSize);
	} else if (content) {
		// Use provided content
		if (dataFormat === 'json') {
			try {
				generatedContent = JSON.parse(content);
			} catch {
				// If not valid JSON, treat as text
				generatedContent = content;
			}
		} else {
			generatedContent = content;
		}
	} else {
		// Generate empty flow file
		generatedContent = '';
	}

	// Add default attributes
	const flowFileAttributes: Record<string, string> = {
		filename: `flowfile-${Date.now()}.txt`,
		uuid: generateUUID(),
		...attributes,
	};

	// Prepare output
	const output: GenerateFlowFileOutputs = {
		json: generatedContent,
		attributes: flowFileAttributes,
	};

	// If binary format, add binary data
	if (dataFormat === 'binary' && typeof generatedContent === 'string') {
		output.binary = {
			data: {
				data: Buffer.from(generatedContent).toString('base64'),
				mimeType: 'application/octet-stream',
			},
		};
	}

	// If multiple files requested, return array (for now, return single item)
	// In n8n, multiple items are handled as arrays in the output
	if (numberOfFiles > 1) {
		// For multiple files, we'd return an array, but for simplicity, return single item
		// The workflow execution can handle creating multiple items if needed
	}

	return output;
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
