"use client";

import { motion } from "framer-motion";

type Insight = {
  title: string;
  body: string;
};

type ActionCard = {
  title: string;
  impact: string;
};

type Props = {
  name: string;
  role: string;
  tone: "analyst" | "advisor";
  thinking?: boolean;
  insight: Insight;
  actions: ActionCard[];
  reduced?: boolean;
};

export default function AgentPresencePanel({ name, role, tone, thinking, insight, actions, reduced }: Props) {
  const roleGlow = tone === "advisor" ? "from-amber-400/20 via-red-300/10 to-transparent" : "from-sky-400/18 via-cyan-300/10 to-transparent";

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${roleGlow}`} />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-900/70">
              {!reduced && thinking && (
                <>
                  <motion.span
                    className="absolute inset-0 rounded-2xl border border-sky-300/20"
                    animate={{ scale: [1, 1.22, 1], opacity: [0.3, 0.05, 0.3] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.span
                    className="absolute h-2 w-2 rounded-full bg-sky-300/70"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                </>
              )}
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">AI</span>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">{name}</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">{role}</div>
            </div>
          </div>

          {thinking && <div className="text-[10px] uppercase tracking-[0.24em] text-sky-300">Thinking</div>}
        </div>

        <motion.div
          initial={{ opacity: 0.7, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="mt-4 rounded-[20px] border border-white/8 bg-slate-950/45 p-4"
        >
          <div className="text-[10px] uppercase tracking-[0.24em] text-slate-400">Strategic Insight</div>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="mt-2 text-base font-semibold text-white"
          >
            {insight.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12 }}
            className="mt-2 text-sm leading-6 text-slate-300"
          >
            {insight.body}
          </motion.p>
        </motion.div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {actions.map((action, i) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18 + i * 0.08 }}
              className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="text-sm font-medium text-white">{action.title}</div>
              <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">{action.impact}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}