"use client";

type Props = {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  compact?: boolean;
};

export default function DemoModeToggle({
  enabled,
  onChange,
  compact = false,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={[
        "group inline-flex items-center gap-3 rounded-2xl border px-4 py-3 transition",
        enabled
          ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
        compact ? "text-sm" : "text-sm",
      ].join(" ")}
    >
      <span className="text-[11px] uppercase tracking-[0.24em] opacity-80">
        Demo Mode
      </span>

      <span
        className={[
          "relative inline-flex h-6 w-11 items-center rounded-full border transition",
          enabled
            ? "border-emerald-300/30 bg-emerald-400/20"
            : "border-white/10 bg-slate-900/80",
        ].join(" ")}
      >
        <span
          className={[
            "absolute h-4 w-4 rounded-full bg-white transition",
            enabled ? "left-6" : "left-1",
          ].join(" ")}
        />
      </span>

      <span className="font-medium">{enabled ? "ON" : "OFF"}</span>
    </button>
  );
}