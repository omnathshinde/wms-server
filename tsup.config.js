import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/server.js"],
	outDir: "dist",
	format: ["esm"],
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: false,
	target: "node24",
	bundle: true,
	skipNodeModulesBundle: true,
	shims: false,
});
