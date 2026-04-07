"use client";

import type { InteractionHooks } from "../types/intelligence";

type Props = {
  hooks?: InteractionHooks | null;
  onAction?: (actionId: string) => void;
  compact?: boolean;
};

function resolveTone(actionId: string): string {
  if (actionId === "execute") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20";
  }

  if (actionId === "reject") {
    return "border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20";
  }

  return "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20";
}

export default function GeoPulseAgentActionBar({
  hooks,
  onAction,
  compact = false,
}: Props) {
  if (!hooks) {
    return null;
  }

  const actions = Array.isArray(hooks.actions) ? hooks.actions : [];

  if (
    !hooks.primary_recommendation &&
    actions.length === 0 &&
    !hooks.feedback_required
  ) {
    return null;
  }

  return (
    <section
      className={[
        "rounded-2xl border border-white/10 bg-white/[0.03]",
        compact ? "p-4" : "p-5",
      ].join(" ")}
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
            Interaction Hooks
          </div>

          {hooks.primary_recommendation ? (
            <div className="mt-3 text-sm text-slate-300">
              Primary recommendation:{" "}
              <span className="font-medium text-white">
                {hooks.primary_recommendation}
              </span>
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {hooks.alternatives_available ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Alternatives available
              </span>
            ) : null}

            {hooks.feedback_required ? (
              <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">
                Feedback required
              </span>
            ) : null}
          </div>
        </div>

        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => onAction?.(action.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${resolveTone(
                  action.id
                )}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}