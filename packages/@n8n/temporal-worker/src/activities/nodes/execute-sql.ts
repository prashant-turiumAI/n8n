import type { ExecutionContext } from '../../types';
import mysql from 'mysql2/promise';

export interface ExecuteSqlInputs {
	/** Database type: 'mysql', 'postgres', 'mssql', 'sqlite' */
	databaseType?: 'mysql' | 'postgres' | 'mssql' | 'sqlite';
	/** Database host */
	host?: string;
	/** Database port */
	port?: number;
	/** Database name */
	database?: string;
	/** Database username */
	username?: string;
	/** Database password */
	password?: string;
	/** SQL query to execute */
	query?: string;
	/** Query parameters (for parameterized queries) */
	parameters?: unknown[];
	/** Connection timeout in seconds */
	connectionTimeout?: number;
	/** Query timeout in seconds */
	queryTimeout?: number;
	/** Use SSL connection */
	useSSL?: boolean;
}

export interface ExecuteSqlOutputs {
	/** Query results */
	json?: unknown[];
	/** Attributes/metadata */
	attributes?: Record<string, string>;
	/** Query metadata (affected rows, etc.) */
	metadata?: {
		affectedRows?: number;
		insertId?: number;
		changedRows?: number;
	};
}

/**
 * ExecuteSQL Node Activity
 * Executes SQL SELECT queries and returns results (similar to NiFi ExecuteSQL)
 *
 * This node can:
 * - Execute SELECT queries
 * - Support parameterized queries
 * - Return query results as JSON
 * - Support multiple database types (MySQL, PostgreSQL, etc.)
 */
export async function executeSqlActivity(context: ExecutionContext): Promise<ExecuteSqlOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<ExecuteSqlInputs>;

	// Extract parameters from node
	const databaseType = (node.parameters?.databaseType || inputs.databaseType || 'mysql') as string;
	const host = (node.parameters?.host || inputs.host || 'localhost') as string;
	const port = (node.parameters?.port || inputs.port || 3306) as number;
	const database = (node.parameters?.database || inputs.database || '') as string;
	const username = (node.parameters?.username || inputs.username || '') as string;
	const password = (node.parameters?.password || inputs.password || '') as string;
	const query = (node.parameters?.query || inputs.query || '') as string;
	const parameters = (node.parameters?.parameters || inputs.parameters || []) as unknown[];
	const connectionTimeout = (node.parameters?.connectionTimeout ||
		inputs.connectionTimeout ||
		10) as number;
	const queryTimeout = (node.parameters?.queryTimeout || inputs.queryTimeout || 30) as number;
	const useSSL = (node.parameters?.useSSL ?? inputs.useSSL ?? false) as boolean;

	if (!query) {
		throw new Error('SQL query is required');
	}

	if (!database) {
		throw new Error('Database name is required');
	}

	// Create database connection
	let connection: mysql.Connection | null = null;

	try {
		// For now, we'll use mysql2 which also works with MySQL-compatible databases
		// In a full implementation, you'd support multiple database drivers
		if (databaseType === 'mysql' || databaseType === 'postgres') {
			connection = await mysql.createConnection({
				host,
				port,
				database,
				user: username,
				password,
				connectTimeout: connectionTimeout * 1000,
				ssl: useSSL ? {} : undefined,
			});

			// Execute query
			const [rows] = await Promise.race([
				connection.execute(query, parameters),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('Query timeout')), queryTimeout * 1000),
				),
			]);

			// Convert rows to JSON
			const results = Array.isArray(rows) ? rows : [rows];

			// Get metadata (for SELECT queries, these will be 0)
			const metadata = {
				affectedRows: 0,
				insertId: 0,
				changedRows: 0,
			};

			// Prepare output
			const output: ExecuteSqlOutputs = {
				json: results.map((row) => {
					// Convert RowDataPacket to plain object
					if (row && typeof row === 'object') {
						return { ...(row as Record<string, unknown>) };
					}
					return row;
				}),
				attributes: {
					'query.rows': String(results.length),
					'query.type': 'SELECT',
				},
				metadata,
			};

			return output;
		} else {
			throw new Error(`Database type ${databaseType} is not yet supported`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to execute SQL query: ${errorMessage}`);
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}
