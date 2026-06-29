import type { NextConfig } from "next";
import path from "path";

const stylesDir = path.join(process.cwd(), "src/6_shared/styles");
const functionsPath = path.join(stylesDir, "functions.scss");

const nextConfig: NextConfig = {
	sassOptions: {
		includePaths: [stylesDir],
	},
	turbopack: {
		resolveAlias: {
			"@functions": functionsPath,
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
