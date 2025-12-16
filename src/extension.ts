/**
 * DomainForge VS Code Extension
 *
 * This extension provides Language Server Protocol (LSP) integration for the
 * DomainForge SEA DSL. It spawns the Rust-based LSP server and forwards
 * all language operations to it.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

/**
 * Detect the current platform and return the appropriate binary name.
 */
function getBinaryName(): string {
	const platform = process.platform;
	const arch = process.arch;

	if (platform === 'win32') {
		return 'domainforge-lsp.exe';
	} else if (platform === 'darwin') {
		// macOS - check for ARM64 vs x64
		return arch === 'arm64' ? 'domainforge-lsp-darwin-arm64' : 'domainforge-lsp-darwin-x64';
	} else {
		// Linux
		return 'domainforge-lsp';
	}
}

/**
 * Get the path to the LSP server binary.
 * Checks user configuration first, then falls back to bundled binary.
 */
function getServerPath(context: vscode.ExtensionContext): string {
	// Check if user has specified a custom server path
	const config = vscode.workspace.getConfiguration('domainforge');
	const customPath = config.get<string>('server.path');

	if (customPath && customPath.trim() !== '') {
		return customPath;
	}

	// Use bundled binary
	const binaryName = getBinaryName();
	return path.join(context.extensionPath, 'bin', binaryName);
}

/**
 * Create the Language Client with proper configuration.
 */
function createLanguageClient(context: vscode.ExtensionContext): LanguageClient {
	const serverPath = getServerPath(context);

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
		client = createLanguageClient(context);
		await client.start();
		console.log('DomainForge Language Server started successfully');
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(
			`Failed to start DomainForge Language Server: ${message}`
		);
	}
}

/**
 * Activate the extension.
 * Called when VS Code first encounters a .sea file or when the extension is explicitly activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
	console.log('DomainForge extension is activating...');

	// Register restart command
	const restartCommand = vscode.commands.registerCommand(
		'domainforge.restartServer',
		async () => {
			vscode.window.showInformationMessage('Restarting DomainForge Language Server...');
			await startServer(context);
			vscode.window.showInformationMessage('DomainForge Language Server restarted');
		}
	);
	context.subscriptions.push(restartCommand);

	// Watch for configuration changes that affect the server path
	const configWatcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
		if (event.affectsConfiguration('domainforge.server.path')) {
			// Server path changed - restart with new binary
			vscode.window.showInformationMessage(
				'DomainForge server path changed. Restarting...'
			);
			await startServer(context);
		}
		// Note: Other config changes (like formatting options) are handled
		// automatically by the language client via synchronize.configurationSection
	});
	context.subscriptions.push(configWatcher);

	// Start the language server
	await startServer(context);
}

/**
 * Deactivate the extension.
 * Called when the extension is being deactivated.
 */
export async function deactivate(): Promise<void> {
	if (client) {
		await client.stop();
		client = undefined;
	}
}
