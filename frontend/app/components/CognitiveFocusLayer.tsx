"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  focusTarget: string | null;
};

export default function CognitiveFocusLayer({ focusTarget }: Props) {
  return (
    <AnimatePresence>
      {focusTarget && (
        <motion.div
          key={focusTarget}
          className="pointer-events-none absolute inset-0 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/10 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}