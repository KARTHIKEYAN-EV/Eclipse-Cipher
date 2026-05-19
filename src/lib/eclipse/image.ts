import { rngFromPassword, JavaRandom } from "./javaRandom";

function buildMaps(width: number, height: number, rng: JavaRandom) {
  const xMap = Array.from({ length: width }, (_, i) => i);
  const yMap = Array.from({ length: height }, (_, i) => i);
  // Fisher-Yates with deterministic RNG
  for (let i = width - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [xMap[i], xMap[j]] = [xMap[j], xMap[i]];
  }
  for (let i = height - 1; i > 0; i--) {
    const j = rng.nextInt(i + 1);
    [yMap[i], yMap[j]] = [yMap[j], yMap[i]];
  }
  const xInv = new Array(width);
  const yInv = new Array(height);
  for (let i = 0; i < width; i++) xInv[xMap[i]] = i;
  for (let i = 0; i < height; i++) yInv[yMap[i]] = i;
  return { xMap, yMap, xInv, yInv };
}

async function fileToImageData(file: File): Promise<{ data: ImageData; canvas: HTMLCanvasElement }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return { data: ctx.getImageData(0, 0, canvas.width, canvas.height), canvas };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function imageDataToBlob(data: ImageData, type: "image/png" | "image/bmp" = "image/png"): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = data.width;
  canvas.height = data.height;
  canvas.getContext("2d")!.putImageData(data, 0, 0);
  if (type === "image/bmp") {
    return Promise.resolve(new Blob([imageDataToBmp(data)], { type: "image/bmp" }));
  }
  return new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
}

function imageDataToBmp(data: ImageData): ArrayBuffer {
  const { width, height } = data;
  const rowSize = ((24 * width + 31) >> 5) * 4;
  const pixelSize = rowSize * height;
  const fileSize = 54 + pixelSize;
  const buf = new ArrayBuffer(fileSize);
  const v = new DataView(buf);
  v.setUint8(0, 0x42); v.setUint8(1, 0x4d);
  v.setUint32(2, fileSize, true);
  v.setUint32(10, 54, true);
  v.setUint32(14, 40, true);
  v.setInt32(18, width, true);
  v.setInt32(22, -height, true); // top-down
  v.setUint16(26, 1, true);
  v.setUint16(28, 24, true);
  v.setUint32(34, pixelSize, true);
  const bytes = new Uint8Array(buf, 54);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (y * width + x) * 4;
      const di = y * rowSize + x * 3;
      bytes[di] = data.data[si + 2];
      bytes[di + 1] = data.data[si + 1];
      bytes[di + 2] = data.data[si];
    }
  }
  return buf;
}

function transformPixels(data: ImageData, password: string, encrypt: boolean): ImageData {
  const rng = rngFromPassword(password);
  const { width, height } = data;
  const out = new Uint8ClampedArray(data.data.length);
  const pLen = password.length;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const k1 = rng.nextByte();
      const k2 = password.charCodeAt((x + y) % pLen) & 0xff;
      const k3 = (x * y + pLen) & 0xff;
      const r = data.data[i], g = data.data[i + 1], b = data.data[i + 2];
      let R: number, G: number, B: number;
      if (encrypt) {
        R = ((r ^ k1 ^ k2 ^ k3) + k1) & 0xff;
        G = ((g ^ k2 ^ k3 ^ k1) + k2) & 0xff;
        B = ((b ^ k3 ^ k1 ^ k2) + k3) & 0xff;
      } else {
        R = (((r - k1) & 0xff) ^ k1 ^ k2 ^ k3) & 0xff;
        G = (((g - k2) & 0xff) ^ k2 ^ k3 ^ k1) & 0xff;
        B = (((b - k3) & 0xff) ^ k3 ^ k1 ^ k2) & 0xff;
      }
      out[i] = R; out[i + 1] = G; out[i + 2] = B; out[i + 3] = data.data[i + 3];
    }
  }
  return new ImageData(out, width, height);
}

function scramble(data: ImageData, password: string, encrypt: boolean): ImageData {
  const rng = rngFromPassword(password + "::scramble");
  const { width, height } = data;
  const { xMap, yMap, xInv, yInv } = buildMaps(width, height, rng);
  const out = new Uint8ClampedArray(data.data.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const srcX = encrypt ? x : xInv[x];
      const srcY = encrypt ? y : yInv[y];
      const dstX = encrypt ? xMap[x] : x;
      const dstY = encrypt ? yMap[y] : y;
      const si = (srcY * width + srcX) * 4;
      const di = (dstY * width + dstX) * 4;
      // For encrypt: write from (x,y) -> (xMap[x], yMap[y])
      // Simpler: read src, write to dst
      if (encrypt) {
        const sI = (y * width + x) * 4;
        const dI = (yMap[y] * width + xMap[x]) * 4;
        out[dI] = data.data[sI];
        out[dI + 1] = data.data[sI + 1];
        out[dI + 2] = data.data[sI + 2];
        out[dI + 3] = data.data[sI + 3];
      } else {
        const sI = (y * width + x) * 4;
        const dI = (yInv[y] * width + xInv[x]) * 4;
        out[dI] = data.data[sI];
        out[dI + 1] = data.data[sI + 1];
        out[dI + 2] = data.data[sI + 2];
        out[dI + 3] = data.data[sI + 3];
      }
      // suppress unused warnings
      void si; void di; void dstX; void dstY; void srcX; void srcY;
    }
  }
  return new ImageData(out, width, height);
}

export async function encryptImage(file: File, password: string, format: "png" | "bmp" = "png"): Promise<Blob> {
  const { data } = await fileToImageData(file);
  const transformed = transformPixels(data, password, true);
  const scrambled = scramble(transformed, password, true);
  return imageDataToBlob(scrambled, format === "bmp" ? "image/bmp" : "image/png");
}

export async function decryptImage(file: File, password: string, format: "png" | "bmp" = "png"): Promise<Blob> {
  const { data } = await fileToImageData(file);
  const unscrambled = scramble(data, password, false);
  const restored = transformPixels(unscrambled, password, false);
  return imageDataToBlob(restored, format === "bmp" ? "image/bmp" : "image/png");
}
