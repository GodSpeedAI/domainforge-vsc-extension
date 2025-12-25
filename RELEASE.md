# Release Process

This document describes the version management and release process for the DomainForge VS Code extension.

## Versioning Policy

The extension follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (`X.0.0`): Breaking changes to LSP protocol, removed features, or incompatible configuration changes
- **MINOR** (`0.X.0`): New features, new LSP capabilities, backward-compatible enhancements
- **PATCH** (`0.0.X`): Bug fixes, performance improvements, documentation updates

### Version Synchronization

Versions should be synchronized across:

- `package.json` - VS Code extension version
- `domainforge-lsp/Cargo.toml` - LSP server version
- Both should use the same version tag for releases

## Release Checklist

### Pre-Release

1. **Update CHANGELOG.md**

   - Add new version header with date
   - Document all changes under appropriate categories (Added, Changed, Fixed, Removed)

2. **Bump Version**

   ```bash
   # Update package.json version
   npm version <major|minor|patch> --no-git-tag-version
   ```

3. **Verify Quality**

   ```bash
   pnpm run check-types
   pnpm lint
   pnpm test
   ```

4. **Update Documentation**
   - Ensure README reflects any new features
   - Update settings documentation if configuration changed

### Release

5. **Create Git Tag**

   ```bash
   git add .
   git commit -m "chore: release vX.Y.Z"
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   ```

6. **Push to Trigger Release**

   ```bash
   git push origin main --tags
   ```

7. **Verify Release**
   - Check GitHub Actions for successful release workflow
   - Verify VSIX artifact is attached to GitHub release
   - If marketplace publish is enabled, verify extension is updated

## Marketplace Publishing

### Setup

1. **VS Code Marketplace**: Create an Azure DevOps Personal Access Token (PAT) with `Marketplace > Manage` scope
2. **Open VSX Registry**: Create a Personal Access Token at [open-vsx.org](https://open-vsx.org/user-settings/tokens)
3. Add the following repository secrets in GitHub:
   - `VSCE_PAT` - Azure DevOps PAT for VS Code Marketplace
   - `OPEN_VSX_TOKEN` - Personal Access Token for Open VSX Registry
4. Set repository variable `MARKETPLACE_PUBLISH_ENABLED` to `true`

> **Note**: The release workflow first publishes to Open VSX Registry, then reuses the generated VSIX to publish to VS Code Marketplace, ensuring identical artifacts across both registries.

### Manual Publishing

If automated publishing fails:

```bash
# VS Code Marketplace
npx vsce publish --packagePath domainforge-X.Y.Z.vsix

# Open VSX Registry
npx ovsx publish domainforge-X.Y.Z.vsix -p $OPEN_VSX_TOKEN
```

## LSP Server Releases

The extension release workflow automatically downloads LSP binaries from the **latest** `domainforge-lsp` release. This decouples versioning between the extension and LSP server, allowing independent release cycles.

> **Note**: If you need to bundle a specific LSP version, you can manually download the binaries and include them in the `bin/` directory before packaging.
