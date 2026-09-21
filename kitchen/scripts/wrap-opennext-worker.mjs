/**
 * Wrap the OpenNext worker fetch handler so uncaught throws emit structured logs
 * before Cloudflare's generic Script Error line.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(fileURLToPath(import.meta.url), "..", "..");
const shimPath = path.join(root, ".open-next", "worker-shim.js");

const shim = `//@ts-nocheck
import worker from "./worker.js";

export { DOQueueHandler } from "./.build/durable-objects/queue.js";
export { DOShardedTagCache } from "./.build/durable-objects/sharded-tag-cache.js";
export { BucketCachePurge } from "./.build/durable-objects/bucket-cache-purge.js";

function logWorkerEvent(event, request, extra = {}) {
  const url = new URL(request.url);
  console.error(
    JSON.stringify({
      level: "error",
      event,
      path: url.pathname,
      method: request.method,
      cfRay: request.headers.get("cf-ray") ?? undefined,
      requestId: request.headers.get("x-request-id") ?? undefined,
      ...extra,
    }),
  );
}

export default {
  async fetch(request, env, ctx) {
    try {
      const response = await worker.fetch(request, env, ctx);
      if (response.status >= 500) {
        logWorkerEvent("worker.upstream_5xx", request, { status: response.status });
      }
      return response;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      logWorkerEvent("worker.uncaught", request, { detail });
      throw error;
    }
  },
};
`;

writeFileSync(shimPath, shim);
console.log("wrap-opennext-worker: wrote .open-next/worker-shim.js");
