import type { ExecutionContext } from '../../types';

export interface HttpRequestInputs {
	url: string;
	method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
	headers?: Record<string, string>;
	body?: unknown;
	bodyType?: 'json' | 'form' | 'raw';
	timeout?: number;
	queryParams?: Record<string, unknown>;
	auth?: {
		type?: 'bearer' | 'basic' | 'apikey';
		token?: string;
		username?: string;
		password?: string;
		key?: string;
		value?: string;
	};
	followRedirects?: boolean;
	verifySSL?: boolean;
}

export interface HttpRequestOutputs {
	statusCode: number;
	headers: Record<string, string>;
	body: unknown;
	url?: string;
	cookies?: Record<string, string>;
}

/**
 * HTTP Request Node Activity
 * Makes HTTP requests to external APIs
 */
export async function httpRequestActivity(context: ExecutionContext): Promise<HttpRequestOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<HttpRequestInputs>;

	// Extract parameters from node
	const url = inputs.url || (node.parameters?.url as string) || '';
	const method = (inputs.method || node.parameters?.method || 'GET') as string;
	const headers = (inputs.headers || node.parameters?.headers || {}) as Record<string, string>;
	const body = inputs.body || node.parameters?.body;
	const bodyType = (inputs.bodyType || node.parameters?.bodyType || 'json') as string;
	const timeout = (inputs.timeout || node.parameters?.timeout || 30) as number;

	// Build URL with query parameters
	let finalUrl = url;
	if (inputs.queryParams || node.parameters?.queryParams) {
		const queryParams = (inputs.queryParams || node.parameters?.queryParams) as Record<
			string,
			unknown
		>;
		const queryString = new URLSearchParams(
			Object.entries(queryParams).reduce(
				(acc, [key, value]) => {
					acc[key] = String(value);
					return acc;
				},
				{} as Record<string, string>,
			),
		).toString();
		finalUrl = `${url}${queryString ? `?${queryString}` : ''}`;
	}

	// Prepare request options
	const requestOptions: RequestInit = {
		method,
		headers: {
			...headers,
		},
		signal: AbortSignal.timeout(timeout * 1000),
	};

	// Add body for methods that support it
	if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) {
		if (bodyType === 'json') {
			requestOptions.body = JSON.stringify(body);
			requestOptions.headers = {
				...requestOptions.headers,
				'Content-Type': 'application/json',
			};
		} else if (bodyType === 'form') {
			requestOptions.body = new URLSearchParams(
				Object.entries(body as Record<string, unknown>).reduce(
					(acc, [key, value]) => {
						acc[key] = String(value);
						return acc;
					},
					{} as Record<string, string>,
				),
			).toString();
			requestOptions.headers = {
				...requestOptions.headers,
				'Content-Type': 'application/x-www-form-urlencoded',
			};
		} else {
			requestOptions.body = String(body);
		}
	}

	// Handle authentication
	if (inputs.auth || node.parameters?.auth) {
		const auth = (inputs.auth || node.parameters?.auth) as HttpRequestInputs['auth'];
		if (auth?.type === 'bearer' && auth.token) {
			requestOptions.headers = {
				...requestOptions.headers,
				Authorization: `Bearer ${auth.token}`,
			};
		} else if (auth?.type === 'basic' && auth.username && auth.password) {
			const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
			requestOptions.headers = {
				...requestOptions.headers,
				Authorization: `Basic ${credentials}`,
			};
		} else if (auth?.type === 'apikey' && auth.key && auth.value) {
			requestOptions.headers = {
				...requestOptions.headers,
				[auth.key]: auth.value,
			};
		}
	}

	// Make the HTTP request
	const response = await fetch(finalUrl, requestOptions);

	// Parse response
	let responseBody: unknown;
	const contentType = response.headers.get('content-type') || '';
	if (contentType.includes('application/json')) {
		responseBody = await response.json();
	} else {
		responseBody = await response.text();
	}

	// Extract cookies
	const cookies: Record<string, string> = {};
	const setCookieHeader = response.headers.get('set-cookie');
	if (setCookieHeader) {
		setCookieHeader.split(',').forEach((cookie) => {
			const [nameValue] = cookie.split(';');
			const [name, value] = nameValue.split('=');
			if (name && value) {
				cookies[name.trim()] = value.trim();
			}
		});
	}

	// Convert Headers to plain object
	const responseHeaders: Record<string, string> = {};
	response.headers.forEach((value, key) => {
		responseHeaders[key] = value;
	});

	return {
		statusCode: response.status,
		headers: responseHeaders,
		body: responseBody,
		url: response.url,
		cookies: Object.keys(cookies).length > 0 ? cookies : undefined,
	};
}
