export type MotionPreference = "strategic" | "reduced" | "immersive";
export type CommandMode = "executive" | "command";
export type SignalUrgency = "critical" | "opportunity" | "background";

export const MOTION_TOKENS = {
  duration: {
    instant: 0.16,
    quick: 0.28,
    standard: 0.45,
    deliberate: 0.85,
    ambient: 6,
    orbit: 12,
  },
  ease: {
    soft: [0.22, 1, 0.36, 1] as [number, number, number, number],
    strategic: [0.16, 1, 0.3, 1] as [number, number, number, number],
    calm: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  },
  glow: {
    critical: "0 0 0 1px rgba(248,113,113,.18), 0 0 28px rgba(245,158,11,.12)",
    opportunity: "0 0 0 1px rgba(34,197,94,.16), 0 0 24px rgba(59,130,246,.12)",
    neutral: "0 0 0 1px rgba(148,163,184,.14), 0 0 22px rgba(15,23,42,.18)",
    focus: "0 0 0 1px rgba(96,165,250,.2), 0 0 48px rgba(59,130,246,.12)",
  },
  scale: {
    resting: 1,
    hover: 1.012,
    active: 1.018,
    immersive: 1.025,
  },
  opacity: {
    dimmed: 0.92,
    backgroundSignal: 0.7,
    ambient: 0.035,
  },
  blur: {
    background: "blur(4px)",
    panel: "blur(16px)",
  },
};

export const COMMAND_MODE_MULTIPLIER: Record<CommandMode, number> = {
  executive: 1,
  command: 1.35,
};

export const getShouldReduceMotion = (
  preference: MotionPreference,
  browserReduceMotion?: boolean,
  lowPowerMode?: boolean
) => {
  if (preference === "reduced") return true;
  if (browserReduceMotion) return true;
  if (lowPowerMode) return true;
  return false;
};

export const getMotionProfile = (
  preference: MotionPreference,
  mode: CommandMode,
  browserReduceMotion?: boolean,
  lowPowerMode?: boolean
) => {
  const reduced = getShouldReduceMotion(preference, browserReduceMotion, lowPowerMode);
  const multiplier = reduced ? 0.35 : COMMAND_MODE_MULTIPLIER[mode];

  return {
    reduced,
    multiplier,
    pulseDuration: MOTION_TOKENS.duration.deliberate / multiplier,
    flowDuration: MOTION_TOKENS.duration.ambient / multiplier,
    orbitDuration: MOTION_TOKENS.duration.orbit / multiplier,
  };
};

export const freshnessTone = (minutesOld: number) => {
  if (minutesOld <= 10) {
    return {
      label: "ACTIVE WINDOW",
      tone: "text-sky-100",
      surface: "from-sky-500/18 via-cyan-400/8 to-transparent",
      ageClass: "fresh",
    };
  }

  if (minutesOld <= 60) {
    return {
      label: "MONITORED",
      tone: "text-slate-200",
      surface: "from-slate-400/12 via-slate-300/4 to-transparent",
      ageClass: "normal",
    };
  }

  return {
    label: "STRATEGIC MEMORY",
    tone: "text-slate-400",
    surface: "from-slate-600/10 via-slate-700/4 to-transparent",
    ageClass: "aged",
  };
};

export const urgencyMotion = (urgency: SignalUrgency, reduced: boolean) => {
  if (reduced) {
    return {
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.25 },
      className: "",
    };
  }

  if (urgency === "critical") {
    return {
      animate: {
        y: [0, -2, 0],
        boxShadow: [
          "0 0 0 1px rgba(248,113,113,.12), 0 0 16px rgba(245,158,11,.10)",
          "0 0 0 1px rgba(248,113,113,.24), 0 0 28px rgba(245,158,11,.14)",
          "0 0 0 1px rgba(248,113,113,.12), 0 0 16px rgba(245,158,11,.10)",
        ],
      },
      transition: {
        duration: 3.2,
        repeat: Infinity,
        ease: "easeInOut",
      },
      className: "before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-gradient-to-b before:from-red-400 before:via-amber-400 before:to-transparent",
    };
  }

  if (urgency === "opportunity") {
    return {
      animate: { y: [0, -1.5, 0], x: [0, 1.5, 0] },
      transition: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
      className: "",
    };
  }

  return {
    animate: { opacity: [0.92, 0.88, 0.92] },
    transition: { duration: 9, repeat: Infinity, ease: "easeInOut" },
    className: "",
  };
};