"use client";

type Props = {
  onExecute?: () => void;
  onSave?: () => void;
  onReject?: () => void;
  disabled?: boolean;
};

export default function AgentActionBar({
  onExecute,
  onSave,
  onReject,
  disabled = false,
}: Props) {
  return (
    <div className="flex flex-wrap gap-3 pt-4">
      <button
        onClick={onExecute}
        disabled={disabled}
        className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
      >
        Execute
      </button>

      <button
        onClick={onSave}
        disabled={disabled}
        className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-2 text-sm text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
      >
        Save
      </button>

      <button
        onClick={onReject}
        disabled={disabled}
        className="rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2 text-sm text-red-200 hover:bg-red-500/20 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}