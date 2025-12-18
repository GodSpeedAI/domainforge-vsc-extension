/**
 * DomainForge MCP Server Manager
 *
 * This module manages the lifecycle of the DomainForge MCP (Model Context Protocol) server.
 * The MCP server acts as a bridge between AI agents and the DomainForge LSP server,
 * providing controlled access to language features.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ChildProcess, spawn } from 'child_process';

/**
 * Rate limits configuration for MCP tools.
 * These define the maximum number of requests per second for each tool.
 */
export interface McpRateLimits {
	diagnostics: number;
	hover: number;
	definition: number;
	references: number;
	renamePreview: number;
	codeActions: number;
}

/**
 * Configuration for the MCP server.
 */
export interface McpConfig {
	enable: boolean;
	rateLimits: McpRateLimits;
	auditLogPath: string;
}

/**
 * Default rate limits matching the MCP server defaults.
 */
const DEFAULT_RATE_LIMITS: McpRateLimits = {
	diagnostics: 10,
	hover: 20,
	definition: 10,
	references: 5,
	renamePreview: 2,
	codeActions: 5
};

/**
 * Manages the MCP server process lifecycle.
 */
export class McpServerManager {
	private process: ChildProcess | undefined;
	private outputChannel: vscode.OutputChannel;
	private context: vscode.ExtensionContext;
	private restartCount: number = 0;
	private lastRestartTime: number = 0;
	private readonly MAX_RESTART_COUNT = 5;
	private readonly RESTART_WINDOW_MS = 60000; // 1 minute

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.outputChannel = vscode.window.createOutputChannel('DomainForge MCP Server');
	}

	/**
	 * Get the MCP configuration from VS Code settings.
	 */
	public getConfig(): McpConfig {
		const config = vscode.workspace.getConfiguration('domainforge.mcp');
		
		const rateLimits: McpRateLimits = {
			diagnostics: config.get<number>('rateLimits.diagnostics') ?? DEFAULT_RATE_LIMITS.diagnostics,
			hover: config.get<number>('rateLimits.hover') ?? DEFAULT_RATE_LIMITS.hover,
			definition: config.get<number>('rateLimits.definition') ?? DEFAULT_RATE_LIMITS.definition,
			references: config.get<number>('rateLimits.references') ?? DEFAULT_RATE_LIMITS.references,
			renamePreview: config.get<number>('rateLimits.renamePreview') ?? DEFAULT_RATE_LIMITS.renamePreview,
			codeActions: config.get<number>('rateLimits.codeActions') ?? DEFAULT_RATE_LIMITS.codeActions
		};

		return {
			enable: config.get<boolean>('enable') ?? false,
			rateLimits,
			auditLogPath: config.get<string>('auditLog.path') ?? ''
		};
	}

	/**
	 * Check if MCP server is enabled.
	 */
	public isEnabled(): boolean {
		return this.getConfig().enable;
	}

	/**
	 * Detect the current platform and return the appropriate MCP binary path.
	 */
	private getBundledMcpBinaryPath(): string | null {
		const platform = process.platform;
		const arch = process.arch;

		let platformDir: string;
		let binaryName: string;

		if (platform === 'win32' && arch === 'x64') {
			platformDir = 'windows-x64';
			binaryName = 'domainforge-mcp.exe';
		} else if (platform === 'darwin') {
			binaryName = 'domainforge-mcp';
			if (arch === 'x64') {
				platformDir = 'darwin-x64';
			} else if (arch === 'arm64') {
				platformDir = 'darwin-arm64';
			} else {
				return null;
			}
		} else if (platform === 'linux') {
			binaryName = 'domainforge-mcp';
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

		const fullPath = path.join(this.context.extensionPath, 'bin', platformDir, binaryName);

		if (!fs.existsSync(fullPath)) {
			console.warn(`MCP binary not found at detected path: ${fullPath}`);
			return null;
		}

		return fullPath;
	}

	/**
	 * Get the path to the MCP server binary.
	 * Checks user configuration first, then falls back to bundled binary.
	 */
	private getMcpServerPath(): string | null {
		// Check if user has specified a custom MCP server path
		const config = vscode.workspace.getConfiguration('domainforge.mcp');
		const customPath = config.get<string>('serverPath');

		if (customPath && customPath.trim() !== '') {
			return customPath;
		}

		// Use bundled binary
		return this.getBundledMcpBinaryPath();
	}

	/**
	 * Get the path to the LSP server binary (needed by MCP server).
	 */
	private getLspServerPath(): string | null {
		const config = vscode.workspace.getConfiguration('domainforge');
		const customPath = config.get<string>('server.path');

		if (customPath && customPath.trim() !== '') {
			return customPath;
		}

		// Use bundled binary
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

		const fullPath = path.join(this.context.extensionPath, 'bin', platformDir, binaryName);

		if (!fs.existsSync(fullPath)) {
			return null;
		}

		return fullPath;
	}

	/**
	 * Get workspace folder paths for the MCP server allowlist.
	 */
	private getWorkspacePaths(): string[] {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (!workspaceFolders) {
			return [];
		}
		return workspaceFolders.map(folder => folder.uri.fsPath);
	}

	/**
	 * Start the MCP server.
	 */
	public async start(): Promise<boolean> {
		if (this.process) {
			this.outputChannel.appendLine('MCP server is already running');
			return true;
		}

		const mcpConfig = this.getConfig();
		if (!mcpConfig.enable) {
			this.outputChannel.appendLine('MCP server is disabled in settings');
			return false;
		}

		const mcpPath = this.getMcpServerPath();
		if (!mcpPath) {
			vscode.window.showErrorMessage(
				`DomainForge MCP Server binary not found for platform: ${process.platform} (${process.arch}). ` +
				`Please specify 'domainforge.mcp.serverPath' in settings or ensure the binary is bundled.`
			);
			return false;
		}

		const lspPath = this.getLspServerPath();
		if (!lspPath) {
			vscode.window.showErrorMessage(
				'DomainForge LSP Server binary not found. MCP server requires LSP server.'
			);
			return false;
		}

		const workspacePaths = this.getWorkspacePaths();
		if (workspacePaths.length === 0) {
			vscode.window.showWarningMessage(
				'No workspace folders open. MCP server will have limited functionality.'
			);
		}

		// Build command line arguments
		const args: string[] = [
			'--lsp-path', lspPath
		];

		// Add workspace root (use first workspace folder)
		if (workspacePaths.length > 0) {
			args.push('--workspace-root', workspacePaths[0]);
		}

		// Build environment variables
		const env: NodeJS.ProcessEnv = {
			...process.env,
			// Set Rust log level
			RUST_LOG: vscode.workspace.getConfiguration('domainforge').get('trace.server') === 'verbose'
				? 'debug'
				: 'info'
		};

		// Add rate limit environment variables (the MCP server can read these)
		env['MCP_RATE_LIMIT_DIAGNOSTICS'] = mcpConfig.rateLimits.diagnostics.toString();
		env['MCP_RATE_LIMIT_HOVER'] = mcpConfig.rateLimits.hover.toString();
		env['MCP_RATE_LIMIT_DEFINITION'] = mcpConfig.rateLimits.definition.toString();
		env['MCP_RATE_LIMIT_REFERENCES'] = mcpConfig.rateLimits.references.toString();
		env['MCP_RATE_LIMIT_RENAME_PREVIEW'] = mcpConfig.rateLimits.renamePreview.toString();
		env['MCP_RATE_LIMIT_CODE_ACTIONS'] = mcpConfig.rateLimits.codeActions.toString();

		// Add audit log path if specified
		if (mcpConfig.auditLogPath) {
			env['MCP_AUDIT_LOG_PATH'] = mcpConfig.auditLogPath;
		}

		this.outputChannel.appendLine(`Starting MCP server: ${mcpPath}`);
		this.outputChannel.appendLine(`Arguments: ${args.join(' ')}`);
		this.outputChannel.appendLine(`Workspace paths: ${workspacePaths.join(', ')}`);

		try {
			this.process = spawn(mcpPath, args, {
				env,
				stdio: ['pipe', 'pipe', 'pipe']
			});

			// Handle stdout
			this.process.stdout?.on('data', (data: Buffer) => {
				this.outputChannel.appendLine(`[stdout] ${data.toString().trim()}`);
			});

			// Handle stderr
			this.process.stderr?.on('data', (data: Buffer) => {
				this.outputChannel.appendLine(`[stderr] ${data.toString().trim()}`);
			});

			// Handle process exit
			this.process.on('exit', (code: number | null, signal: string | null) => {
				this.outputChannel.appendLine(`MCP server exited with code ${code}, signal ${signal}`);
				this.process = undefined;
				
				// Auto-restart if unexpected exit
				if (code !== 0 && code !== null) {
					this.maybeRestart();
				}
			});

			// Handle process error
			this.process.on('error', (error: Error) => {
				this.outputChannel.appendLine(`MCP server error: ${error.message}`);
				vscode.window.showErrorMessage(`DomainForge MCP Server error: ${error.message}`);
				this.process = undefined;
			});

			this.outputChannel.appendLine('MCP server started successfully');
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.outputChannel.appendLine(`Failed to start MCP server: ${message}`);
			vscode.window.showErrorMessage(`Failed to start DomainForge MCP Server: ${message}`);
			return false;
		}
	}

	/**
	 * Attempt to restart the MCP server if it crashed.
	 */
	private async maybeRestart(): Promise<void> {
		const now = Date.now();
		
		// Reset restart count if outside the window
		if (now - this.lastRestartTime > this.RESTART_WINDOW_MS) {
			this.restartCount = 0;
		}

		if (this.restartCount >= this.MAX_RESTART_COUNT) {
			this.outputChannel.appendLine(
				`MCP server has crashed ${this.MAX_RESTART_COUNT} times in the last minute. ` +
				`Not restarting. Use 'DomainForge: Restart MCP Server' command to restart manually.`
			);
			vscode.window.showErrorMessage(
				'DomainForge MCP server crashed repeatedly. Check the output channel for details.'
			);
			return;
		}

		this.restartCount++;
		this.lastRestartTime = now;

		this.outputChannel.appendLine(`Restarting MCP server (attempt ${this.restartCount}/${this.MAX_RESTART_COUNT})...`);
		
		// Wait a short time before restarting to avoid rapid restarts
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		await this.start();
	}

	/**
	 * Stop the MCP server.
	 */
	public async stop(): Promise<void> {
		if (!this.process) {
			return;
		}

		this.outputChannel.appendLine('Stopping MCP server...');

		return new Promise((resolve) => {
			if (!this.process) {
				resolve();
				return;
			}

			// Set up timeout to force kill if graceful shutdown doesn't work
			const forceKillTimeout = setTimeout(() => {
				if (this.process) {
					this.outputChannel.appendLine('Force killing MCP server...');
					this.process.kill('SIGKILL');
				}
			}, 5000);

			this.process.once('exit', () => {
				clearTimeout(forceKillTimeout);
				this.process = undefined;
				this.outputChannel.appendLine('MCP server stopped');
				resolve();
			});

			// Send termination signal
			this.process.kill('SIGTERM');
		});
	}

	/**
	 * Restart the MCP server.
	 */
	public async restart(): Promise<boolean> {
		await this.stop();
		return this.start();
	}

	/**
	 * Check if the MCP server is running.
	 */
	public isRunning(): boolean {
		return this.process !== undefined && !this.process.killed;
	}

	/**
	 * Get the output channel for MCP server logs.
	 */
	public getOutputChannel(): vscode.OutputChannel {
		return this.outputChannel;
	}

	/**
	 * Dispose of the MCP server manager.
	 */
	public dispose(): void {
		this.stop().catch(err => {
			console.error('Error stopping MCP server during dispose:', err);
		});
		this.outputChannel.dispose();
	}
}
