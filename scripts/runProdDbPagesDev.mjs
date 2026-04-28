import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const prodVarsPath = resolve(rootDir, ".dev.vars.production");

if (!existsSync(prodVarsPath)) {
  console.error("Missing .dev.vars.production. See README.md for the prod-db:dev setup.");
  process.exit(1);
}

const tempDir = mkdtempSync(join(tmpdir(), "lowhofer-prod-db-"));
const devVarsContent = ensureLocalTestDataDisabled(readFileSync(prodVarsPath, "utf8"));

writeFileSync(join(tempDir, ".dev.vars"), devVarsContent, "utf8");

for (const entry of ["functions", "public", "src", "wrangler.toml", "package.json", "node_modules"]) {
  symlinkSync(resolve(rootDir, entry), join(tempDir, basename(entry)));
}

const child = spawn(
  "npx",
  ["wrangler", "pages", "dev", "public", "--port", "8789", "--binding", "LOCAL_TEST_DATA=false"],
  {
    cwd: tempDir,
    stdio: "inherit",
  },
);

let didExit = false;

function cleanup() {
  if (didExit) {
    return;
  }

  didExit = true;
  rmSync(tempDir, { force: true, recursive: true });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}

child.on("exit", (code, signal) => {
  cleanup();

  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});

function ensureLocalTestDataDisabled(content) {
  const lines = content
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("LOCAL_TEST_DATA="));

  lines.push("LOCAL_TEST_DATA=false");

  return `${lines.join("\n").trimEnd()}\n`;
}
