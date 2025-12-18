import * as assert from 'assert';
import * as vscode from 'vscode';

/**
 * Test suite for MCP (Model Context Protocol) server integration.
 * 
 * These tests verify the configuration schema and command registration.
 * Note: Full integration tests with the actual MCP binary require the binary to be present,
 * which only happens after the release process bundles the binaries.
 */
suite('MCP Server Test Suite', () => {
	test('MCP configuration schema should be defined', async () => {
		const config = vscode.workspace.getConfiguration('domainforge.mcp');
		
		// Verify all configuration keys exist with correct defaults
		assert.strictEqual(config.get('enable'), false, 'MCP enable should default to false');
		assert.strictEqual(config.get('serverPath'), '', 'MCP serverPath should default to empty');
		assert.strictEqual(config.get('auditLog.path'), '', 'MCP auditLog.path should default to empty');
	});

	test('MCP rate limits configuration should have correct defaults', async () => {
		const config = vscode.workspace.getConfiguration('domainforge.mcp');
		
		// Verify rate limits with their documented defaults
		assert.strictEqual(config.get('rateLimits.diagnostics'), 10, 'diagnostics rate limit should be 10');
		assert.strictEqual(config.get('rateLimits.hover'), 20, 'hover rate limit should be 20');
		assert.strictEqual(config.get('rateLimits.definition'), 10, 'definition rate limit should be 10');
		assert.strictEqual(config.get('rateLimits.references'), 5, 'references rate limit should be 5');
		assert.strictEqual(config.get('rateLimits.renamePreview'), 2, 'renamePreview rate limit should be 2');
		assert.strictEqual(config.get('rateLimits.codeActions'), 5, 'codeActions rate limit should be 5');
	});

	test('MCP restart command should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('domainforge.restartMcpServer'),
			'restartMcpServer command should be registered'
		);
	});

	test('MCP show logs command should be registered', async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes('domainforge.showMcpLogs'),
			'showMcpLogs command should be registered'
		);
	});

	test('MCP restart command should warn when MCP is disabled', async () => {
		// Ensure MCP is disabled (default)
		const config = vscode.workspace.getConfiguration('domainforge.mcp');
		assert.strictEqual(config.get('enable'), false, 'MCP should be disabled by default');

		// The command should exist and be executable (it will show a warning)
		// We verify the command doesn't throw
		await assert.doesNotReject(
			async () => await vscode.commands.executeCommand('domainforge.restartMcpServer'),
			'Restart MCP command should not throw when MCP is disabled'
		);
	});
});
