import type { ExecutionContext } from '../../types';

export interface ConvertRecordInputs {
	/** Input record format: 'json', 'csv', 'xml', 'avro' */
	inputFormat?: 'json' | 'csv' | 'xml' | 'avro';
	/** Output record format: 'json', 'csv', 'xml', 'avro' */
	outputFormat?: 'json' | 'csv' | 'xml' | 'avro';
	/** CSV delimiter (for CSV input/output) */
	csvDelimiter?: string;
	/** CSV header row (for CSV input/output) */
	csvHeader?: boolean;
	/** Schema for Avro format */
	avroSchema?: string;
	/** Root element name for XML */
	xmlRootElement?: string;
	/** Record element name for XML arrays */
	xmlRecordElement?: string;
}

export interface ConvertRecordOutputs {
	/** Converted content/data */
	json?: unknown;
	/** Binary data (if applicable) */
	binary?: Record<string, unknown>;
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * ConvertRecord Node Activity
 * Converts records between different formats (similar to NiFi ConvertRecord)
 *
 * This node can:
 * - Convert JSON to CSV
 * - Convert CSV to JSON
 * - Convert JSON to XML
 * - Convert XML to JSON
 * - Handle record arrays
 */
export async function convertRecordActivity(
	context: ExecutionContext,
): Promise<ConvertRecordOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<ConvertRecordInputs>;

	// Extract parameters from node
	const inputFormat = (node.parameters?.inputFormat || inputs.inputFormat || 'json') as string;
	const outputFormat = (node.parameters?.outputFormat || inputs.outputFormat || 'json') as string;
	const csvDelimiter = (node.parameters?.csvDelimiter || inputs.csvDelimiter || ',') as string;
	const csvHeader = (node.parameters?.csvHeader ?? inputs.csvHeader ?? true) as boolean;
	const xmlRootElement = (node.parameters?.xmlRootElement ||
		inputs.xmlRootElement ||
		'root') as string;
	const xmlRecordElement = (node.parameters?.xmlRecordElement ||
		inputs.xmlRecordElement ||
		'record') as string;

	// Get input data from previous nodes
	const inputData = context.inputs || {};
	let existingAttributes: Record<string, string> = {};

	// Get existing attributes
	if (inputData.attributes && typeof inputData.attributes === 'object') {
		existingAttributes = { ...(inputData.attributes as Record<string, string>) };
	}

	// Get input content
	let inputContent: unknown = inputData.json || inputData;

	// Convert based on formats
	let convertedContent: unknown = inputContent;

	try {
		if (inputFormat === outputFormat) {
			// No conversion needed
			convertedContent = inputContent;
		} else if (inputFormat === 'json' && outputFormat === 'csv') {
			convertedContent = jsonToCsv(inputContent, csvDelimiter, csvHeader);
		} else if (inputFormat === 'csv' && outputFormat === 'json') {
			convertedContent = csvToJson(inputContent as string, csvDelimiter, csvHeader);
		} else if (inputFormat === 'json' && outputFormat === 'xml') {
			convertedContent = jsonToXml(inputContent, xmlRootElement, xmlRecordElement);
		} else if (inputFormat === 'xml' && outputFormat === 'json') {
			convertedContent = xmlToJson(inputContent as string);
		} else {
			// Unsupported conversion, return as-is
			console.warn(
				`Unsupported conversion: ${inputFormat} to ${outputFormat}. Returning original content.`,
			);
			convertedContent = inputContent;
		}
	} catch (error) {
		console.error('Error converting record:', error);
		// Return original on error
		convertedContent = inputContent;
	}

	// Update attributes
	const updatedAttributes: Record<string, string> = {
		...existingAttributes,
		'input.format': inputFormat,
		'output.format': outputFormat,
	};

	// Prepare output
	const output: ConvertRecordOutputs = {
		json: convertedContent,
		attributes: updatedAttributes,
	};

	// If output is CSV or XML (text), store as string
	if (outputFormat === 'csv' || outputFormat === 'xml') {
		output.json = String(convertedContent);
	}

	return output;
}

/**
 * Convert JSON to CSV
 */
function jsonToCsv(data: unknown, delimiter: string = ',', includeHeader: boolean = true): string {
	if (!data) {
		return '';
	}

	// Handle array of objects
	let records: Record<string, unknown>[] = [];
	if (Array.isArray(data)) {
		records = data.filter((item) => typeof item === 'object' && item !== null) as Record<
			string,
			unknown
		>[];
	} else if (typeof data === 'object' && data !== null) {
		records = [data as Record<string, unknown>];
	} else {
		return String(data);
	}

	if (records.length === 0) {
		return '';
	}

	// Get all unique keys from all records
	const allKeys = new Set<string>();
	for (const record of records) {
		Object.keys(record).forEach((key) => allKeys.add(key));
	}
	const keys = Array.from(allKeys);

	// Build CSV
	const lines: string[] = [];

	// Add header
	if (includeHeader && keys.length > 0) {
		lines.push(keys.map((key) => escapeCsvValue(String(key), delimiter)).join(delimiter));
	}

	// Add data rows
	for (const record of records) {
		const values = keys.map((key) => {
			const value = record[key];
			if (value === null || value === undefined) {
				return '';
			}
			if (typeof value === 'object') {
				return escapeCsvValue(JSON.stringify(value), delimiter);
			}
			return escapeCsvValue(String(value), delimiter);
		});
		lines.push(values.join(delimiter));
	}

	return lines.join('\n');
}

/**
 * Convert CSV to JSON
 */
function csvToJson(csv: string, delimiter: string = ',', hasHeader: boolean = true): unknown {
	if (!csv || typeof csv !== 'string') {
		return [];
	}

	const lines = csv.split('\n').filter((line) => line.trim().length > 0);
	if (lines.length === 0) {
		return [];
	}

	let headers: string[] = [];
	let startIndex = 0;

	if (hasHeader && lines.length > 0) {
		headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
		startIndex = 1;
	} else {
		// Generate headers if not provided
		const firstLine = lines[0].split(delimiter);
		headers = firstLine.map((_, i) => `column${i + 1}`);
	}

	const records: Record<string, unknown>[] = [];

	for (let i = startIndex; i < lines.length; i++) {
		const values = parseCsvLine(lines[i], delimiter);
		const record: Record<string, unknown> = {};

		for (let j = 0; j < headers.length; j++) {
			const header = headers[j] || `column${j + 1}`;
			record[header] = values[j] || '';
		}

		records.push(record);
	}

	return records.length === 1 ? records[0] : records;
}

/**
 * Convert JSON to XML
 */
function jsonToXml(
	data: unknown,
	rootElement: string = 'root',
	recordElement: string = 'record',
): string {
	if (!data) {
		return `<?xml version="1.0" encoding="UTF-8"?><${rootElement}></${rootElement}>`;
	}

	let records: unknown[] = [];
	if (Array.isArray(data)) {
		records = data;
	} else {
		records = [data];
	}

	const xmlRecords = records.map((record) => {
		if (typeof record === 'object' && record !== null) {
			return objectToXml(record as Record<string, unknown>, recordElement);
		}
		return `<${recordElement}>${escapeXml(String(record))}</${recordElement}>`;
	});

	return `<?xml version="1.0" encoding="UTF-8"?><${rootElement}>${xmlRecords.join('')}</${rootElement}>`;
}

/**
 * Convert XML to JSON
 */
function xmlToJson(xml: string): unknown {
	// Simple XML to JSON parser (for basic cases)
	// For production, consider using a proper XML parser library
	try {
		// Remove XML declaration
		xml = xml.replace(/<\?xml[^>]*\?>/g, '');

		// Simple regex-based parsing (limited)
		const result: Record<string, unknown> = {};
		const tagRegex = /<([^>]+)>([^<]*)<\/\1>/g;
		let match;

		while ((match = tagRegex.exec(xml)) !== null) {
			const tagName = match[1].split(' ')[0]; // Get tag name, ignore attributes
			const content = match[2].trim();

			if (content) {
				if (result[tagName]) {
					// Convert to array if multiple
					if (!Array.isArray(result[tagName])) {
						result[tagName] = [result[tagName]];
					}
					(result[tagName] as unknown[]).push(content);
				} else {
					result[tagName] = content;
				}
			}
		}

		return Object.keys(result).length > 0 ? result : xml;
	} catch (error) {
		console.error('Error parsing XML:', error);
		return xml;
	}
}

/**
 * Helper: Escape CSV value
 */
function escapeCsvValue(value: string, delimiter: string = ','): string {
	if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Helper: Parse CSV line (handles quoted values)
 */
function parseCsvLine(line: string, delimiter: string): string[] {
	const values: string[] = [];
	let current = '';
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				// Escaped quote
				current += '"';
				i++; // Skip next quote
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
			}
		} else if (char === delimiter && !inQuotes) {
			values.push(current);
			current = '';
		} else {
			current += char;
		}
	}

	values.push(current);
	return values;
}

/**
 * Helper: Convert object to XML
 */
function objectToXml(obj: Record<string, unknown>, rootTag: string = 'record'): string {
	const children: string[] = [];

	for (const [key, value] of Object.entries(obj)) {
		const tagName = key.replace(/[^a-zA-Z0-9_]/g, '_'); // Sanitize tag name

		if (value === null || value === undefined) {
			children.push(`<${tagName}></${tagName}>`);
		} else if (typeof value === 'object') {
			if (Array.isArray(value)) {
				children.push(
					`<${tagName}>${value.map((v) => objectToXml(v as Record<string, unknown>, 'item')).join('')}</${tagName}>`,
				);
			} else {
				children.push(objectToXml(value as Record<string, unknown>, tagName));
			}
		} else {
			children.push(`<${tagName}>${escapeXml(String(value))}</${tagName}>`);
		}
	}

	return `<${rootTag}>${children.join('')}</${rootTag}>`;
}

/**
 * Helper: Escape XML special characters
 */
function escapeXml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
