import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl =
    mode === "development"
      ? "http://localhost:8787"
      : (env.API_BASE_URL ??
        process.env.API_BASE_URL ??
        "https://wuod-api.hexagonn.my.id");

  return {
    define: {
      __CHAT_WS_BASE__: JSON.stringify(apiBaseUrl.replace(/^http/, "ws")),
    },
    plugins: [
      vinext({ react: { compiler: true } }),
      cloudflare({
        inspectorPort: 9230,
        viteEnvironment: {
          name: "rsc",
          childEnvironments: ["ssr"],
        },
      }),
    ],
  };
});
