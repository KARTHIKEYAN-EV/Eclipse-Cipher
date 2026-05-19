// AES-GCM file encryption with PBKDF2 password derivation.
const MAGIC = new TextEncoder().encode("ECLPS1");

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 120000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptBinary(file: File, password: string): Promise<Blob> {
  const data = await file.arrayBuffer();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, data));
  const nameBytes = new TextEncoder().encode(file.name);
  const header = new Uint8Array(MAGIC.length + 2 + nameBytes.length + 16 + 12);
  let o = 0;
  header.set(MAGIC, o); o += MAGIC.length;
  header[o++] = (nameBytes.length >> 8) & 0xff;
  header[o++] = nameBytes.length & 0xff;
  header.set(nameBytes, o); o += nameBytes.length;
  header.set(salt, o); o += 16;
  header.set(iv, o); o += 12;
  return new Blob([header, ct], { type: "application/octet-stream" });
}

export async function decryptBinary(file: File, password: string): Promise<{ blob: Blob; name: string }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  for (let i = 0; i < MAGIC.length; i++) {
    if (buf[i] !== MAGIC[i]) throw new Error("Not an Eclipse-encrypted file");
  }
  let o = MAGIC.length;
  const nameLen = (buf[o] << 8) | buf[o + 1]; o += 2;
  const name = new TextDecoder().decode(buf.slice(o, o + nameLen)); o += nameLen;
  const salt = buf.slice(o, o + 16); o += 16;
  const iv = buf.slice(o, o + 12); o += 12;
  const ct = buf.slice(o);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, ct as BufferSource);
  return { blob: new Blob([pt]), name };
}
