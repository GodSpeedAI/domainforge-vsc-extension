/**
 * DomainForge Browser Language Server
 *
 * This is the browser-side LSP server that runs in a Web Worker.
 * It uses sea-core WASM for parsing and formatting.
 */

import {
    createConnection,
    BrowserMessageReader,
    BrowserMessageWriter,
    InitializeParams,
    InitializeResult,
    TextDocuments,
    Diagnostic,
    DiagnosticSeverity,
    TextDocumentSyncKind,
    DocumentFormattingParams,
    TextEdit,
    Range,
    Position,
} from 'vscode-languageserver/browser';
import { TextDocument } from 'vscode-languageserver-textdocument';

import init, { Graph, formatSource } from '../../wasm/sea_core.js';

// Create browser-based connection
const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);
const connection = createConnection(messageReader, messageWriter);

// Document manager
const documents = new TextDocuments(TextDocument);

// Track WASM initialization state
let wasmInitialized = false;

connection.onInitialize(async (_params: InitializeParams): Promise<InitializeResult> => {
    console.log('[DomainForge Browser Server] Initializing...');

    try {
        // Initialize WASM module
        await init();
        wasmInitialized = true;
        console.log('[DomainForge Browser Server] WASM initialized successfully');
    } catch (error) {
        console.error('[DomainForge Browser Server] Failed to initialize WASM:', error);
    }

    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            documentFormattingProvider: true,
        },
    };
});

connection.onInitialized(() => {
    console.log('[DomainForge Browser Server] Server initialized');
});

// Validate document on content change
documents.onDidChangeContent(async (change) => {
    if (!wasmInitialized) {
        return;
    }

    const diagnostics = await validateDocument(change.document);
    connection.sendDiagnostics({
        uri: change.document.uri,
        diagnostics,
    });
});

// Clear diagnostics when document is closed
documents.onDidClose((event) => {
    connection.sendDiagnostics({
        uri: event.document.uri,
        diagnostics: [],
    });
});

/**
 * Validate a SEA document by parsing it with the WASM module.
 * Returns diagnostics for any parse errors.
 */
async function validateDocument(document: TextDocument): Promise<Diagnostic[]> {
    const text = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
        // Try to parse the document
        const graph = Graph.parse(text);
        // If parsing succeeds, free the graph and return empty diagnostics
        graph.free();
    } catch (error) {
        // Parse error - extract information and create diagnostic
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Try to extract line/column from error message
        // Common format: "Parse error at line X, column Y: message"
        const locationMatch = errorMessage.match(/line\s+(\d+)(?:,?\s*column\s+(\d+))?/i);

        let line = 0;
        let column = 0;

        if (locationMatch) {
            line = Math.max(0, parseInt(locationMatch[1], 10) - 1); // Convert to 0-based
            column = locationMatch[2] ? Math.max(0, parseInt(locationMatch[2], 10) - 1) : 0;
        }

        // Create a reasonable range for the error
        const startPos: Position = { line, character: column };
        const endPos: Position = { line, character: column + 10 };
        const range: Range = { start: startPos, end: endPos };

        diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range,
            message: errorMessage,
            source: 'domainforge',
            code: 'E005', // Syntax error code
        });
    }

    return diagnostics;
}

// Document formatting handler
connection.onDocumentFormatting(async (params: DocumentFormattingParams): Promise<TextEdit[]> => {
    if (!wasmInitialized) {
        console.warn('[DomainForge Browser Server] Formatting requested but WASM not initialized');
        return [];
    }

    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return [];
    }

    const text = document.getText();

    try {
        // Get formatting options from params
        const indentWidth = params.options.tabSize ?? 4;
        const useTabs = !params.options.insertSpaces;

        // Format using sea-core WASM
        const formatted = formatSource(text, indentWidth, useTabs, true, true);

        // If formatted is the same as original, return empty edits
        if (formatted === text) {
            return [];
        }

        // Return a single edit replacing the entire document
        const lastLine = document.lineCount - 1;
        const lastLineLength = document.getText({
            start: { line: lastLine, character: 0 },
            end: { line: lastLine, character: Number.MAX_VALUE },
        }).length;

        return [
            TextEdit.replace(
                {
                    start: { line: 0, character: 0 },
                    end: { line: lastLine, character: lastLineLength },
                },
                formatted
            ),
        ];
    } catch (error) {
        // Formatting failed (likely due to parse error)
        console.warn('[DomainForge Browser Server] Formatting failed:', error);
        return [];
    }
});

// Listen for document events
documents.listen(connection);

// Start listening on the connection
connection.listen();

console.log('[DomainForge Browser Server] Server started');
