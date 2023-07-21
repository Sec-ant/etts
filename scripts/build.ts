import { build } from "bun";

await build({
  entrypoints: ["./src/lib/index.ts", "./src/bin/main.ts"],
  outdir: "./dist",
  target: "bun",
  format: "esm",
  minify: true,
  splitting: true,
});
