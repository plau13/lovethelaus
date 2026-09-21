/**
 * OpenNext only aliases @opentelemetry/api to Next's compiled copy when the package
 * is absent. Sentry installs it transitively, but file tracing copies an incomplete
 * tree (build/src without build/esm), breaking proxy.ts middleware bundling.
 * Always use Next's compiled copy for the middleware bundle.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(import.meta.url), "..", "..");
const target = path.join(
  root,
  "node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/bundle-node-middleware.js",
);

let source = readFileSync(target, "utf8");
const needle = `        alias: {
            // See \`hasOpentelemetry\` above.
            ...(hasOpentelemetry ? {} : { "@opentelemetry/api": "next/dist/compiled/@opentelemetry/api" }),
        },`;
const replacement = `        alias: {
            // Patched: Sentry installs @opentelemetry/api but tracing copies an incomplete tree.
            "@opentelemetry/api": "next/dist/compiled/@opentelemetry/api",
        },`;

if (!source.includes(needle)) {
  if (source.includes('"@opentelemetry/api": "next/dist/compiled/@opentelemetry/api"')) {
    process.exit(0);
  }
  console.warn("patch-opennext-otel: bundle-node-middleware.js changed; update the patch script");
  process.exit(0);
}

writeFileSync(target, source.replace(needle, replacement));
console.log("patch-opennext-otel: applied OpenNext @opentelemetry/api alias fix");
