import { builtinModules } from "module";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

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
      output: {
        banner: ({ name }) => {
          if (name === "bin/main") {
            return "#!/usr/bin/env node";
          }
          return "";
        },
      },
    },
  },
  resolve: {
    alias: {
      "./stubs/bun.js": "./stubs/node.js",
      ws: "./node_modules/ws/wrapper.mjs",
    },
  },
  define: {
    "process.env.WS_NO_BUFFER_UTIL": true,
    "process.env.WS_NO_UTF_8_VALIDATE": true,
  },
  plugins: [
    dts({
      tsconfigPath: "./tsconfig.node.build.json",
    }),
  ],
});
