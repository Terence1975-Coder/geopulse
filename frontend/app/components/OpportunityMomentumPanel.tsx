"use client";

import { motion } from "framer-motion";

type Opportunity = {
  id: string;
  title: string;
  summary: string;
  valueScore: number;
  timePressure: string;
};

type Props = {
  items: Opportunity[];
  reduced?: boolean;
};

export default function OpportunityMomentumPanel({ items, reduced }: Props) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {items.map((item) => {
        const halo = item.valueScore >= 80;
        return (
          <motion.article
            key={item.id}
            whileHover={{ y: -4, rotateX: 1.5, rotateY: -1.2, scale: 1.01 }}
            className="relative overflow-hidden rounded-[24px] border border-emerald-300/12 bg-[linear-gradient(180deg,rgba(16,185,129,.08),rgba(2,6,23,.42))] p-5"
            style={{ transformStyle: "preserve-3d" }}
          >
            {halo && !reduced && (
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-[24px] border border-emerald-300/10"
                animate={{ opacity: [0.08, 0.22, 0.08], scale: [1, 1.018, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
              />
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-emerald-200/70">Opportunity Window</div>
                <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
              </div>
              <div className="rounded-full border border-emerald-300/15 bg-emerald-300/8 px-3 py-1 text-xs font-medium text-emerald-200">
                Value {item.valueScore}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-300">{item.summary}</p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">Time Pressure · {item.timePressure}</div>
              <motion.div
                animate={reduced ? undefined : { x: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                className="text-emerald-200"
              >
                →
              </motion.div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}