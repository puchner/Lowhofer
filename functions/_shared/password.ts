const HASH_PREFIX = "pbkdf2-sha256";
const HASH_PARTS = 4;

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.trim().split("$").map((part) => part.trim());

  if (parts.length !== HASH_PARTS || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = base64ToBytes(parts[2]);
  const expectedHash = base64ToBytes(parts[3]);

  if (!Number.isInteger(iterations) || iterations < 100_000 || expectedHash.byteLength === 0) {
    return false;
  }

  const actualHash = await derivePasswordHash(password, salt, iterations, expectedHash.byteLength * 8);

  return timingSafeEqual(actualHash, expectedHash);
}

export async function createPasswordHash(password: string, salt: Uint8Array, iterations = 210_000): Promise<string> {
  const hash = await derivePasswordHash(password, salt, iterations, 256);

  return `${HASH_PREFIX}$${iterations}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

async function derivePasswordHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
  lengthBits: number,
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations,
    },
    keyMaterial,
    lengthBits,
  );

  return new Uint8Array(bits);
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.byteLength !== right.byteLength) {
    return false;
  }

  let difference = 0;

  for (let index = 0; index < left.byteLength; index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value.replaceAll(/\s/g, "")), (char) => char.charCodeAt(0));
}

function bytesToBase64(value: Uint8Array): string {
  let binary = "";

  value.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}
