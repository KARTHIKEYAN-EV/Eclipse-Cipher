import { useState } from "react";
import { motion } from "framer-motion";
import { AudioLines, Download, Lock, Unlock } from "lucide-react";
import { DropZone } from "./DropZone";
import { PasswordInput } from "./PasswordInput";
import { encryptAudio, decryptAudio } from "@/lib/eclipse/audio";

export function AudioPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [out, setOut] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "enc" | "dec">(null);
  const [err, setErr] = useState<string | null>(null);

  function pick(f: File) {
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); setOut(null); setErr(null);
  }
  async function run(mode: "enc" | "dec") {
    if (!file || !password) return;
    setBusy(mode); setErr(null);
    try {
      const blob = mode === "enc" ? await encryptAudio(file, password) : await decryptAudio(file, password);
      const base = file.name.replace(/\.[^.]+$/, "");
      const name = (mode === "enc" ? "eclipse-" : "decrypted-") + base + ".wav";
      setOut({ url: URL.createObjectURL(blob), blob, name });
    } catch (e: any) {
      setErr(e?.message ?? "Failed");
    } finally { setBusy(null); }
  }
  function download() { if (out) { const a = document.createElement("a"); a.href = out.url; a.download = out.name; a.click(); } }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-5 space-y-4">
        <DropZone onFile={pick} accept="audio/*" label="Audio (WAV, MP3)" />
        {previewUrl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-white/10 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs opacity-70"><AudioLines size={14}/> Source preview</div>
            <audio src={previewUrl} controls className="w-full" />
          </motion.div>
        )}
        <PasswordInput value={password} onChange={setPassword} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run("enc")} disabled={!file || !password || !!busy} className="btn-neon inline-flex items-center gap-2">
            <Lock size={16} /> {busy === "enc" ? "Encrypting…" : "Encrypt Audio"}
          </button>
          <button onClick={() => run("dec")} disabled={!file || !password || !!busy} className="btn-ghost inline-flex items-center gap-2">
            <Unlock size={16} /> {busy === "dec" ? "Decrypting…" : "Decrypt"}
          </button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm opacity-80"><AudioLines size={16}/> Result</div>
        <div className="flex min-h-44 items-center justify-center rounded-xl border border-white/10 bg-black/30 p-4">
          {out ? <audio src={out.url} controls className="w-full" /> : <span className="text-sm opacity-50">Processed WAV will appear here</span>}
        </div>
        <button onClick={download} disabled={!out} className="btn-neon inline-flex items-center gap-2">
          <Download size={16}/> Download WAV
        </button>
      </div>
    </div>
  );
}
