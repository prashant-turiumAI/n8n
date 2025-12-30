import type { ExecutionContext } from '../../types';
import nodemailer from 'nodemailer';

export interface PutEmailInputs {
	/** SMTP host */
	smtpHost?: string;
	/** SMTP port */
	smtpPort?: number;
	/** SMTP username */
	smtpUsername?: string;
	/** SMTP password */
	smtpPassword?: string;
	/** Use TLS/SSL */
	useTLS?: boolean;
	/** Use SSL */
	useSSL?: boolean;
	/** From email address */
	from?: string;
	/** To email addresses (comma-separated or array) */
	to?: string | string[];
	/** CC email addresses (comma-separated or array) */
	cc?: string | string[];
	/** BCC email addresses (comma-separated or array) */
	bcc?: string | string[];
	/** Email subject */
	subject?: string;
	/** Email body (text) */
	text?: string;
	/** Email body (HTML) */
	html?: string;
	/** Reply-to address */
	replyTo?: string;
	/** Attachments (array of file paths or objects) */
	attachments?: Array<{
		filename?: string;
		path?: string;
		content?: string | Buffer;
		contentType?: string;
	}>;
}

export interface PutEmailOutputs {
	/** Email send result */
	json?: {
		messageId?: string;
		accepted?: string[];
		rejected?: string[];
		response?: string;
	};
	/** Attributes/metadata */
	attributes?: Record<string, string>;
}

/**
 * PutEmail Node Activity
 * Sends emails via SMTP (similar to NiFi PutEmail)
 *
 * This node can:
 * - Send emails via SMTP
 * - Support TLS/SSL
 * - Send to multiple recipients
 * - Include attachments
 * - Support both text and HTML emails
 */
export async function putEmailActivity(context: ExecutionContext): Promise<PutEmailOutputs> {
	const node = context.node;
	const inputs = (context.inputs || {}) as Partial<PutEmailInputs>;

	// Extract parameters from node
	const smtpHost = (node.parameters?.smtpHost || inputs.smtpHost || 'localhost') as string;
	const smtpPort = (node.parameters?.smtpPort || inputs.smtpPort || 587) as number;
	const smtpUsername = (node.parameters?.smtpUsername || inputs.smtpUsername) as string | undefined;
	const smtpPassword = (node.parameters?.smtpPassword || inputs.smtpPassword) as string | undefined;
	const useTLS = (node.parameters?.useTLS ?? inputs.useTLS ?? true) as boolean;
	const useSSL = (node.parameters?.useSSL ?? inputs.useSSL ?? false) as boolean;
	const from = (node.parameters?.from || inputs.from || '') as string;
	const to = node.parameters?.to || inputs.to || '';
	const cc = node.parameters?.cc || inputs.cc;
	const bcc = node.parameters?.bcc || inputs.bcc;
	const subject = (node.parameters?.subject || inputs.subject || '') as string;
	const text = (node.parameters?.text || inputs.text) as string | undefined;
	const html = (node.parameters?.html || inputs.html) as string | undefined;
	const replyTo = (node.parameters?.replyTo || inputs.replyTo) as string | undefined;
	const attachments = (node.parameters?.attachments || inputs.attachments) as
		| Array<{
				filename?: string;
				path?: string;
				content?: string | Buffer;
				contentType?: string;
		  }>
		| undefined;

	// Get email content from input data if not in parameters
	const inputData = context.inputs || {};
	const emailText = text || (inputData.text as string | undefined) || String(inputData.json || '');
	const emailHtml = html || (inputData.html as string | undefined);
	const emailSubject = subject || (inputData.subject as string | undefined) || 'n8n Email';

	// Parse recipient lists
	const parseRecipients = (recipients: unknown): string[] => {
		if (!recipients) {
			return [];
		}
		if (typeof recipients === 'string') {
			return recipients
				.split(',')
				.map((r) => r.trim())
				.filter(Boolean);
		}
		if (Array.isArray(recipients)) {
			return recipients.map((r) => String(r)).filter(Boolean);
		}
		return [];
	};

	const toList = parseRecipients(to);
	const ccList = parseRecipients(cc);
	const bccList = parseRecipients(bcc);

	if (toList.length === 0) {
		throw new Error('No recipient email addresses provided');
	}

	// Create SMTP transporter
	const transporter = nodemailer.createTransport({
		host: smtpHost,
		port: smtpPort,
		secure: useSSL, // true for 465, false for other ports
		auth:
			smtpUsername && smtpPassword
				? {
						user: smtpUsername,
						pass: smtpPassword,
					}
				: undefined,
		tls: useTLS && !useSSL ? { rejectUnauthorized: false } : undefined,
	});

	// Prepare email options
	const mailOptions = {
		from: from || smtpUsername || 'n8n@localhost',
		to: toList,
		cc: ccList.length > 0 ? ccList : undefined,
		bcc: bccList.length > 0 ? bccList : undefined,
		subject: emailSubject,
		text: emailText,
		html: emailHtml,
		replyTo: replyTo,
		attachments: attachments,
	};

	// Send email
	try {
		const info = await transporter.sendMail(mailOptions);

		// Prepare output
		const output: PutEmailOutputs = {
			json: {
				messageId: info.messageId,
				accepted: info.accepted,
				rejected: info.rejected,
				response: info.response,
			},
			attributes: {
				'email.messageId': info.messageId || '',
				'email.sent': 'true',
				'email.to': toList.join(','),
			},
		};

		return output;
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to send email: ${errorMessage}`);
	}
}
