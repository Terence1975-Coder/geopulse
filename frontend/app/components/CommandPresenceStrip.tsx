"use client";

import { motion } from "framer-motion";

type Props = {
  riskScore: number;
  geopoliticalTension: number;
  opportunityMomentum: number;
  confidence: number;
  latencyMs: number;
  timeLabel: string;
  reduced?: boolean;
};

function Meter({ label, value, reduced = false }: { label: string; value: number; reduced?: boolean }) {
  return (
    <div className="min-w-[180px] flex-1">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-slate-400">
        <span>{label}</span>
        <span className="text-slate-200">{value}</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/6">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400/70 via-cyan-300/65 to-emerald-300/70"
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(6, Math.min(100, value))}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        {!reduced && (
          <motion.div
            className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-120%", "780%"] }}
            transition={{ duration: 5.4, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>
    </div>
  );
}

export default function CommandPresenceStrip(props: Props) {
  const { riskScore, geopoliticalTension, opportunityMomentum, confidence, latencyMs, timeLabel, reduced } = props;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-slate-950/60 px-5 py-4 backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,.10),transparent_24%)]" />

      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-slate-400">Command Presence</div>
            <div className="mt-1 text-lg font-semibold text-white">GeoPulse Executive Intelligence</div>
          </div>

          <div className="hidden h-10 w-px bg-white/10 lg:block" />

          <div className="hidden lg:block">
            <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-slate-400">Risk Pulse</div>
            <div className="relative h-8 w-40 overflow-hidden rounded-full border border-white/8 bg-white/5 px-3">
              <svg viewBox="0 0 160 32" className="h-full w-full">
                <motion.path
                  d="M0 18 C10 18, 14 6, 24 6 S38 26, 48 26 S62 12, 72 12 S86 24, 96 24 S110 8, 120 8 S134 20, 144 20 S154 14, 160 14"
                  fill="none"
                  stroke="rgba(125,211,252,.92)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  animate={reduced ? undefined : { x: [0, 6, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Meter label="Global Risk" value={riskScore} reduced={reduced} />
          <Meter label="Geopolitical Tension" value={geopoliticalTension} reduced={reduced} />
          <Meter label="Opportunity Momentum" value={opportunityMomentum} reduced={reduced} />
          <Meter label="System Confidence" value={confidence} reduced={reduced} />
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-300">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Clock</div>
            <div className="mt-1 font-medium text-white">{timeLabel}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Intel Latency</div>
            <div className="mt-1 font-medium text-white">{latencyMs}ms</div>
          </div>
        </div>
      </div>
    </div>
  );
}