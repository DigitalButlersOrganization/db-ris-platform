import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import boundaries from "eslint-plugin-boundaries";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootPath = resolve(__dirname);

const FSD_ELEMENTS = [
	{
		type: "app",
		pattern: "src/app",
		mode: "folder",
	},
	{
		type: "pages",
		pattern: "src/2_pages/*",
		mode: "folder",
		capture: ["slice"],
	},
	{
		type: "widgets",
		pattern: "src/3_widgets/*",
		mode: "folder",
		capture: ["slice"],
	},
	{
		type: "features",
		pattern: "src/4_features/*",
		mode: "folder",
		capture: ["slice"],
	},
	{
		type: "entities",
		pattern: "src/5_entities/*",
		mode: "folder",
		capture: ["slice"],
	},
	{
		type: "shared",
		pattern: "src/6_shared/*",
		mode: "folder",
		capture: ["segment"],
	},
];

const FSD_DEPENDENCY_RULES = {
	default: "disallow",
	message:
		"FSD violation: {{from.type}} cannot import {{to.type}} ({{dependency.source}}).",
	rules: [
		// Relative imports inside the same slice/segment
		{
			allow: {
				dependency: {
					relationship: { to: ["internal", "child", "descendant", "parent"] },
				},
			},
		},
		// No cross-slice imports inside the same layer
		{
			disallow: {
				dependency: { relationship: { to: "sibling" } },
			},
			message:
				"FSD: cross-slice import within the same layer is forbidden ({{dependency.source}}).",
		},
		// Layer can import only lower layers
		{
			from: { type: "app" },
			allow: {
				to: { type: ["pages", "widgets", "features", "entities", "shared"] },
			},
		},
		{
			from: { type: "pages" },
			allow: {
				to: { type: ["widgets", "features", "entities", "shared"] },
			},
		},
		{
			from: { type: "widgets" },
			allow: {
				to: { type: ["features", "entities", "shared"] },
			},
		},
		{
			from: { type: "features" },
			allow: { to: { type: ["entities", "shared"] } },
		},
		{
			from: { type: "entities" },
			allow: { to: { type: ["shared"] } },
		},
		{
			from: { type: "shared" },
			allow: { to: { type: ["shared"] } },
		},
	],
};

const publicApiImportPattern = {
	regex: "^@(pages|widgets|features|entities|shared)/[^/]+/.+$",
	message: "Import via public API (@layer/<slice>), not internal files.",
};

const axiosPath = {
	name: "axios",
	message:
		"Import axios only in src/6_shared/api/. Use api or apiPrivate from @shared/api.",
};

const mantinePaths = [
	{
		name: "@mantine/core",
		message:
			"Import UI components from @shared/ui, not @mantine/core directly.",
	},
	{
		name: "@mantine/dates",
		message:
			"Import date components from @shared/ui, not @mantine/dates directly.",
	},
	{
		name: "@mantine/notifications",
		message:
			"Use notify from @shared/lib and AppNotifications from @shared/ui, not @mantine/notifications directly.",
	},
];

const apiSyntaxRules = {
	"no-restricted-syntax": [
		"error",
		{
			selector:
				"CallExpression[callee.object.name=/^(api|apiPrivate)$/][callee.property.name=/^(get|post|put|patch|delete)$/] > Literal:first-child",
			message: "Use apiRoute() instead of a hardcoded URL string.",
		},
		{
			selector: "Property[key.name='queryKey'] > ArrayExpression",
			message:
				"Import a query key factory from @shared/api instead of inline arrays.",
		},
		{
			selector: "Identifier[name='QUERY_KEY']",
			message: "QUERY_KEY is only used in src/6_shared/api/query-key.ts.",
		},
	],
};

const fsdImportRules = {
	"no-restricted-imports": [
		"error",
		{
			paths: [axiosPath, ...mantinePaths],
			patterns: [publicApiImportPattern],
		},
	],
};

const apiConsumingLayers = [
	"src/app/**/*.{ts,tsx}",
	"src/2_pages/**/*.{ts,tsx}",
	"src/3_widgets/**/*.{ts,tsx}",
	"src/4_features/**/*.{ts,tsx}",
	"src/5_entities/**/*.{ts,tsx}",
];

const fsdLayers = [...apiConsumingLayers, "src/6_shared/**/*.{ts,tsx}"];

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,

	// FSD boundaries
	{
		files: ["src/**/*.{ts,tsx}"],
		plugins: { boundaries },
		settings: {
			"boundaries/root-path": rootPath,
			"boundaries/elements": FSD_ELEMENTS,
			"boundaries/include": ["src/**/*.{ts,tsx}"],
			"import/resolver": {
				typescript: {
					alwaysTryTypes: true,
					project: "./tsconfig.json",
				},
			},
		},
		rules: {
			"boundaries/dependencies": ["error", FSD_DEPENDENCY_RULES],
		},
	},

	// API usage rules for consuming layers
	{
		files: apiConsumingLayers,
		rules: apiSyntaxRules,
	},

	// axios + Mantine + deep FSD alias imports
	{
		files: fsdLayers,
		ignores: [
			"src/6_shared/ui/**",
			"src/6_shared/lib/notify.ts",
			"src/6_shared/theme/**",
			"src/app/providers.tsx",
		],
		rules: fsdImportRules,
	},
	{
		files: ["src/6_shared/api/**/*.{ts,tsx}"],
		rules: {
			"no-restricted-imports": [
				"error",
				{ paths: mantinePaths, patterns: [publicApiImportPattern] },
			],
		},
	},
	{
		files: [
			"src/6_shared/ui/**/*.{ts,tsx}",
			"src/6_shared/theme/**/*.{ts,tsx}",
			"src/6_shared/lib/notify.ts",
		],
		rules: {
			"no-restricted-imports": [
				"error",
				{ patterns: [publicApiImportPattern] },
			],
		},
	},
	{
		files: ["src/app/providers.tsx"],
		rules: {
			"no-restricted-imports": [
				"error",
				{ paths: [axiosPath], patterns: [publicApiImportPattern] },
			],
		},
	},
];

export default eslintConfig;
