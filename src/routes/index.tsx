import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { FileLock2, Image as ImageIcon, Music2, ShieldCheck, Type } from "lucide-react";
import { ParticleField } from "@/components/eclipse/ParticleField";
import { ThemeToggle } from "@/components/eclipse/ThemeToggle";
import { TextPanel } from "@/components/eclipse/TextPanel";
import { ImagePanel } from "@/components/eclipse/ImagePanel";
import { AudioPanel } from "@/components/eclipse/AudioPanel";
import { BinaryPanel } from "@/components/eclipse/BinaryPanel";

export const Route = createFileRoute("/")({ component: Index });

type TabId = "text" | "image" | "audio" | "binary";
const TABS: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: Music2 },
  { id: "binary", label: "Binary", icon: FileLock2 },
];

function Index() {
  const [tab, setTab] = useState<TabId>("text");

  return (
    <div className="relative min-h-screen">
      <div className="aurora" />
      <div className="grid-overlay" />
      <ParticleField />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <div className="relative grid h-9 w-9 place-items-center rounded-full neon-ring">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">
              <span className="neon-text">Eclipse</span> Cipher
            </h1>
            <p className="text-xs opacity-60">Client-side multimedia encryption</p>
          </div>
        </motion.div>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass mb-8 overflow-hidden rounded-3xl p-8 md:p-12"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs opacity-80">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "var(--neon-3)" }} />
            Zero servers · Zero uploads · Zero traces
          </p>
          <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
            Cipher every <span className="neon-text">pixel</span>, every <span className="neon-text">sample</span>, every <span className="neon-text">byte</span>.
          </h2>
          <p className="mt-4 max-w-2xl text-sm opacity-70 md:text-base">
            A cinematic, fully offline vault for your text, images, audio, and binaries. Format-preserving for PNG, BMP &amp; WAV, AES-256-GCM for everything else.
          </p>
        </motion.section>

        <div className="glass mb-6 flex flex-wrap gap-2 rounded-full p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className="tab-pill inline-flex items-center gap-2"
                data-active={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {tab === "text" && <TextPanel />}
            {tab === "image" && <ImagePanel />}
            {tab === "audio" && <AudioPanel />}
            {tab === "binary" && <BinaryPanel />}
          </motion.div>
        </AnimatePresence>

        <footer className="mt-16 text-center text-xs opacity-50">
          Eclipse Cipher · runs entirely in your browser · no data leaves this tab
        </footer>
      </main>
    </div>
  );
}
