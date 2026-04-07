"use client";

type Props = {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

export default function GeoPulseLogo({
  size = "md",
  showWordmark = true,
}: Props) {
  const sizeMap = {
      sm: "h-16",
	  md: "h-24",
      lg: "h-36",
    };

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-cyan-400/8 blur-xl" />

        <img
          src="/logo.png"
          alt="GeoPulse AI"
          className={`${sizeMap[size]} relative object-contain`}
        />
      </div>

      {showWordmark ? (
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-[0.18em] text-white">
            GeoPulse AI
          </div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
            Executive Intelligence
          </div>
        </div>
      ) : null}
    </div>
  );
}