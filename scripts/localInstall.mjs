import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const relaunchSchemaPath = resolve(rootDir, "supabase/schema/current.sql");
const cloneDumpPath = resolve(rootDir, "supabase/local/prod_clone.sql");
const generatedDumpPath = resolve(rootDir, "supabase/local/generated_test_data.sql");

function run(command, args) {
  execFileSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
  });
}

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

function getStatus() {
  const output = execFileSync("npx", ["supabase", "status", "-o", "env"], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return parseKeyValueLines(output);
}

run("npx", ["supabase", "start"]);
run("node", ["scripts/writeLocalDevVars.mjs"]);
run("npx", ["supabase", "db", "reset", "--no-seed"]);

const status = getStatus();

console.log(`Applying schema ${relative(rootDir, relaunchSchemaPath)}.`);
run("psql", [status.DB_URL, "-v", "ON_ERROR_STOP=1", "-f", relaunchSchemaPath]);

if (existsSync(cloneDumpPath)) {
  console.log(`Importing clone dump ${relative(rootDir, cloneDumpPath)}.`);
  run("psql", [status.DB_URL, "-v", "ON_ERROR_STOP=1", "-f", cloneDumpPath]);
} else {
  console.log("No production clone found. Generating synthetic local test data.");
  run("node", ["scripts/generateLocalTestData.mjs"]);

  if (!existsSync(generatedDumpPath)) {
    console.error("Synthetic test data could not be generated.");
    process.exit(1);
  }

  console.log(`Importing generated test data ${relative(rootDir, generatedDumpPath)}.`);
  run("psql", [status.DB_URL, "-v", "ON_ERROR_STOP=1", "-f", generatedDumpPath]);
}

run("node", ["scripts/writeLocalDevVars.mjs"]);

console.log("Local database is ready.");
