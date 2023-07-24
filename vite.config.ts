import { builtinModules } from "module";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { transform } from "esbuild";

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
    minify: false,
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
    {
      name: "minifyEsm",
      renderChunk: {
        order: "post",
        handler: async (code, _, { format }) => {
          if (format === "es") {
            return await transform(code, { minify: true });
          }
          return code;
        },
      },
    },
    dts({
      tsconfigPath: "./tsconfig.node.build.json",
    }),
  ],
});
