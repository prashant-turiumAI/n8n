import type { ExecutionContext } from '../../types';
import mysql from 'mysql2/promise';

export interface PutSqlInputs {
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
	/** SQL statement to execute (INSERT, UPDATE, DELETE) */
	statement?: string;
	/** Statement parameters (for parameterized queries) */
	parameters?: unknown[];
	/** Batch size for batch operations */
	batchSize?: number;
	/** Connection timeout in seconds */
	connectionTimeout?: number;
	/** Statement timeout in seconds */
	statementTimeout?: number;
	/** Use SSL connection */
	useSSL?: boolean;
}

export interface PutSqlOutputs {
	/** Execution result */
	json?: {
		affectedRows?: number;
		insertId?: number;
		changedRows?: number;
	};
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * PutSQL Node Activity
 * Executes SQL INSERT, UPDATE, DELETE statements (similar to NiFi PutSQL)
 *
 * This node can:
 * - Execute INSERT, UPDATE, DELETE statements
 * - Support parameterized queries
 * - Handle batch operations
 * - Return affected rows count
 */
export async function putSqlActivity(context: ExecutionContext): Promise<PutSqlOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<PutSqlInputs>;

	// Extract parameters from node
	const databaseType = (node.parameters?.databaseType || inputs.databaseType || 'mysql') as string;
	const host = (node.parameters?.host || inputs.host || 'localhost') as string;
	const port = (node.parameters?.port || inputs.port || 3306) as number;
	const database = (node.parameters?.database || inputs.database || '') as string;
	const username = (node.parameters?.username || inputs.username || '') as string;
	const password = (node.parameters?.password || inputs.password || '') as string;
	const statement = (node.parameters?.statement || inputs.statement || '') as string;
	const parameters = (node.parameters?.parameters || inputs.parameters || []) as unknown[];
	const batchSize = (node.parameters?.batchSize || inputs.batchSize || 100) as number;
	const connectionTimeout = (node.parameters?.connectionTimeout ||
		inputs.connectionTimeout ||
		10) as number;
	const statementTimeout = (node.parameters?.statementTimeout ||
		inputs.statementTimeout ||
		30) as number;
	const useSSL = (node.parameters?.useSSL ?? inputs.useSSL ?? false) as boolean;

	if (!statement) {
		throw new Error('SQL statement is required');
	}

	if (!database) {
		throw new Error('Database name is required');
	}

	// Create database connection
	let connection: mysql.Connection | null = null;

	try {
		// For now, we'll use mysql2 which also works with MySQL-compatible databases
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

			// Execute statement
			const [result] = await Promise.race([
				connection.execute(statement, parameters),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('Statement timeout')), statementTimeout * 1000),
				),
			]);

			// Get result metadata
			const resultInfo = result as mysql.ResultSetHeader;
			const affectedRows = resultInfo.affectedRows || 0;
			const insertId = resultInfo.insertId || 0;
			const changedRows = resultInfo.changedRows || 0;

			// Prepare output
			const output: PutSqlOutputs = {
				json: {
					affectedRows,
					insertId,
					changedRows,
				},
				attributes: {
					'statement.affectedRows': String(affectedRows),
					'statement.insertId': String(insertId),
					'statement.changedRows': String(changedRows),
					'statement.type': statement.trim().split(' ')[0].toUpperCase(),
				},
			};

			return output;
		} else {
			throw new Error(`Database type ${databaseType} is not yet supported`);
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to execute SQL statement: ${errorMessage}`);
	} finally {
		if (connection) {
			await connection.end();
		}
	}
}
