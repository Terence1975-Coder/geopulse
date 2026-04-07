"use client";

import { motion } from "framer-motion";

type Props = {
  reduced?: boolean;
};

export default function AmbientIntelligenceBackground({ reduced = false }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-[-15%] opacity-[0.035]"
        animate={
          reduced
            ? undefined
            : {
                backgroundPosition: ["0% 0%", "100% 40%", "0% 100%"],
              }
        }
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(59,130,246,.35) 0, transparent 18%),
            radial-gradient(circle at 75% 40%, rgba(34,197,94,.28) 0, transparent 16%),
            radial-gradient(circle at 55% 72%, rgba(245,158,11,.24) 0, transparent 14%),
            linear-gradient(rgba(148,163,184,.16) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,.12) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 100% 100%, 120px 120px, 120px 120px",
          maskImage: "radial-gradient(circle at center, black, transparent 86%)",
        }}
      />

      <motion.div
        className="absolute inset-x-[-10%] top-[20%] h-[1px] bg-gradient-to-r from-transparent via-sky-300/25 to-transparent"
        animate={reduced ? undefined : { x: ["-4%", "4%", "-4%"] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-[-10%] bottom-[26%] h-[1px] bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent"
        animate={reduced ? undefined : { x: ["4%", "-3%", "4%"] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-sky-300/20 blur-[1px]"
        animate={reduced ? undefined : { scale: [1, 1.6, 1], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[18%] top-[38%] h-2 w-2 rounded-full bg-emerald-300/20 blur-[1px]"
        animate={reduced ? undefined : { scale: [1, 1.5, 1], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[52%] bottom-[16%] h-2 w-2 rounded-full bg-amber-300/20 blur-[1px]"
        animate={reduced ? undefined : { scale: [1, 1.45, 1], opacity: [0.18, 0.42, 0.18] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}