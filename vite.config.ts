import { builtinModules } from "module";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: ["node18"],
    outDir: "./dist/node",
    lib: {
      entry: {
        "lib/index": "./src/lib/index.ts",
        "bin/main": "./src/bin/main.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: [...builtinModules, ...builtinModules.map((m) => `node:${m}`)],
    },
  },
  resolve: {
    alias: {
      bun: "./src/stubs/bun.ts",
      "./stubs/ws-bun.js": "./node_modules/ws/wrapper.mjs",
    },
  },
  define: {
    "process.env.WS_NO_BUFFER_UTIL": true,
    "process.env.WS_NO_UTF_8_VALIDATE": true,
  },
});
