type AgentSectionProps = {
  title: string;
  items?: string[];
  text?: string;
  muted?: boolean;
};

export default function AgentSection({
  title,
  items,
  text,
  muted = false,
}: AgentSectionProps) {
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasText = !!text?.trim();

  if (!hasItems && !hasText) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
        {title}
      </h3>

      {hasText ? (
        <p className={`text-sm leading-6 ${muted ? "text-white/65" : "text-white/85"}`}>
          {text}
        </p>
      ) : null}

      {hasItems ? (
        <ul className="space-y-2">
          {items!.map((item, index) => (
            <li
              key={`${title}-${index}`}
              className={`flex gap-3 text-sm leading-6 ${
                muted ? "text-white/65" : "text-white/85"
              }`}
            >
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}