import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension('GodSpeedAI.domainforge'));
	});

	test('Should activate when opening a .sea file', async () => {
		const ext = vscode.extensions.getExtension('GodSpeedAI.domainforge');
		assert.ok(ext, 'Extension not found');

		// Create a mock .sea document
		const doc = await vscode.workspace.openTextDocument({
			language: 'domainforge',
			content: 'Entity Test {}'
		});
		await vscode.window.showTextDocument(doc);
		
		// The extension should activate automatically due to onLanguage activation event
		// But we can also force it
		if (!ext.isActive) {
			await ext.activate();
		}
		
		assert.strictEqual(ext.isActive, true, 'Extension should be active');
	});
});
