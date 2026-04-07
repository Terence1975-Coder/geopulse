"use client";

import { motion } from "framer-motion";
import type { CommandMode } from "../lib/motion-config";

type Props = {
  mode: CommandMode;
  onChange: (mode: CommandMode) => void;
};

export default function CommandModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-slate-900/70 p-1 backdrop-blur-xl">
      {(["executive", "command"] as CommandMode[]).map((item) => {
        const active = item === mode;
        return (
          <button
            key={item}
            onClick={() => onChange(item)}
            className="relative rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition"
          >
            {active && (
              <motion.span
                layoutId="mode-toggle-pill"
                className="absolute inset-0 rounded-full bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,.08),0_0_24px_rgba(56,189,248,.14)]"
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
              />
            )}
            <span className={`relative z-10 capitalize ${active ? "text-white" : "text-slate-400"}`}>
              {item} Mode
            </span>
          </button>
        );
      })}
    </div>
  );
}