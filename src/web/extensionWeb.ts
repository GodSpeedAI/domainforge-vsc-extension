/**
 * DomainForge VS Code Web Extension
 *
 * Browser-specific entry point for the extension.
 * This runs in the VS Code web extension host (vscode.dev, github.dev, Codespaces).
 */

import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
} from 'vscode-languageclient/browser';

let client: LanguageClient | undefined;

/**
 * Activate the web extension.
 *
 * Unlike the desktop extension which spawns a native binary,
 * this creates a Web Worker running the TypeScript LSP server
 * with sea-core WASM.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('[DomainForge Web Extension] Activating...');

    // Register restart command
    const restartCommand = vscode.commands.registerCommand(
        'domainforge.restartServer',
        async () => {
            vscode.window.showInformationMessage('Restarting DomainForge Language Server...');
            await startClient(context);
            vscode.window.showInformationMessage('DomainForge Language Server restarted');
        }
    );
    context.subscriptions.push(restartCommand);

    // Start the language client
    try {
        await startClient(context);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(
            `Failed to start DomainForge Language Server: ${message}`
        );
    }
}

/**
 * Start or restart the language client.
 */
async function startClient(context: vscode.ExtensionContext): Promise<void> {
    // Stop existing client if running
    if (client) {
        await client.stop();
        client = undefined;
    }

    // Client options
    const clientOptions: LanguageClientOptions = {
        documentSelector: [
            { language: 'domainforge' },
            { scheme: 'untitled', language: 'domainforge' },
        ],
        synchronize: {
            configurationSection: 'domainforge',
        },
        outputChannelName: 'DomainForge Language Server (Web)',
        initializationFailedHandler: (error) => {
            vscode.window.showErrorMessage(
                `DomainForge Language Server failed to initialize: ${error.message}`
            );
            return false;
        },
    };

    // Create a Web Worker for the language server
    const serverMain = vscode.Uri.joinPath(
        context.extensionUri,
        'dist/web/browserServer.js'
    );
    const worker = new Worker(serverMain.toString(true));

    // Create the language client
    client = new LanguageClient(
        'domainforge',
        'DomainForge Language Server',
        clientOptions,
        worker
    );

    // Start the client
    await client.start();
    console.log('[DomainForge Web Extension] Language client started');
}

/**
 * Deactivate the web extension.
 */
export async function deactivate(): Promise<void> {
    if (client) {
        await client.stop();
        client = undefined;
    }
    console.log('[DomainForge Web Extension] Deactivated');
}
