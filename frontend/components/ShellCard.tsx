import { PropsWithChildren } from "react";

export function ShellCard({ children }: PropsWithChildren) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
      {children}
    </div>
  );
}