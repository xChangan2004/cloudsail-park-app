import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { resolve } from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [uni()],
	resolve: {
		alias: {
			// 只精确匹配裸包名 '@vue/devtools-api'
			"@vue/devtools-api": resolve(__dirname, "src/shims/vue-devtools-api.ts"),
		},
	},
});