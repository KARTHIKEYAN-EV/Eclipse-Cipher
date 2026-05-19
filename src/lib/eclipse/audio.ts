import { rngFromPassword } from "./javaRandom";

// Decode any browser-supported audio (mp3, wav, ogg…) into an AudioBuffer.
async function decodeAudio(file: File): Promise<AudioBuffer> {
  const buf = await file.arrayBuffer();
  const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(buf.slice(0));
  } finally {
    ctx.close();
  }
}

// Convert AudioBuffer -> 16-bit PCM WAV ArrayBuffer.
function audioBufferToWav(ab: AudioBuffer): ArrayBuffer {
  const numCh = ab.numberOfChannels;
  const sampleRate = ab.sampleRate;
  const samples = ab.length;
  const blockAlign = numCh * 2;
  const dataSize = samples * blockAlign;
  const buf = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buf);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  v.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numCh, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * blockAlign, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, 16, true);
  writeStr(36, "data");
  v.setUint32(40, dataSize, true);
  const channels: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) channels.push(ab.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return buf;
}

// Parse a 16-bit PCM WAV into header + samples (byte view of data chunk).
function parseWav(buf: ArrayBuffer): { headerEnd: number; dataOffset: number; dataLength: number } {
  const v = new DataView(buf);
  if (v.getUint32(0, false) !== 0x52494646) throw new Error("Not a WAV file");
  let offset = 12;
  let dataOffset = 0, dataLength = 0;
  while (offset < buf.byteLength) {
    const id = v.getUint32(offset, false);
    const size = v.getUint32(offset + 4, true);
    if (id === 0x64617461) { // 'data'
      dataOffset = offset + 8;
      dataLength = size;
      break;
    }
    offset += 8 + size;
  }
  if (!dataOffset) throw new Error("No data chunk");
  return { headerEnd: dataOffset, dataOffset, dataLength };
}

function transformBytes(bytes: Uint8Array, password: string, encrypt: boolean): Uint8Array {
  const rng = rngFromPassword(password);
  const out = new Uint8Array(bytes.length);
  const pLen = password.length;
  for (let i = 0; i < bytes.length; i++) {
    const k1 = rng.nextByte();
    const k2 = password.charCodeAt(i % pLen) & 0xff;
    const k3 = (i * i + pLen) & 0xff;
    if (encrypt) {
      out[i] = ((bytes[i] ^ k1 ^ k2 ^ k3) + k1) & 0xff;
    } else {
      out[i] = (((bytes[i] - k1) & 0xff) ^ k1 ^ k2 ^ k3) & 0xff;
    }
  }
  return out;
}

function scrambleBytes(bytes: Uint8Array, password: string, encrypt: boolean): Uint8Array {
  const rng = rngFromPassword(password + "::scramble");
  const n = bytes.length;
  const map = new Uint32Array(n);
  for (let i = 0; i < n; i++) map[i] = i;
  for (let i = n - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    const t = map[i]; map[i] = map[j]; map[j] = t;
  }
  const out = new Uint8Array(n);
  if (encrypt) {
    for (let i = 0; i < n; i++) out[map[i]] = bytes[i];
  } else {
    for (let i = 0; i < n; i++) out[i] = bytes[map[i]];
  }
  return out;
}

export async function encryptAudio(file: File, password: string): Promise<Blob> {
  // Decode (handles mp3/wav/etc.) -> re-encode as WAV
  const ab = await decodeAudio(file);
  const wav = audioBufferToWav(ab);
  const { dataOffset, dataLength } = parseWav(wav);
  const samples = new Uint8Array(wav, dataOffset, dataLength);
  const transformed = transformBytes(samples, password, true);
  const scrambled = scrambleBytes(transformed, password, true);
  samples.set(scrambled);
  return new Blob([wav], { type: "audio/wav" });
}

export async function decryptAudio(file: File, password: string): Promise<Blob> {
  const buf = await file.arrayBuffer();
  const { dataOffset, dataLength } = parseWav(buf);
  const samples = new Uint8Array(buf, dataOffset, dataLength);
  const unscrambled = scrambleBytes(samples, password, false);
  const restored = transformBytes(unscrambled, password, false);
  samples.set(restored);
  return new Blob([buf], { type: "audio/wav" });
}
