import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCopy, ClipboardPaste, Download, Lock, Unlock } from "lucide-react";
import { PasswordInput } from "./PasswordInput";
import { encryptText, decryptText } from "@/lib/eclipse/text";

export function TextPanel() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<null | "enc" | "dec">(null);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function run(mode: "enc" | "dec") {
    setErr(null); setBusy(mode);
    try {
      await new Promise((r) => setTimeout(r, 250));
      const result = mode === "enc" ? encryptText(input, password) : decryptText(input, password);
      setOutput(result);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1400);
    } catch (e: any) {
      setErr(e?.message ?? "Operation failed");
    } finally { setBusy(null); }
  }

  async function paste() {
    try { setInput(await navigator.clipboard.readText()); } catch {}
  }
  async function copy() {
    try { await navigator.clipboard.writeText(output); } catch {}
  }
  function download() {
    const blob = new Blob([output], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "eclipse-text.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide uppercase opacity-80">Input</h3>
          <button onClick={paste} className="btn-ghost !px-3 !py-1.5 text-xs inline-flex items-center gap-1.5">
            <ClipboardPaste size={14} /> Paste
          </button>
        </div>
        <motion.textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type or paste the message to cipher…"
          rows={10}
          className="font-mono text-sm"
          whileFocus={{ scale: 1.005 }}
        />
        <div className="mt-4"><PasswordInput value={password} onChange={setPassword} /></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => run("enc")} disabled={!input || !password || !!busy} className="btn-neon inline-flex items-center gap-2">
            <Lock size={16} /> {busy === "enc" ? "Encrypting…" : "Encrypt"}
          </button>
          <button onClick={() => run("dec")} disabled={!input || !password || !!busy} className="btn-ghost inline-flex items-center gap-2">
            <Unlock size={16} /> {busy === "dec" ? "Decrypting…" : "Decrypt"}
          </button>
        </div>
      </div>

      <div className="glass relative rounded-2xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide uppercase opacity-80">Output</h3>
          <div className="flex gap-2">
            <button onClick={copy} disabled={!output} className="btn-ghost !px-3 !py-1.5 text-xs inline-flex items-center gap-1.5">
              <ClipboardCopy size={14} /> Copy
            </button>
            <button onClick={download} disabled={!output} className="btn-ghost !px-3 !py-1.5 text-xs inline-flex items-center gap-1.5">
              <Download size={14} /> Save
            </button>
          </div>
        </div>
        <textarea readOnly value={output} placeholder="Result appears here…" rows={14} className="font-mono text-sm" />
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: "0 0 0 2px var(--neon-3) inset, 0 0 60px color-mix(in oklch,var(--neon-3) 60%, transparent)" }}
          />
        )}
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      </div>
    </div>
  );
}
