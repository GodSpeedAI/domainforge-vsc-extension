const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const webOnly = process.argv.includes('--web');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[build] started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				if (location) {
					console.error(`    ${location.file}:${location.line}:${location.column}:`);
				}
			});
			console.log('[build] finished');
		});
	},
};

/**
 * Plugin to copy WASM files to the output directory
 * @type {import('esbuild').Plugin}
 */
const copyWasmPlugin = {
	name: 'copy-wasm',

	setup(build) {
		build.onEnd(() => {
			const wasmSrc = path.join(__dirname, 'wasm');
			const wasmDest = path.join(__dirname, 'dist', 'web');

			// Ensure destination directory exists
			if (!fs.existsSync(wasmDest)) {
				fs.mkdirSync(wasmDest, { recursive: true });
			}

			// Copy WASM files
			const filesToCopy = ['sea_core.js', 'sea_core_bg.wasm'];
			for (const file of filesToCopy) {
				const src = path.join(wasmSrc, file);
				const dest = path.join(wasmDest, file);
				if (fs.existsSync(src)) {
					fs.copyFileSync(src, dest);
					console.log(`[copy-wasm] Copied ${file}`);
				}
			}
		});
	},
};

/**
 * Desktop extension build configuration (Node.js)
 * @type {import('esbuild').BuildOptions}
 */
const desktopBuildOptions = {
	entryPoints: ['src/extension.ts'],
	bundle: true,
	format: 'cjs',
	minify: production,
	sourcemap: !production,
	sourcesContent: false,
	platform: 'node',
	outfile: 'dist/extension.js',
	external: ['vscode'],
	logLevel: 'silent',
	plugins: [esbuildProblemMatcherPlugin],
};

/**
 * Web extension build configuration (Browser)
 * @type {import('esbuild').BuildOptions}
 */
const webBuildOptions = {
	entryPoints: [
		'src/web/extensionWeb.ts',
		'src/web/browserServer.ts',
	],
	bundle: true,
	format: 'iife',
	minify: production,
	sourcemap: !production,
	sourcesContent: false,
	platform: 'browser',
	outdir: 'dist/web',
	external: ['vscode'],
	logLevel: 'silent',
	define: {
		'global': 'globalThis',
	},
	plugins: [esbuildProblemMatcherPlugin, copyWasmPlugin],
};

async function buildDesktop() {
	console.log('[build] Building desktop extension...');
	const ctx = await esbuild.context(desktopBuildOptions);
	if (watch) {
		await ctx.watch();
		console.log('[watch] Watching desktop extension...');
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

async function buildWeb() {
	console.log('[build] Building web extension...');
	const ctx = await esbuild.context(webBuildOptions);
	if (watch) {
		await ctx.watch();
		console.log('[watch] Watching web extension...');
	} else {
		await ctx.rebuild();
		await ctx.dispose();
	}
}

async function main() {
	if (webOnly) {
		await buildWeb();
	} else {
		// Build both desktop and web
		await buildDesktop();
		await buildWeb();
	}
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
