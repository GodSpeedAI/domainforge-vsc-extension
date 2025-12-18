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

1. Create an Azure DevOps Personal Access Token (PAT) with `Marketplace > Manage` scope
2. Add `VSCE_PAT` as a repository secret in GitHub
3. Set repository variable `MARKETPLACE_PUBLISH_ENABLED` to `true`

### Manual Publishing

If automated publishing fails:

```bash
npx vsce publish --packagePath domainforge-X.Y.Z.vsix
```

## LSP Server Releases

The extension downloads LSP binaries from the corresponding `domainforge-lsp` release.
Ensure LSP releases are created before or simultaneously with extension releases.
