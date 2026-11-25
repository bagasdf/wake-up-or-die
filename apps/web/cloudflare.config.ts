import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "wuod-web",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-09-15",
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    vars: {
      API_BASE_URL: "https://wuod-api.hexagonn.my.id",
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
