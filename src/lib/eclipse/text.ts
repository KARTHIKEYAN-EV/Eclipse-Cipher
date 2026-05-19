import { rngFromPassword } from "./javaRandom";

// Encrypts a UTF-8 string to a Base64 payload of bytes.
export function encryptText(plain: string, password: string): string {
  if (!password) throw new Error("Password required");
  const rng = rngFromPassword(password);
  const bytes = new TextEncoder().encode(plain);
  const out = new Uint8Array(bytes.length);
  const pLen = password.length;
  for (let i = 0; i < bytes.length; i++) {
    const k1 = rng.nextByte();
    const k2 = password.charCodeAt(i % pLen) & 0xff;
    const k3 = (i * i + pLen) & 0xff;
    out[i] = ((bytes[i] ^ k1 ^ k2 ^ k3) + k1) & 0xff;
  }
  return btoa(String.fromCharCode(...out));
}

export function decryptText(cipherB64: string, password: string): string {
  if (!password) throw new Error("Password required");
  const rng = rngFromPassword(password);
  const bin = atob(cipherB64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const out = new Uint8Array(bytes.length);
  const pLen = password.length;
  for (let i = 0; i < bytes.length; i++) {
    const k1 = rng.nextByte();
    const k2 = password.charCodeAt(i % pLen) & 0xff;
    const k3 = (i * i + pLen) & 0xff;
    // reverse: ((c - k1) & 0xff) ^ k1 ^ k2 ^ k3
    out[i] = (((bytes[i] - k1) & 0xff) ^ k1 ^ k2 ^ k3) & 0xff;
  }
  return new TextDecoder().decode(out);
}
