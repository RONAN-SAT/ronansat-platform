import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

import { loadAppEnv } from "@/lib/env/loadAppEnv";

const require = createRequire(import.meta.url);
const nextCommand = process.argv[2];
const nextArgs = process.argv.slice(3);

if (nextCommand !== "build" && nextCommand !== "start") {
  throw new Error("Usage: tsx scripts/next.ts <build|start> [...next-args]");
}

loadAppEnv("production");

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, nextCommand, ...nextArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
