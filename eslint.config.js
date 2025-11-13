import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import prettierConfig from "eslint-config-prettier";
import pluginImport from "eslint-plugin-import";
import pluginPrettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";

export default defineConfig([
	{
		files: ["**/*.{js,mjs,cjs}"],
		extends: ["js/recommended"],
		languageOptions: { globals: globals.node },
		plugins: {
			js,
			import: pluginImport,
			prettier: pluginPrettier,
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"prettier/prettier": "error",
			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
			"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		},
	},
	{
		settings: {},
		rules: prettierConfig.rules,
	},
]);
