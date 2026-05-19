import { useState } from "react";
import { Download, FileLock2, Lock, Unlock } from "lucide-react";
import { DropZone } from "./DropZone";
import { PasswordInput } from "./PasswordInput";
import { encryptBinary, decryptBinary } from "@/lib/eclipse/binary";

export function BinaryPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [out, setOut] = useState<{ url: string; blob: Blob; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "enc" | "dec">(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(mode: "enc" | "dec") {
    if (!file || !password) return;
    setBusy(mode); setErr(null);
    try {
      if (mode === "enc") {
        const blob = await encryptBinary(file, password);
        setOut({ url: URL.createObjectURL(blob), blob, name: file.name + ".enc" });
      } else {
        const { blob, name } = await decryptBinary(file, password);
        setOut({ url: URL.createObjectURL(blob), blob, name });
      }
    } catch (e: any) {
      setErr(e?.message ?? "Failed (wrong password?)");
    } finally { setBusy(null); }
  }
  function download() { if (out) { const a = document.createElement("a"); a.href = out.url; a.download = out.name; a.click(); } }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-5 space-y-4">
        <DropZone onFile={(f) => { setFile(f); setOut(null); setErr(null); }} label="Any file (PDF, DOCX, MP4, ZIP…)" />
        {file && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
            <div className="flex items-center gap-2"><FileLock2 size={16}/> <span className="font-medium truncate">{file.name}</span></div>
            <div className="mt-1 text-xs opacity-60">{(file.size / 1024).toFixed(1)} KB · {file.type || "binary"}</div>
          </div>
        )}
        <PasswordInput value={password} onChange={setPassword} />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => run("enc")} disabled={!file || !password || !!busy} className="btn-neon inline-flex items-center gap-2">
            <Lock size={16}/> {busy === "enc" ? "Encrypting…" : "Encrypt → .enc"}
          </button>
          <button onClick={() => run("dec")} disabled={!file || !password || !!busy} className="btn-ghost inline-flex items-center gap-2">
            <Unlock size={16}/> {busy === "dec" ? "Decrypting…" : "Decrypt .enc"}
          </button>
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
      </div>

      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="text-sm opacity-80">AES-256-GCM · PBKDF2 (120k iter, SHA-256)</div>
        <div className="flex min-h-44 items-center justify-center rounded-xl border border-white/10 bg-black/30 p-4 text-center">
          {out ? (
            <div className="space-y-1">
              <p className="font-medium truncate">{out.name}</p>
              <p className="text-xs opacity-60">{(out.blob.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : <span className="text-sm opacity-50">Encrypted/decrypted file appears here</span>}
        </div>
        <button onClick={download} disabled={!out} className="btn-neon inline-flex items-center gap-2">
          <Download size={16}/> Download
        </button>
      </div>
    </div>
  );
}
