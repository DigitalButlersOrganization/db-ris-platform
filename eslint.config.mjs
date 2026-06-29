import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const fsdLayers = [
	"src/app/**/*.{ts,tsx}",
	"src/2_pages/**/*.{ts,tsx}",
	"src/3_widgets/**/*.{ts,tsx}",
	"src/4_features/**/*.{ts,tsx}",
	"src/5_entities/**/*.{ts,tsx}",
];

const apiLayerRules = {
	"no-restricted-imports": [
		"error",
		{
			paths: [
				{
					name: "axios",
					message:
						"Import axios only in src/6_shared/api/. Use api or apiPrivate from @shared/api.",
				},
			],
		},
	],
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

const mantineUiRules = {
	"no-restricted-imports": [
		"error",
		{
			paths: [
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
			],
		},
	],
};

const eslintConfig = [
	...compat.extends("next/core-web-vitals", "next/typescript"),
	{
		files: fsdLayers,
		rules: apiLayerRules,
	},
	{
		files: ["src/**/*.{ts,tsx}"],
		ignores: [
			"src/6_shared/ui/**",
			"src/6_shared/lib/notify.ts",
			"src/6_shared/theme/**",
			"src/app/providers.tsx",
		],
		rules: mantineUiRules,
	},
];

export default eslintConfig;
