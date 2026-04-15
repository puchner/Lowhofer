import { pbkdf2Sync, randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const HASH_PREFIX = "pbkdf2-sha256";
const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

const password = process.argv[2] ?? (await readPassword());

if (!password) {
  throw new Error("Password must not be empty.");
}

const salt = randomBytes(SALT_BYTES);
const hash = pbkdf2Sync(password, salt, ITERATIONS, HASH_BYTES, "sha256");

stdout.write(`${HASH_PREFIX}$${ITERATIONS}$${salt.toString("base64")}$${hash.toString("base64")}\n`);

async function readPassword() {
  const readline = createInterface({ input: stdin, output: stdout });

  try {
    return await readline.question("Team-Passwort: ");
  } finally {
    readline.close();
  }
}
