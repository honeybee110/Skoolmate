#!/usr/bin/env node
// Build wrapper: retries transient build failures and falls back to a
// more conservative build configuration before giving up.
//
// Usage: node scripts/build-with-retry.mjs [...extra vite build args]

import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXTRA_ARGS = process.argv.slice(2);

// Failures that are worth retrying: network, registry, filesystem and
// resource-exhaustion hiccups. Deterministic code errors are NOT in this list.
const TRANSIENT_PATTERNS = [
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /EAI_AGAIN/i,
  /ENOTFOUND/i,
  /EPIPE/i,
  /EBUSY/i,
  /EAGAIN/i,
  /EMFILE/i,
  /ENFILE/i,
  /socket hang up/i,
  /network (?:error|timeout)/i,
  /fetch failed/i,
  /request to .+ failed/i,
  /(?:429|502|503|504)\s/,
  /rate ?limit/i,
  /connection (?:reset|closed|timed out)/i,
  /temporar(?:y|ily) unavailable/i,
  /Cannot find module '.*\.vite/i,
  /ENOENT.*node_modules\/\.vite/i,
  /The operation was aborted/i,
  /out of memory|heap out of memory|JavaScript heap/i,
];

const ATTEMPTS = [
  { label: "standard build", args: [], clearCache: false },
  { label: "retry after clearing build caches", args: [], clearCache: true },
  {
    label: "fallback: clean cache + single-threaded, larger heap",
    args: [],
    clearCache: true,
    env: { NODE_OPTIONS: "--max-old-space-size=6144", UV_THREADPOOL_SIZE: "1" },
  },
];

const BACKOFF_MS = [0, 5_000, 15_000];

function isTransient(output, code) {
  if (code === null) return true; // killed by a signal (OOM killer, etc.)
  return TRANSIENT_PATTERNS.some((re) => re.test(output));
}

function runBuild(args, env) {
  return new Promise((resolve) => {
    const child = spawn("npx", ["vite", "build", ...EXTRA_ARGS, ...args], {
      cwd: ROOT,
      env: { ...process.env, ...env },
      stdio: ["inherit", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let output = "";
    const tap = (stream, sink) => {
      stream.on("data", (chunk) => {
        const text = chunk.toString();
        output += text;
        if (output.length > 2_000_000) output = output.slice(-1_000_000);
        sink.write(text);
      });
    };
    tap(child.stdout, process.stdout);
    tap(child.stderr, process.stderr);

    child.on("error", (error) => {
      output += `\n${error.stack ?? error.message}`;
      resolve({ code: 1, output });
    });
    child.on("close", (code) => resolve({ code, output }));
  });
}

async function clearCaches() {
  const targets = ["node_modules/.vite", "node_modules/.cache", ".nitro", ".tanstack"];
  await Promise.all(
    targets.map((t) => rm(path.join(ROOT, t), { recursive: true, force: true }).catch(() => {})),
  );
  console.log(`[build-retry] cleared build caches: ${targets.join(", ")}`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (let i = 0; i < ATTEMPTS.length; i++) {
    const attempt = ATTEMPTS[i];
    if (BACKOFF_MS[i]) {
      console.log(`[build-retry] waiting ${BACKOFF_MS[i] / 1000}s before next attempt…`);
      await sleep(BACKOFF_MS[i]);
    }
    if (attempt.clearCache) await clearCaches();

    console.log(`[build-retry] attempt ${i + 1}/${ATTEMPTS.length} — ${attempt.label}`);
    const { code, output } = await runBuild(attempt.args, attempt.env);

    if (code === 0) {
      if (i > 0) console.log(`[build-retry] build succeeded on attempt ${i + 1}.`);
      process.exit(0);
    }

    const transient = isTransient(output, code);
    if (!transient) {
      console.error(
        `[build-retry] build failed with a non-transient error — not retrying (exit ${code}).`,
      );
      process.exit(code ?? 1);
    }
    console.warn(`[build-retry] transient failure detected on attempt ${i + 1} (exit ${code}).`);
  }

  console.error(`[build-retry] build failed after ${ATTEMPTS.length} attempts.`);
  process.exit(1);
}

main();
