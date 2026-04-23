import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const devVarsPath = resolve(rootDir, ".dev.vars");

function parseKeyValueLines(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

function getLocalSupabaseStatus() {
  const output = execFileSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return parseKeyValueLines(output);
}

const existingVars = existsSync(devVarsPath) ? parseKeyValueLines(readFileSync(devVarsPath, "utf8")) : {};
const localStatus = getLocalSupabaseStatus();

const sessionSecret = existingVars.SESSION_SECRET || randomBytes(32).toString("hex");
const calendarFeedToken = existingVars.CALENDAR_FEED_TOKEN || randomBytes(16).toString("hex");

const devVarsContent = [
  "# Generated from `npx supabase status -o env`.",
  `SUPABASE_URL=${localStatus.API_URL}`,
  `SUPABASE_SERVICE_ROLE_KEY=${localStatus.SERVICE_ROLE_KEY}`,
  `SESSION_SECRET=${sessionSecret}`,
  `CALENDAR_FEED_TOKEN=${calendarFeedToken}`,
  "LOCAL_TEST_DATA=true",
  "",
].join("\n");

writeFileSync(devVarsPath, devVarsContent, "utf8");

console.log(`Wrote ${devVarsPath}`);
