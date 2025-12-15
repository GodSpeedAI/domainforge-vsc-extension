# DomainForge VS Code Extension - Copilot Instructions

Targeted guidance for AI coding agents working on the `domainforge-vsc-extension` (Language Client).

## Architecture

**"The Client is a Process Manager."**

1.  **Role**: capabilities are limited to:
    *   Spawning the `domainforge-lsp` binary.
    *   Forwarding configuration changes (`domainforge.*` settings).
    *   Registering the `.sea` file association.

2.  **Dependencies**:
    *   `vscode-languageclient`: The heavy lifter for LSP communication.
    *   `vscode`: Types and API for UI integration.

## Developer Workflows

### Build & Package
```bash
# Compile TypeScript (uses esbuild)
npm run compile
# or
pnpm run compile

# Create .vsix package
npm run package
# or
pnpm run package
```

### Debugging
*   Use the **"Extension"** launch configuration in VS Code.
*   This spawns a new "Extension Development Host" window.

## Code Patterns & Conventions

### 1. Server Spawning
The client must locate the correct binary for the current OS.

```typescript
// ✅ CORRECT: Dynamic binary selection
const serverPath = context.asAbsolutePath(
    path.join('bin', os.platform() === 'win32' ? 'domainforge-lsp.exe' : 'domainforge-lsp')
);

// ❌ WRONG: Hardcoded paths or assuming 'sea-core' is available directly
```

### 2. Configuration Sync
Register for configuration changes to push settings to the server dynamically.

```typescript
// ✅ CORRECT: Listen for config changes
vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectConfiguration('domainforge')) {
        client.sendNotification('workspace/didChangeConfiguration', ...);
    }
});
```

### 3. async/await
ALWAYS use `async/await` for file I/O and process launching. Avoid blocking the extension host main thread.

## References
*   `../domainforge-lsp/docs/spec.md`: The detailed specification for the whole system.
