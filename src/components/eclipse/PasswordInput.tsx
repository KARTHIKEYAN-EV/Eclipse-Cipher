import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound } from "lucide-react";

function strength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: "empty" };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 14) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  const labels = ["very weak", "weak", "fair", "strong", "very strong", "elite"];
  return { score: s, label: labels[s] ?? "elite" };
}

export function PasswordInput({
  value,
  onChange,
  placeholder = "Cipher password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const { score, label } = strength(value);
  const pct = Math.min(100, (score / 5) * 100);
  return (
    <div className="space-y-2">
      <div className="relative">
        <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="!pl-9 !pr-11"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 opacity-70 hover:opacity-100"
          aria-label="Toggle visibility"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full"
            style={{
              background: "linear-gradient(90deg,var(--neon-1),var(--neon-2),var(--neon-3))",
            }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <span className="text-xs opacity-70">{label}</span>
      </div>
    </div>
  );
}
