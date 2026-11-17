/**
 * DomainForge VS Code Extension
 *
 * This extension provides Language Server Protocol (LSP) integration for the
 * DomainForge SEA DSL. It spawns the Rust-based LSP server and forwards
 * all language operations to it.
 * 
 * Optionally, it can also spawn the MCP (Model Context Protocol) server
 * to enable AI agent integration.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';
import { McpServerManager } from './mcpServer';

let client: LanguageClient | undefined;
let mcpServerManager: McpServerManager | undefined;

/**
 * Response from the sea/astJson custom LSP request.
 */
interface AstJsonResponse {
	/** The AST JSON string */
	astJson: string;
	/** Document version at time of AST generation */
	version: number;
	/** Whether the document parsed successfully */
	success: boolean;
	/** Error message if parsing failed */
	error?: string;
}

/**
 * Detect the current platform and return the appropriate binary path relative to the extension folder.
 */
function getBundledBinaryPath(context: vscode.ExtensionContext): string | null {
	const platform = process.platform;
	const arch = process.arch;

	let platformDir: string;
	let binaryName: string;

	if (platform === 'win32' && arch === 'x64') {
		platformDir = 'windows-x64';
		binaryName = 'domainforge-lsp.exe';
	} else if (platform === 'darwin') {
		binaryName = 'domainforge-lsp';
		if (arch === 'x64') {
			platformDir = 'darwin-x64';
		} else if (arch === 'arm64') {
			platformDir = 'darwin-arm64';
		} else {
			return null;
		}
	} else if (platform === 'linux') {
		binaryName = 'domainforge-lsp';
		if (arch === 'x64') {
			platformDir = 'linux-x64';
		} else if (arch === 'arm64') {
			platformDir = 'linux-arm64';
		} else {
			return null;
		}
	} else {
		return null;
	}

	const fullPath = path.join(context.extensionPath, 'bin', platformDir, binaryName);

	if (!fs.existsSync(fullPath)) {
		console.warn(`LSP binary not found at detected path: ${fullPath}`);
		return null;
	}

	return fullPath;
}

/**
 * Get the path to the LSP server binary.
 * Checks user configuration first, then falls back to bundled binary.
 */
function getServerPath(context: vscode.ExtensionContext): string | null {
	// Check if user has specified a custom server path
	const config = vscode.workspace.getConfiguration('domainforge');
	const customPath = config.get<string>('server.path');

	if (customPath && customPath.trim() !== '') {
		return customPath;
	}

	// Use bundled binary
	return getBundledBinaryPath(context);
}

/**
 * Create the Language Client with proper configuration.
 */
function createLanguageClient(context: vscode.ExtensionContext): LanguageClient | undefined {
	const serverPath = getServerPath(context);

	if (!serverPath) {
		vscode.window.showErrorMessage(
			`DomainForge Language Server binary not found for platform: ${process.platform} (${process.arch}). Please specify 'domainforge.server.path' in settings.`
		);
		return undefined;
	}

	// Server options - run the LSP binary with stdio transport
	const serverOptions: ServerOptions = {
		command: serverPath,
		transport: TransportKind.stdio,
		options: {
			env: {
				...process.env,
				// Enable debug logging when trace is enabled
				RUST_LOG: vscode.workspace.getConfiguration('domainforge').get('trace.server') === 'verbose'
					? 'debug'
					: 'info'
			}
		}
	};

	// Client options - configure document types and synchronization
	const clientOptions: LanguageClientOptions = {
		// Only activate for SEA files
		documentSelector: [
			{
				scheme: 'file',
				language: 'domainforge'
			}
		],

		// Synchronize configuration changes to the server
		synchronize: {
			// Automatically send didChangeConfiguration when these settings change
			configurationSection: 'domainforge'
		},

		// Output channel for server logs
		outputChannelName: 'DomainForge Language Server',

		// Handle server notifications
		initializationFailedHandler: (error) => {
			vscode.window.showErrorMessage(
				`DomainForge Language Server failed to initialize: ${error.message}`
			);
			return false;
		}
	};

	return new LanguageClient(
		'domainforge',
		'DomainForge Language Server',
		serverOptions,
		clientOptions
	);
}

/**
 * Start or restart the language server.
 */
async function startServer(context: vscode.ExtensionContext): Promise<void> {
	// Stop existing client if running
	if (client) {
		await client.stop();
		client = undefined;
	}

	try {
		const newClient = createLanguageClient(context);
		if (newClient) {
			client = newClient;
			await client.start();
			console.log('DomainForge Language Server started successfully');
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(
			`Failed to start DomainForge Language Server: ${message}`
		);
	}
}

/**
 * Start the MCP server if enabled.
 */
async function startMcpServerIfEnabled(context: vscode.ExtensionContext): Promise<void> {
	if (!mcpServerManager) {
		mcpServerManager = new McpServerManager(context);
	}

	if (mcpServerManager.isEnabled()) {
		const started = await mcpServerManager.start();
		if (started) {
			console.log('DomainForge MCP Server started successfully');
		}
	}
}



/**
 * Activate the extension.
 * Called when VS Code first encounters a .sea file or when the extension is explicitly activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	console.log('DomainForge extension is activating...');

	// Initialize MCP server manager
	mcpServerManager = new McpServerManager(context);

	// Register restart LSP server command
	const restartCommand = vscode.commands.registerCommand(
		'domainforge.restartServer',
		async () => {
			vscode.window.showInformationMessage('Restarting DomainForge Language Server...');
			await startServer(context);
			vscode.window.showInformationMessage('DomainForge Language Server restarted');
		}
	);
	context.subscriptions.push(restartCommand);

	// Register restart MCP server command
	const restartMcpCommand = vscode.commands.registerCommand(
		'domainforge.restartMcpServer',
		async () => {
			if (!mcpServerManager) {
				vscode.window.showErrorMessage('MCP Server Manager not initialized');
				return;
			}

			if (!mcpServerManager.isEnabled()) {
				vscode.window.showWarningMessage(
					'MCP Server is not enabled. Set "domainforge.mcp.enable" to true in settings.'
				);
				return;
			}

			vscode.window.showInformationMessage('Restarting DomainForge MCP Server...');
			const success = await mcpServerManager.restart();
			if (success) {
				vscode.window.showInformationMessage('DomainForge MCP Server restarted');
			} else {
				vscode.window.showErrorMessage('Failed to restart DomainForge MCP Server');
			}
		}
	);
	context.subscriptions.push(restartMcpCommand);

	// Register show MCP logs command
	const showMcpLogsCommand = vscode.commands.registerCommand(
		'domainforge.showMcpLogs',
		() => {
			if (mcpServerManager) {
				mcpServerManager.getOutputChannel().show();
			}
		}
	);
	context.subscriptions.push(showMcpLogsCommand);

	// Register Show AST JSON command
	const showAstJsonCommand = vscode.commands.registerCommand(
		'domainforge.showAstJson',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'domainforge') {
				vscode.window.showWarningMessage('Open a .sea file first');
				return;
			}

			if (!client || !client.isRunning()) {
				vscode.window.showErrorMessage('Language Server is not running');
				return;
			}

			try {
				const response = await client.sendRequest<AstJsonResponse>('sea/astJson', {
					uri: editor.document.uri.toString(),
					pretty: true
				});

				if (!response.success) {
					vscode.window.showErrorMessage(`AST generation failed: ${response.error}`);
					return;
				}

				// Open in a new untitled document
				const doc = await vscode.workspace.openTextDocument({
					content: response.astJson,
					language: 'json'
				});
				await vscode.window.showTextDocument(doc, { preview: true });
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`Failed to get AST JSON: ${message}`);
			}
		}
	);
	context.subscriptions.push(showAstJsonCommand);

	// Register Copy AST JSON command
	const copyAstJsonCommand = vscode.commands.registerCommand(
		'domainforge.copyAstJson',
		async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor || editor.document.languageId !== 'domainforge') {
				vscode.window.showWarningMessage('Open a .sea file first');
				return;
			}

			if (!client || !client.isRunning()) {
				vscode.window.showErrorMessage('Language Server is not running');
				return;
			}

			try {
				const response = await client.sendRequest<AstJsonResponse>('sea/astJson', {
					uri: editor.document.uri.toString(),
					pretty: true
				});

				if (!response.success) {
					vscode.window.showErrorMessage(`AST generation failed: ${response.error}`);
					return;
				}

				await vscode.env.clipboard.writeText(response.astJson);
				vscode.window.showInformationMessage('AST JSON copied to clipboard');
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				vscode.window.showErrorMessage(`Failed to get AST JSON: ${message}`);
			}
		}
	);
	context.subscriptions.push(copyAstJsonCommand);

	// Watch for configuration changes
	const configWatcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
		// Handle LSP server path changes
		if (event.affectsConfiguration('domainforge.server.path')) {
			// Server path changed - restart with new binary
			vscode.window.showInformationMessage(
				'DomainForge server path changed. Restarting...'
			);
			await startServer(context);
		}

		// Handle MCP enable/disable changes
		if (event.affectsConfiguration('domainforge.mcp.enable')) {
			const config = vscode.workspace.getConfiguration('domainforge.mcp');
			const enabled = config.get<boolean>('enable') ?? false;

			if (enabled && mcpServerManager && !mcpServerManager.isRunning()) {
				vscode.window.showInformationMessage('Starting DomainForge MCP Server...');
				await mcpServerManager.start();
			} else if (!enabled && mcpServerManager && mcpServerManager.isRunning()) {
				vscode.window.showInformationMessage('Stopping DomainForge MCP Server...');
				await mcpServerManager.stop();
			}
		}

		// Handle MCP server path changes
		if (event.affectsConfiguration('domainforge.mcp.serverPath')) {
			if (mcpServerManager && mcpServerManager.isEnabled() && mcpServerManager.isRunning()) {
				vscode.window.showInformationMessage('MCP server path changed. Restarting...');
				await mcpServerManager.restart();
			}
		}

		// Handle MCP rate limit changes (restart to apply new limits)
		if (event.affectsConfiguration('domainforge.mcp.rateLimits')) {
			if (mcpServerManager && mcpServerManager.isRunning()) {
				vscode.window.showInformationMessage('MCP rate limits changed. Restarting to apply...');
				await mcpServerManager.restart();
			}
		}

		// Note: Other config changes (like formatting options) are handled
		// automatically by the language client via synchronize.configurationSection
	});
	context.subscriptions.push(configWatcher);

	// Start the language server
	await startServer(context);

	// Start MCP server if enabled
	await startMcpServerIfEnabled(context);
}

/**
 * Deactivate the extension.
 * Called when the extension is being deactivated.
 */
export async function deactivate(): Promise<void> {
	// Stop MCP server
	if (mcpServerManager) {
		mcpServerManager.dispose();
		mcpServerManager = undefined;
	}

	// Stop LSP client
	if (client) {
		await client.stop();
		client = undefined;
	}
}
