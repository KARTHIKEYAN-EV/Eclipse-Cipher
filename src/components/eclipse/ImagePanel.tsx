import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ImageIcon, Lock, Unlock } from "lucide-react";
import { DropZone } from "./DropZone";
import { PasswordInput } from "./PasswordInput";
import { encryptImage, decryptImage } from "@/lib/eclipse/image";

async function jpgToPngFile(file: File): Promise<File> {
  if (!/jpe?g/i.test(file.type) && !/\.jpe?g$/i.test(file.name)) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url;
    });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d")!.drawImage(img, 0, 0);
    const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"));
    return new File([blob], file.name.replace(/\.jpe?g$/i, ".png"), { type: "image/png" });
  } finally { URL.revokeObjectURL(url); }
}

export function ImagePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "enc" | "dec">(null);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  async function pick(f: File) {
    const converted = await jpgToPngFile(f);
    setFile(converted);
    setPreview(URL.createObjectURL(converted));
    setOut(null); setErr(null);
  }

  async function run(mode: "enc" | "dec") {
    if (!file || !password) return;
    setBusy(mode); setErr(null); setProgress(5);
    const timer = setInterval(() => setProgress((p) => Math.min(90, p + 7)), 120);
    try {
      const blob = mode === "enc"
        ? await encryptImage(file, password, "png")
        : await decryptImage(file, password, "png");
      const name = (mode === "enc" ? "eclipse-" : "decrypted-") + file.name.replace(/\.[^.]+$/, ".png");
      setOut({ url: URL.createObjectURL(blob), blob, name });
      setProgress(100);
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally {
      clearInterval(timer);
      setBusy(null);
      setTimeout(() => setProgress(0), 600);
    }
  }

  function download() {
    if (!out) return;
    const a = document.createElement("a"); a.href = out.url; a.download = out.name; a.click();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-5 space-y-4">
        <DropZone onFile={pick} accept="image/png,image/jpeg,image/bmp" label="Image (PNG, BMP, JPG)" />
        {preview && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-xl border border-white/10">
            <img src={preview} alt="preview" className="max-h-72 w-full object-contain bg-black/30" />
          </motion.div>
        )}
        <PasswordInput value={password} onChange={setPassword} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run("enc")} disabled={!file || !password || !!busy} className="btn-neon inline-flex items-center gap-2">
            <Lock size={16} /> {busy === "enc" ? "Encrypting…" : "Encrypt Image"}
          </button>
          <button onClick={() => run("dec")} disabled={!file || !password || !!busy} className="btn-ghost inline-flex items-center gap-2">
            <Unlock size={16} /> {busy === "dec" ? "Decrypting…" : "Decrypt"}
          </button>
        </div>
        {progress > 0 && (
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div className="h-full" style={{ background: "linear-gradient(90deg,var(--neon-1),var(--neon-2),var(--neon-3))" }}
              animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        )}
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm opacity-80"><ImageIcon size={16}/> Result</div>
        <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
          {out ? (
            <img src={out.url} alt="result" className="max-h-96 w-full object-contain" />
          ) : (
            <span className="text-sm opacity-50">Encrypted/decrypted image preview will appear here</span>
          )}
        </div>
        <button onClick={download} disabled={!out} className="btn-neon inline-flex items-center gap-2">
          <Download size={16} /> Download
        </button>
      </div>
    </div>
  );
}
