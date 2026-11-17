import { bindings, defineConfig, defineWorker } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "spore-cybernetics-platform",
    entrypoint: "vinext/server/fetch-handler",
    compatibilityDate: "2026-11-12",
    observability: {
      enabled: true,
      headSamplingRate: 1,
      redactQueryString: true,
      logs: {
        enabled: true,
        headSamplingRate: 1,
        invocationLogs: true,
        persist: true,
      },
      issues: {
        enabled: true,
      },
    },
    assets: {
      htmlHandling: "none",
      notFoundHandling: "none",
      runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
    },
    env: {
      ASSETS: bindings.assets(),
    },
  }),
});
