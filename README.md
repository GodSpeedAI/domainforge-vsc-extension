# DomainForge VS Code Extension

Language support for the **DomainForge SEA DSL** - syntax highlighting, diagnostics, and formatting for `.sea` files.

![VS Code](https://img.shields.io/badge/vscode-1.107+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 🎨 **Syntax Highlighting** - Full TextMate grammar for SEA DSL
- 🔍 **Diagnostics** - Real-time parse error detection
- 📐 **Formatting** - Format Document with configurable indent style
- 🔗 **Go to Definition** - Navigate to entity/resource declarations
- 💡 **Hover Information** - Rich tooltips for entities, resources, flows
- ✨ **Code Completion** - Context-aware suggestions
- 🌐 **Web Support** - Works in vscode.dev and github.dev

## Requirements

- VS Code 1.107.0 or later
- For desktop: Native LSP binary (bundled)
- For web: sea-core WASM module (bundled)

## Extension Settings

| Setting                              | Type                             | Default | Description                                         |
| ------------------------------------ | -------------------------------- | ------- | --------------------------------------------------- |
| `domainforge.trace.server`           | `off` \| `messages` \| `verbose` | `off`   | Traces communication with language server           |
| `domainforge.server.path`            | `string`                         | `""`    | Custom path to LSP binary (leave empty for bundled) |
| `domainforge.formatting.indentStyle` | `space` \| `tab`                 | `space` | Indent style for formatting                         |
| `domainforge.formatting.indentWidth` | `number`                         | `4`     | Spaces per indent level (1-8)                       |

### MCP (Model Context Protocol) Settings

The MCP server enables AI agents (like VS Code Copilot, Claude, etc.) to query DomainForge language features in a controlled, secure manner.

| Setting                                    | Type      | Default | Description                                         |
| ------------------------------------------ | --------- | ------- | --------------------------------------------------- |
| `domainforge.mcp.enable`                   | `boolean` | `false` | Enable MCP server for AI agent integration          |
| `domainforge.mcp.serverPath`               | `string`  | `""`    | Custom path to MCP binary (leave empty for bundled) |
| `domainforge.mcp.rateLimits.diagnostics`   | `number`  | `10`    | Max requests/second for diagnostics tool            |
| `domainforge.mcp.rateLimits.hover`         | `number`  | `20`    | Max requests/second for hover tool                  |
| `domainforge.mcp.rateLimits.definition`    | `number`  | `10`    | Max requests/second for definition tool             |
| `domainforge.mcp.rateLimits.references`    | `number`  | `5`     | Max requests/second for references tool             |
| `domainforge.mcp.rateLimits.renamePreview` | `number`  | `2`     | Max requests/second for rename preview tool         |
| `domainforge.mcp.rateLimits.codeActions`   | `number`  | `5`     | Max requests/second for code actions tool           |
| `domainforge.mcp.auditLog.path`            | `string`  | `""`    | Path to MCP audit log file (empty = disabled)       |

## Commands

| Command                                | Description                         |
| -------------------------------------- | ----------------------------------- |
| `DomainForge: Restart Language Server` | Restart the LSP server              |
| `DomainForge: Restart MCP Server`      | Restart the MCP server (if enabled) |
| `DomainForge: Show MCP Server Logs`    | Show MCP server output channel      |

## Web Extension Support

This extension works in browser-based VS Code environments:

- ✅ **vscode.dev** - Full web support
- ✅ **github.dev** - Open any repo and edit `.sea` files
- ✅ **GitHub Codespaces** - Cloud development environments

### Web Feature Availability

| Feature             | Desktop | Web             |
| ------------------- | ------- | --------------- |
| Syntax Highlighting | ✅      | ✅              |
| Diagnostics         | ✅ Full | ✅ Parse errors |
| Formatting          | ✅      | ✅              |
| Hover               | ✅      | ❌              |
| Go to Definition    | ✅      | ❌              |
| Code Completion     | ✅      | ❌              |
| Code Actions        | ✅      | ❌              |

> **Note**: Web version uses sea-core WASM for core functionality. Advanced features require the native LSP server.

## Usage

1. Open a `.sea` file
2. Enjoy syntax highlighting and diagnostics
3. Use `Format Document` (Shift+Alt+F) to format
4. Hover over entities/resources for information
5. Ctrl+Click to go to definition

## Example

```sea
Entity "Warehouse" in logistics
Entity "Factory" in manufacturing

Resource "Cameras" units

Flow "Cameras" from "Warehouse" to "Factory" quantity 100
```

## Known Issues

- Web version only provides parse-level diagnostics (no semantic validation)
- Large files (>10,000 lines) may experience performance delays

## Release Notes

### 0.0.1

- Initial release
- Syntax highlighting for SEA DSL
- LSP integration for diagnostics and formatting
- Web extension support via WASM

## Development

```bash
# Install dependencies
pnpm install

# Build (desktop + web)
pnpm run compile

# Build web only
pnpm run compile-web

# Run tests
pnpm test

# Test in browser
pnpm run test-web
```

## License

MIT
