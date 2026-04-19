import { spawn } from "node:child_process";
import process from "node:process";

function main() {
  const [target, ...rest] = process.argv.slice(2);

  if (target !== "db") {
    throw new Error("Unsupported stop target. Use `bun stop db`.");
  }

  const child = spawn(process.execPath, ["./node_modules/tsx/dist/cli.mjs", "scripts/db.ts", "--stop", ...rest], {
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

  child.on("error", (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}

main();
