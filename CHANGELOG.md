# Change Log

All notable changes to the "DomainForge" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.0] - 2025-12-25

### Added

- **Open VSX Registry Support**: Extension is now published to both VS Code Marketplace and [Open VSX Registry](https://open-vsx.org/), enabling installation on VS Code forks (VSCodium, code-server, Gitpod, etc.)

### Changed

- **Release Workflow**: Updated GitHub Actions release workflow to use `HaaLeo/publish-vscode-extension@v2` action for dual marketplace publishing
- **LSP Versioning**: Release workflow now uses the latest LSP release instead of requiring version-matched releases, allowing independent versioning
- **Documentation**: Updated RELEASE.md with instructions for both marketplace tokens

## [0.0.2] - 2025-12-24

### Changed

- **Documentation**: Updated README with comprehensive SEA DSL syntax reference

  - Basic and advanced grammar examples
  - All 14 declaration types documented
  - Link to DomainForge changelog for release notes

- **WASM Update**: Updated vendored sea-core WASM to v0.7.1
  - AST v3 schema with expanded node definitions
  - Resource/Flow annotations support (`@replaces`, `@changes`)
  - Parser location tracking (line/column in AST nodes)
  - Improved error messages with structured module errors

## [0.0.1] - 2025-12-18

- Initial release
