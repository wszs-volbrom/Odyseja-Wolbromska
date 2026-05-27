import { SaveSystem } from "./save.js";

const PART_2_UNLOCK_KEY = "odysejaWolbromska.unlock.part2";
const TOKEN_VERSION = 1;
const TOKEN_PURPOSE = "part2-unlock";
const TOKEN_SALT = "odyseja-wolbromska-progress-gate-v1";

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeProgressData(progressData = {}) {
  const completedLevels = Array.isArray(progressData.completedLevels)
    ? [...new Set(progressData.completedLevels.map(String))].sort()
    : [];

  return {
    completedLevels,
    campaignProgress: Number(progressData.campaignProgress || progressData.levelIndex || 0),
    consumedKcal: Number(progressData.consumedKcal || progressData.score || 0),
    score: Number(progressData.score || progressData.consumedKcal || 0)
  };
}

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64UrlEncode(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(text) {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sha256Hex(text) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) return null;
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return bytesToHex(new Uint8Array(digest));
}

async function signPayload(payload) {
  return sha256Hex(`${stableStringify(payload)}:${TOKEN_SALT}`);
}

export async function createUnlockToken(progressData = {}) {
  const payload = {
    v: TOKEN_VERSION,
    purpose: TOKEN_PURPOSE,
    progress: normalizeProgressData(progressData),
    timestamp: Number(progressData.timestamp || Date.now())
  };
  const signature = await signPayload(payload);
  if (!signature) return null;
  return `${base64UrlEncode(stableStringify(payload))}.${signature}`;
}

export async function verifyUnlockToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return false;
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.v !== TOKEN_VERSION || payload.purpose !== TOKEN_PURPOSE) return false;
    const expectedSignature = await signPayload(payload);
    return Boolean(expectedSignature && expectedSignature === signature);
  } catch {
    return false;
  }
}

export async function savePart2Unlock(progressData = {}) {
  const token = await createUnlockToken(progressData);
  if (!token) return false;
  return SaveSystem.storageSet(PART_2_UNLOCK_KEY, token);
}

export async function hasPart2Unlock() {
  const token = SaveSystem.storageGet(PART_2_UNLOCK_KEY, null);
  return verifyUnlockToken(token);
}
