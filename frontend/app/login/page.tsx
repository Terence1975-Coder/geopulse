"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Lock, PlayCircle, User } from "lucide-react";

export default function GeoPulseLoginPage() {
  const [username, setUsername] = useState("Beta1");
  const [password, setPassword] = useState("");

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(6,182,212,0.16),_transparent_30%),radial-gradient(circle_at_right,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(180deg,_#020617_0%,_#020617_100%)] text-white">
      <style jsx>{`
        @keyframes pageFadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logoGlowPulse {
          0%,
          100% {
            filter: drop-shadow(0 20px 60px rgba(6, 182, 212, 0.12))
              drop-shadow(0 30px 80px rgba(0, 0, 0, 0.55));
            transform: scale(1);
          }
          50% {
            filter: drop-shadow(0 24px 70px rgba(6, 182, 212, 0.22))
              drop-shadow(0 34px 88px rgba(0, 0, 0, 0.62));
            transform: scale(1.01);
          }
        }

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: translateX(16px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .page-enter {
          animation: pageFadeIn 0.7s ease-out both;
        }

        .logo-glow {
          animation: logoGlowPulse 4.5s ease-in-out infinite;
          transform-origin: center;
          will-change: transform, filter;
        }

        .card-enter {
          animation: cardFadeIn 0.8s ease-out both;
        }
      `}</style>

      <div className="page-enter mx-auto flex h-full max-w-[1600px] items-center px-6">
        <div className="grid w-full items-center gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="flex flex-col items-center justify-center text-center xl:items-start xl:text-left">
            <div className="logo-glow relative w-full max-w-[520px]">
              <Image
                src="/logo.png"
                alt="GeoPulse AI"
                width={900}
                height={900}
                priority
                className="w-full object-contain"
              />
            </div>

            <h1 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              Executive Intelligence Platform
            </h1>
          </section>

          <aside className="mx-auto w-full max-w-[420px]">
            <div className="card-enter rounded-[28px] border border-white/10 bg-white/[0.05] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20 hover:bg-white/[0.06] hover:shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Beta Access
              </div>

              <h2 className="mt-3 text-2xl font-semibold text-white">
                Welcome
              </h2>

              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-2 text-sm text-white/90">Username</div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 transition focus-within:border-cyan-400/30 focus-within:bg-slate-950/90">
                    <User className="h-4 w-4 text-slate-400" />
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm text-white/90">Password</div>
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 transition focus-within:border-cyan-400/30 focus-within:bg-slate-950/90">
                    <Lock className="h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm text-white outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Link
                  href="/demo"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:scale-[1.01] hover:bg-cyan-500/20"
                >
                  Login
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/demo"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-100 transition hover:scale-[1.01] hover:bg-emerald-500/20"
                >
                  <PlayCircle className="h-4 w-4" />
                  Open Demo
                </Link>

                <Link
                  href="/"
                  className="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:scale-[1.01] hover:bg-white/10"
                >
                  Enter Live Platform
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}