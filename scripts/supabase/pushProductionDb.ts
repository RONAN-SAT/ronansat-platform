import { spawnSync } from "node:child_process";

const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error("Missing SUPABASE_DB_PASSWORD for production db push.");
  process.exit(1);
}

const result = spawnSync(
  "supabase",
  ["db", "push", "-p", password, "--linked", "--include-all"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(result.status ?? 1);
}

process.exit(result.status ?? 0);
