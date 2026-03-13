import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits

function getKey(): Buffer {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
    );
  }
  return Buffer.from(keyHex, "hex");
}

export interface EncryptedData {
  encryptedPayload: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return {
    encryptedPayload: encrypted,
    iv: iv.toString("base64"),
    authTag,
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getKey();
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encryptedPayload, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptCredential(data: Record<string, string>): {
  encryptedPayload: string;
  iv: string;
} {
  const json = JSON.stringify(data);
  const result = encrypt(json);
  // Store authTag in encryptedPayload as JSON
  const combined = JSON.stringify({ payload: result.encryptedPayload, tag: result.authTag });
  return {
    encryptedPayload: Buffer.from(combined).toString("base64"),
    iv: result.iv,
  };
}

export function decryptCredential(
  encryptedPayload: string,
  iv: string
): Record<string, string> {
  try {
    const combined = JSON.parse(
      Buffer.from(encryptedPayload, "base64").toString("utf8")
    );
    const decrypted = decrypt({
      encryptedPayload: combined.payload,
      iv,
      authTag: combined.tag,
    });
    return JSON.parse(decrypted);
  } catch {
    throw new Error("Failed to decrypt credential");
  }
}
