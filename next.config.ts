import type { NextConfig } from "next";
import path from "path";

const stylesDir = path.join(process.cwd(), "src/6_shared/styles");
const functionsPath = path.join(stylesDir, "functions.scss");
// Turbopack ждёт путь относительно корня проекта ("./…"); абсолютный путь оно
// префиксит "." и ломает резолв. Webpack — наоборот, нужен абсолютный.
const functionsPathRelative = `./${path
	.relative(process.cwd(), functionsPath)
	.split(path.sep)
	.join("/")}`;

const nextConfig: NextConfig = {
	sassOptions: {
		includePaths: [stylesDir],
	},
	turbopack: {
		resolveAlias: {
			"@functions": functionsPathRelative,
		},
	},
	webpack: (config) => {
		config.resolve ??= {};
		config.resolve.alias = {
			...config.resolve.alias,
			"@functions": functionsPath,
		};

		return config;
	},
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
