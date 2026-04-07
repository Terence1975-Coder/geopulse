"use client";

import { motion } from "framer-motion";
import { freshnessTone, urgencyMotion } from "../lib/motion-config";

type Signal = {
  id: string;
  title: string;
  region: string;
  source: string;
  detectedAt: string;
  urgency: "critical" | "opportunity" | "background";
  summary: string;
};

type Props = {
  signals: Signal[];
  reduced?: boolean;
  commandMultiplier?: number;
};

function minutesOld(ts: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 60000));
}

export default function LiveSignalStream({ signals, reduced = false, commandMultiplier = 1 }: Props) {
  return (
    <div className="space-y-3">
      {signals.map((signal, index) => {
        const old = minutesOld(signal.detectedAt);
        const fresh = freshnessTone(old);
        const motion = urgencyMotion(signal.urgency, reduced);

        return (
          <motion.article
            key={signal.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: signal.urgency === "background" ? 0.78 : 1, x: 0, ...motion.animate }}
            transition={{
              opacity: { duration: 0.35 },
              x: { duration: 0.55, delay: index * 0.05 },
              ...(motion.transition as any),
            }}
            className={`relative overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.03] p-4 ${motion.className}`}
          >
            {!reduced && (
              <motion.div
                className="pointer-events-none absolute inset-y-0 right-[-20%] w-1/3 bg-gradient-to-l from-white/[0.04] to-transparent"
                animate={{ x: [0, -12 * commandMultiplier, 0] }}
                transition={{ duration: 16 / commandMultiplier, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                  <span>{signal.source}</span>
                  <span>·</span>
                  <span>{signal.region}</span>
                  <span>·</span>
                  <span>Detected {new Date(signal.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <h3 className="mt-2 text-base font-semibold text-white">{signal.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{signal.summary}</p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-slate-300">
                {signal.urgency}
              </div>
            </div>

            <div className={`mt-4 rounded-2xl border border-white/6 bg-gradient-to-r ${fresh.surface} px-3 py-3`}>
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="text-slate-300">Freshness: <span className={`${fresh.tone} font-medium`}>{fresh.label}</span></div>
                <div className="text-slate-400">{old}m ago</div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400/80 via-cyan-300/70 to-emerald-300/60"
                  initial={{ width: "100%" }}
                  animate={{ width: `${Math.max(12, 100 - Math.min(old, 100))}%` }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}