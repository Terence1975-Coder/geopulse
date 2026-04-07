"use client";

import { motion } from "framer-motion";
import { MOTION_TOKENS } from "../lib/motion-config";
import { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  eyebrow?: string;
  isFocused?: boolean;
  isDimmed?: boolean;
  onFocus?: (id: string) => void;
  children: ReactNode;
  className?: string;
};

export default function ExecutivePanel({
  id,
  title,
  eyebrow,
  isFocused,
  isDimmed,
  onFocus,
  children,
  className = "",
}: Props) {
  return (
    <motion.section
      layout
      onClick={() => onFocus?.(id)}
      whileHover={{ y: -4, scale: MOTION_TOKENS.scale.hover }}
      whileTap={{ scale: 0.995 }}
      animate={{
        scale: isFocused ? MOTION_TOKENS.scale.active : MOTION_TOKENS.scale.resting,
        opacity: isDimmed ? MOTION_TOKENS.opacity.dimmed : 1,
        z: isFocused ? 24 : 0,
      }}
      transition={{ duration: 0.35, ease: MOTION_TOKENS.ease.strategic }}
      className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/58 p-5 shadow-[0_24px_80px_rgba(2,6,23,.28)] backdrop-blur-xl ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.06),transparent_24%),linear-gradient(180deg,rgba(255,255,255,.03),transparent_38%)]" />
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">{eyebrow}</div>}
            <h2 className="mt-1 text-lg font-semibold text-white">{title}</h2>
          </div>
        </div>
        {children}
      </div>
    </motion.section>
  );
}