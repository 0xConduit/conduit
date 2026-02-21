/**
 * Wallet Service — generates and encrypts agent wallets
 *
 * Each agent gets its own Ethereum wallet at registration time.
 * Private keys are AES-256-GCM encrypted before storage.
 *
 * Required env var:
 *   WALLET_ENCRYPTION_KEY  — 32-byte hex string (64 chars)
 *   Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { ethers } from "ethers";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY ?? "";
const ALGORITHM = "aes-256-gcm";

function getKeyBuffer(): Buffer {
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error(
      "WALLET_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). " +
      'Generate one: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(ENCRYPTION_KEY, "hex");
}

export function encryptPrivateKey(privateKey: string): string {
  const key = getKeyBuffer();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(privateKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  // Format: iv:authTag:ciphertext
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptPrivateKey(encrypted: string): string {
  const key = getKeyBuffer();
  const [ivHex, authTagHex, ciphertext] = encrypted.split(":");
  if (!ivHex || !authTagHex || !ciphertext) {
    throw new Error("Invalid encrypted key format — expected iv:authTag:ciphertext");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateAgentWallet(): { address: string; encryptedPrivateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
  return { address: wallet.address, encryptedPrivateKey };
}

export function getAgentSigner(encryptedPrivateKey: string, rpcUrl: string): ethers.Wallet {
  const privateKey = decryptPrivateKey(encryptedPrivateKey);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Wallet(privateKey, provider);
}
