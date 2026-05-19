import { motion } from "framer-motion";
import { Moon, Sparkles } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isGirl = theme === "girl";
  return (
    <button
      onClick={toggle}
      className="glass neon-ring relative flex items-center gap-2 rounded-full px-4 py-2 text-sm"
      aria-label="Toggle theme"
    >
      <motion.span
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2"
      >
        {isGirl ? <Sparkles size={16} /> : <Moon size={16} />}
        <span className="font-medium">{isGirl ? "Girl Mode" : "Boy Mode"}</span>
      </motion.span>
    </button>
  );
}
